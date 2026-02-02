/**
 * Composable for FileSystem CRUD operations and API interactions.
 */
import type {
    FileElement,
    FileSystemElement,
    FileUrlsMap,
    FolderElement,
    MoveProgress,
    NewFileTemplate,
    NewFolderTemplate,
    ReferenceElement,
    SubmodelElementData,
    UploadProgress,
} from '../types';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useRequestHandling } from '@/composables/RequestHandling';
import { convertFileNameToIdentifier, createThumbnail, mimeToExtension } from '@/utils/FileHandling';

export function useFileSystemOperations(submodelElementData: () => SubmodelElementData) {
    const route = useRoute();
    const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling();

    // Reactive state
    const fileObjects = ref<FileSystemElement[]>([]);
    const fileUrls = ref<FileUrlsMap>({});
    const loading = ref(false);
    const isUploading = ref(false);
    const isMoving = ref(false);
    const uploadProgress = ref<UploadProgress>({ current: 0, total: 0, fileName: '' });
    const moveProgress = ref<MoveProgress>({ current: 0, total: 0, itemName: '' });

    /**
     * Get the current file path from route query
     */
    const getCurrentFilePath = (): string => {
        return (route.query.filePath as string) || '';
    };

    /**
     * Check if currently on a subpath (not root)
     */
    const isOnASubpath = (): boolean => {
        return getCurrentFilePath().length > 0;
    };

    /**
     * Build the API path for submodel elements
     */
    const buildElementPath = (filePath: string = '', elementIdShort?: string): string => {
        const basePath = submodelElementData().path + '/submodel-elements';
        if (elementIdShort) {
            return basePath + '/' + (filePath ? `${filePath}.` : '') + elementIdShort;
        }
        return basePath + (filePath ? `/${filePath}` : '');
    };

    /**
     * Fetch files/folders from the current path
     */
    const fetchFiles = async (filePath: string = ''): Promise<void> => {
        const data = submodelElementData();
        if (!data) return;

        const path = buildElementPath(filePath);
        const context = 'Fetching file elements';
        const response = await getRequest(path, context, false);

        if (response.success) {
            fileObjects.value = [];
            const submodelElements = filePath ? response.data.value : response.data.result;

            // Add navigation element if on subpath
            if (isOnASubpath()) {
                fileObjects.value.push({
                    idShort: '...',
                    modelType: 'NavigationElement',
                } as FileSystemElement);
            }

            if (!submodelElements) return;

            // Filter for files and folders with correct semantic ID
            const filteredElements = submodelElements.filter(
                (element: FileSystemElement) =>
                    element.modelType === 'File' ||
                    (element.modelType === 'SubmodelElementCollection' &&
                        element.semanticId?.keys?.some((key) => key.value === 'https://basyx.org/submodels/Folder')) ||
                    element.modelType === 'NavigationElement'
            );

            // Sort: folders first, then files (alphabetically within each group)
            filteredElements.sort((a: FileSystemElement, b: FileSystemElement) => {
                if (a.modelType === 'SubmodelElementCollection' && b.modelType !== 'SubmodelElementCollection') {
                    return -1;
                }
                if (a.modelType !== 'SubmodelElementCollection' && b.modelType === 'SubmodelElementCollection') {
                    return 1;
                }
                return (a.idShort || '').localeCompare(b.idShort || '');
            });

            // Fetch file URLs for display
            filteredElements.forEach((file: FileSystemElement) => {
                if (file.modelType === 'File') {
                    getFileUrl(file.idShort);
                }
                fileObjects.value.push(file);
            });
        }
    };

    /**
     * Get file URL/blob for preview
     */
    const getFileUrl = async (idShort: string): Promise<void> => {
        const currentPath = getCurrentFilePath();
        const path = buildElementPath(currentPath, idShort) + '/attachment';
        const context = 'Fetching File';
        const response = await getRequest(path, context, false);

        if (response.success) {
            const blob = response.data as Blob;
            if (blob && blob instanceof Blob && blob.type?.startsWith('image/')) {
                createThumbnail(blob, 512, (thumbnailUrl: string) => {
                    fileUrls.value[idShort] = thumbnailUrl;
                });
            } else if (blob && blob instanceof Blob) {
                fileUrls.value[idShort] = URL.createObjectURL(blob).toString();
            }
        }
    };

    /**
     * Upload multiple files
     */
    const uploadFiles = async (files: File[]): Promise<void> => {
        if (!files || files.length === 0) return;

        const filePath = getCurrentFilePath();
        loading.value = true;
        isUploading.value = true;
        uploadProgress.value = { current: 0, total: files.length, fileName: '' };

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            uploadProgress.value = { current: i + 1, total: files.length, fileName: file.name };

            try {
                const path = buildElementPath(filePath);
                const idShort = convertFileNameToIdentifier(file.name);
                const fileSME: NewFileTemplate = {
                    idShort,
                    modelType: 'File',
                    contentType: file.type,
                    value: '',
                };

                const body = JSON.stringify(fileSME);
                const headers = new Headers();
                headers.append('Content-Type', 'application/json');
                headers.append('accept', 'application/json');

                const response = await postRequest(path, body, headers, 'Adding File Element to Submodel', true);
                if (response.success) {
                    const fullPath = filePath ? `${filePath}.${idShort}` : idShort;
                    await addAttachmentFile(file, fullPath);
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }

        loading.value = false;
        isUploading.value = false;
        uploadProgress.value = { current: 0, total: 0, fileName: '' };
        await fetchFiles(filePath);
    };

    /**
     * Add attachment to a file element
     */
    const addAttachmentFile = async (file: File, idShort: string): Promise<void> => {
        const path = submodelElementData().path + '/submodel-elements/' + idShort + '/attachment';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);

        const headers = new Headers();
        headers.append('accept', 'application/json');

        await putRequest(path, formData, headers, 'Adding Attachment File to File Element', false);
    };

    /**
     * Delete a single element
     */
    const deleteElement = async (element: FileSystemElement): Promise<void> => {
        const filePath = getCurrentFilePath();
        const path = buildElementPath(filePath, element.idShort);
        const response = await deleteRequest(path, 'Deleting File', false);

        if (response.success) {
            await fetchFiles(filePath);
        }
    };

    /**
     * Delete multiple elements
     */
    const deleteElements = async (elements: FileSystemElement[]): Promise<void> => {
        const filePath = getCurrentFilePath();

        for (const item of elements) {
            const path = buildElementPath(filePath, item.idShort);
            await deleteRequest(path, 'Deleting Element', true);
        }

        await fetchFiles(filePath);
    };

    /**
     * Create a new folder
     */
    const createFolder = async (): Promise<void> => {
        const filePath = getCurrentFilePath();
        const newFolderTemplate: NewFolderTemplate = {
            idShort: 'FOLDER_' + Date.now(),
            modelType: 'SubmodelElementCollection',
            value: [],
            displayName: [{ language: 'de', text: 'New Folder' }],
            semanticId: {
                keys: [{ type: 'GlobalReference', value: 'https://basyx.org/submodels/Folder' }],
                type: 'ExternalReference',
            },
        };

        const path = buildElementPath(filePath);
        const body = JSON.stringify(newFolderTemplate);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const response = await postRequest(path, body, headers, 'Creating new folder in File Submodel', false);
        if (response.success) {
            await fetchFiles(filePath);
        }
    };

    /**
     * Update folder name
     */
    const saveFolderName = async (folder: FolderElement, newName: string): Promise<void> => {
        const nameEntry = folder.displayName?.find((name) => name.language === 'de');
        if (nameEntry) {
            nameEntry.text = newName;
        } else {
            if (!folder.displayName) folder.displayName = [];
            folder.displayName.push({ language: 'de', text: newName });
        }

        const queryPath = getCurrentFilePath();
        const path =
            submodelElementData().path +
            '/submodel-elements/' +
            (queryPath.length === 0 ? folder.idShort : `.${folder.idShort}`);

        const body = JSON.stringify(folder);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const response = await putRequest(path, body, headers, 'Updating Folder Name', false);
        if (response.success) {
            await fetchFiles(queryPath);
        }
    };

    /**
     * Get display name for an element by path from server
     */
    const getDisplayNameByPath = async (idShortPath: string): Promise<string> => {
        const path = submodelElementData().path + '/submodel-elements/' + idShortPath;
        let displayName = idShortPath;

        const response = await getRequest(path, 'Fetching Submodel Element for Display Name', true);
        if (response.success) {
            const element = response.data;
            if (element.displayName) {
                const nameEntry = element.displayName.find((name: { language: string }) => name.language === 'de');
                if (nameEntry) {
                    displayName = nameEntry.text;
                }
            }
        }

        return displayName;
    };

    /**
     * Move element to a target folder
     */
    const moveElementToFolder = async (element: FileSystemElement, targetFolder: FolderElement): Promise<void> => {
        try {
            const currentPath = getCurrentFilePath();
            const sourcePath = buildElementPath(currentPath, element.idShort);

            // Fetch element data
            const response = await getRequest(sourcePath, 'Fetching element data for move', true);
            if (!response.success) {
                console.error('Failed to fetch element data');
                return;
            }

            const elementData = response.data;
            const isFile = elementData.modelType === 'File';
            let fileBlob: Blob | null = null;

            // Get attachment if it's a file
            if (isFile) {
                const attachmentResponse = await getRequest(
                    sourcePath + '/attachment',
                    'Fetching file attachment',
                    true
                );
                if (attachmentResponse.success) {
                    fileBlob = attachmentResponse.data as Blob;
                }
            }

            // Check for naming conflicts in target folder
            const targetFolderPath = buildElementPath(currentPath, targetFolder.idShort);
            const checkResponse = await getRequest(targetFolderPath, 'Checking target folder', true);
            if (checkResponse.success) {
                const existingElements = checkResponse.data.value || [];
                const conflictingElement = existingElements.find(
                    (el: FileSystemElement) => el.idShort === elementData.idShort
                );
                if (conflictingElement) {
                    elementData.idShort = `${elementData.idShort}_${Date.now()}`;
                }
            }

            // Create element in target folder
            const body = JSON.stringify(elementData);
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            const createResponse = await postRequest(
                targetFolderPath,
                body,
                headers,
                'Moving element to folder',
                false
            );

            if (createResponse.success) {
                // Upload attachment to new location
                if (isFile && fileBlob) {
                    const newIdShortPath =
                        (currentPath ? `${currentPath}.${targetFolder.idShort}.` : `${targetFolder.idShort}.`) +
                        elementData.idShort;
                    await addAttachmentFile(
                        new File([fileBlob], getFullFileName(element as FileElement), {
                            type: elementData.contentType,
                        }),
                        newIdShortPath
                    );
                }

                // Delete from original location
                await deleteRequest(sourcePath, 'Removing element from original location', true);
            }
        } catch (error) {
            console.error('Error moving element:', error);
        }
    };

    /**
     * Move element up one level
     */
    const moveElementUp = async (element: FileSystemElement): Promise<void> => {
        try {
            const currentPath = getCurrentFilePath();
            if (!currentPath) return; // Already at root

            const sourcePath = submodelElementData().path + '/submodel-elements/' + `${currentPath}.${element.idShort}`;

            // Fetch element data
            const response = await getRequest(sourcePath, 'Fetching element data for move up', true);
            if (!response.success) {
                console.error('Failed to fetch element data');
                return;
            }

            const elementData = response.data;
            const isFile = elementData.modelType === 'File';
            let fileBlob: Blob | null = null;

            // Get attachment if it's a file
            if (isFile) {
                const attachmentResponse = await getRequest(
                    sourcePath + '/attachment',
                    'Fetching file attachment',
                    true
                );
                if (attachmentResponse.success) {
                    fileBlob = attachmentResponse.data as Blob;
                }
            }

            // Calculate parent path
            const pathParts = currentPath.split('.');
            pathParts.pop();
            const parentPath = pathParts.join('.');

            // Check for naming conflicts in parent folder
            const targetPath = submodelElementData().path + '/submodel-elements' + (parentPath ? `/${parentPath}` : '');
            const checkResponse = await getRequest(targetPath, 'Checking parent folder', true);
            if (checkResponse.success) {
                const parentFolderData = parentPath ? checkResponse.data : { result: checkResponse.data.result };
                const existingElements = parentFolderData.value || parentFolderData.result || [];
                const conflictingElement = existingElements.find(
                    (el: FileSystemElement) => el.idShort === elementData.idShort
                );
                if (conflictingElement) {
                    elementData.idShort = `${elementData.idShort}_${Date.now()}`;
                }
            }

            // Create element in parent folder
            const body = JSON.stringify(elementData);
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            const createResponse = await postRequest(targetPath, body, headers, 'Moving element up one level', false);

            if (createResponse.success) {
                // Upload attachment to new location
                if (isFile && fileBlob) {
                    const newIdShortPath = (parentPath ? `${parentPath}.` : '') + elementData.idShort;
                    await addAttachmentFile(
                        new File([fileBlob], getFullFileName(element as FileElement), {
                            type: elementData.contentType,
                        }),
                        newIdShortPath
                    );
                }

                // Delete from original location
                await deleteRequest(sourcePath, 'Removing element from original location', true);
            }
        } catch (error) {
            console.error('Error moving element up:', error);
        }
    };

    /**
     * Move multiple items with progress tracking
     */
    const moveItems = async (items: FileSystemElement[], targetFolder: FileSystemElement): Promise<void> => {
        isMoving.value = true;
        moveProgress.value = { current: 0, total: items.length, itemName: '' };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            moveProgress.value = { current: i + 1, total: items.length, itemName: item.idShort };

            if (targetFolder.modelType === 'NavigationElement') {
                await moveElementUp(item);
            } else {
                await moveElementToFolder(item, targetFolder as FolderElement);
            }
        }

        isMoving.value = false;
        moveProgress.value = { current: 0, total: 0, itemName: '' };
        await fetchFiles(getCurrentFilePath());
    };

    /**
     * Get full file name with extension
     */
    const getFullFileName = (file: FileElement): string => {
        if (!file) return '';
        const extension = mimeToExtension(file.contentType);
        return `${file.idShort}.${extension}`;
    };

    /**
     * Get folder display name
     */
    const getFolderName = (element: FileSystemElement): string => {
        if (element.displayName) {
            const nameEntry = element.displayName.find((name) => name.language === 'de');
            if (nameEntry) return nameEntry.text;
        }
        return element.idShort;
    };

    /**
     * Get folder element count
     */
    const getFolderElementCount = (folder: FileSystemElement): number => {
        if (folder.modelType !== 'SubmodelElementCollection') return 0;
        return (folder as FolderElement).value?.length || 0;
    };

    // Preview collection / startscreen methods
    const changeStartscreenState = async (state: boolean, file: FileElement): Promise<void> => {
        const data = submodelElementData();
        const previewCollection = data.submodelElements?.find((element) => element.idShort === 'PreviewCollection') as
            | FolderElement
            | undefined;

        if (!previewCollection) return;

        const referenceElement = previewCollection.value?.find((el) => el.idShort === file.idShort);

        if (state && !referenceElement) {
            const reference: ReferenceElement = {
                idShort: file.idShort,
                modelType: 'ReferenceElement',
                value: {
                    keys: [
                        { type: 'Submodel', value: data.id || '' },
                        { type: 'File', value: file.idShort },
                    ],
                },
            };
            if (!previewCollection.value) previewCollection.value = [];
            previewCollection.value.push(reference as unknown as FileSystemElement);
            await addReferenceElement(reference);
        } else if (!state && referenceElement) {
            previewCollection.value = previewCollection.value.filter((el) => el.idShort !== file.idShort);
            if (previewCollection.value.length === 0) {
                previewCollection.value = [];
            }
            await removeReferenceElement(referenceElement as unknown as ReferenceElement);
        }
    };

    const getPreviewState = (file: FileElement): boolean => {
        const previewCollection = submodelElementData().submodelElements?.find(
            (element) => element.idShort === 'PreviewCollection'
        ) as FolderElement | undefined;

        const referenceElement = previewCollection?.value?.find((el) => el.idShort === file.idShort);
        return !!referenceElement;
    };

    const addReferenceElement = async (reference: ReferenceElement): Promise<void> => {
        const path = submodelElementData().path + '/submodel-elements/PreviewCollection';
        const body = JSON.stringify(reference);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        await postRequest(path, body, headers, 'Adding ReferenceElement to PreviewCollection', false);
    };

    const removeReferenceElement = async (reference: ReferenceElement): Promise<void> => {
        const path = submodelElementData().path + '/submodel-elements/PreviewCollection.' + reference.idShort;
        await deleteRequest(path, 'Removing ReferenceElement from PreviewCollection', false);
    };

    return {
        // State
        fileObjects,
        fileUrls,
        loading,
        isUploading,
        isMoving,
        uploadProgress,
        moveProgress,

        // Methods
        getCurrentFilePath,
        isOnASubpath,
        fetchFiles,
        getFileUrl,
        uploadFiles,
        addAttachmentFile,
        deleteElement,
        deleteElements,
        createFolder,
        saveFolderName,
        getDisplayNameByPath,
        moveElementToFolder,
        moveElementUp,
        moveItems,
        getFullFileName,
        getFolderName,
        getFolderElementCount,
        changeStartscreenState,
        getPreviewState,
    };
}
