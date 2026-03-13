/**
 * TypeScript types and interfaces for the FileSystem plugin component.
 */

/**
 * Supported model types for file system elements
 */
export type FileSystemModelType = 'File' | 'SubmodelElementCollection' | 'NavigationElement';

/**
 * Language-specific display name entry
 */
export interface DisplayNameEntry {
    language: string;
    text: string;
}

/**
 * Semantic ID key structure
 */
export interface SemanticIdKey {
    type: string;
    value: string;
}

/**
 * Semantic ID structure for AAS elements
 */
export interface SemanticId {
    keys: SemanticIdKey[];
    type: string;
}

/**
 * Base interface for file system elements
 */
export interface FileSystemElementBase {
    idShort: string;
    modelType: FileSystemModelType;
    displayName?: DisplayNameEntry[];
    semanticId?: SemanticId;
}

/**
 * File element in the file system
 */
export interface FileElement extends FileSystemElementBase {
    modelType: 'File';
    contentType: string;
    value: string;
}

/**
 * Folder element (SubmodelElementCollection) in the file system
 */
export interface FolderElement extends FileSystemElementBase {
    modelType: 'SubmodelElementCollection';
    value: FileSystemElement[];
}

/**
 * Navigation element (virtual element for navigating up)
 */
export interface NavigationElement extends FileSystemElementBase {
    modelType: 'NavigationElement';
}

/**
 * Union type for all file system elements
 */
export type FileSystemElement = FileElement | FolderElement | NavigationElement;

/**
 * Breadcrumb item for path navigation
 */
export interface BreadcrumbItem {
    title: string;
    disabled: boolean;
    to: {
        query: Record<string, string>;
    };
    index: number;
}

/**
 * Progress state for file uploads
 */
export interface UploadProgress {
    current: number;
    total: number;
    fileName: string;
}

/**
 * Progress state for moving items
 */
export interface MoveProgress {
    current: number;
    total: number;
    itemName: string;
}

/**
 * Table header configuration for list view
 */
export interface TableHeader {
    title: string;
    key: string;
    sortable?: boolean;
    align?: 'start' | 'center' | 'end';
    width?: string;
}

/**
 * Reference element for preview collection
 */
export interface ReferenceElement {
    idShort: string;
    modelType: 'ReferenceElement';
    value: {
        keys: Array<{
            type: string;
            value: string;
        }>;
    };
}

/**
 * Props for the FileSystem component
 */
export interface FileSystemProps {
    defaultView?: number;
    submodelElementData: SubmodelElementData;
    acceptedFiles?: string;
    allowStartscreen?: boolean;
    title?: string;
}

/**
 * Submodel element data passed to the FileSystem component
 */
export interface SubmodelElementData {
    id?: string;
    path: string;
    submodelElements?: FileSystemElement[];
}

/**
 * Response from file system API requests
 */
export interface FileSystemResponse<T = unknown> {
    success: boolean;
    data?: T;
}

/**
 * Folder template for creating new folders
 */
export interface NewFolderTemplate {
    idShort: string;
    modelType: 'SubmodelElementCollection';
    value: never[];
    displayName: DisplayNameEntry[];
    semanticId: SemanticId;
}

/**
 * File SME template for creating new file elements
 */
export interface NewFileTemplate {
    idShort: string;
    modelType: 'File';
    contentType: string;
    value: string;
}

/**
 * Content type categories for display purposes
 */
export type ContentTypeCategory = 'image' | 'video' | 'pdf' | 'json' | 'xml' | 'unknown';

/**
 * File URLs mapping (idShort -> URL)
 */
export type FileUrlsMap = Record<string, string>;

/**
 * Drag and drop state
 */
export interface DragDropState {
    draggedItems: FileSystemElement[];
    dragOverFolder: string | null;
    isExternalDragOver: boolean;
}

/**
 * Selection state
 */
export interface SelectionState {
    selectedItems: FileSystemElement[];
}

/**
 * Dialog states
 */
export interface DialogStates {
    uploadDialog: boolean;
    folderNamingDialog: boolean;
    deleteElementDialog: boolean;
    previewDialog: boolean;
}

/**
 * Constants for the FileSystem component
 */
export const FILE_SYSTEM_CONSTANTS = {
    FOLDER_SEMANTIC_ID: 'https://basyx.org/submodels/Folder',
    DEFAULT_LANGUAGE: 'de',
    VIEW_GALLERY: 0,
    VIEW_LIST: 1,
} as const;

/**
 * Default table headers for list view
 */
export const DEFAULT_TABLE_HEADERS: TableHeader[] = [
    { title: '', key: 'selection', sortable: false, width: '50px' },
    { title: 'Name', key: 'idShort' },
    { title: 'Type', key: 'contentType' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '200px' },
];
