/**
 * Composable for drag and drop functionality in the FileSystem component.
 */
import type { FileSystemElement } from '../types';
import { type Ref, ref } from 'vue';

export interface UseDragAndDropOptions {
    selectedItems: Ref<FileSystemElement[]>;
    acceptedFiles?: string;
    onMoveItems: (items: FileSystemElement[], targetFolder: FileSystemElement) => Promise<void>;
    onExternalFileDrop: (files: File[]) => Promise<void>;
    isItemSelected: (item: FileSystemElement) => boolean;
}

export function useDragAndDrop(options: UseDragAndDropOptions) {
    const { selectedItems, acceptedFiles, onMoveItems, onExternalFileDrop, isItemSelected } = options;

    // Reactive state
    const draggedItems = ref<FileSystemElement[]>([]);
    const dragOverFolder = ref<string | null>(null);
    const isExternalDragOver = ref<boolean>(false);

    /**
     * Handle drag start event
     */
    const handleDragStart = (event: DragEvent, item: FileSystemElement): void => {
        // If the dragged item is selected, drag all selected items
        // Otherwise, just drag this single item
        if (isItemSelected(item) && selectedItems.value.length > 1) {
            draggedItems.value = [...selectedItems.value];
        } else {
            draggedItems.value = [item];
        }

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', draggedItems.value.map((i) => i.idShort).join(','));

            // Set drag image text for multiple items
            if (draggedItems.value.length > 1) {
                const dragImage = document.createElement('div');
                dragImage.textContent = `${draggedItems.value.length} Elemente`;
                dragImage.style.cssText =
                    'position: absolute; top: -1000px; padding: 8px 16px; background: #2196f3; color: white; border-radius: 4px; font-weight: 500;';
                document.body.appendChild(dragImage);
                event.dataTransfer.setDragImage(dragImage, 0, 0);
                setTimeout(() => document.body.removeChild(dragImage), 0);
            }
        }
    };

    /**
     * Handle drag end event
     */
    const handleDragEnd = (): void => {
        draggedItems.value = [];
        dragOverFolder.value = null;
    };

    /**
     * Handle drag over a folder target
     */
    const handleDragOver = (event: DragEvent, targetFolder: FileSystemElement): void => {
        event.preventDefault();

        // Don't allow dropping on itself or if one of the dragged items is the target
        const isDroppingOnSelf = draggedItems.value.some((item) => item.idShort === targetFolder.idShort);
        if (draggedItems.value.length > 0 && !isDroppingOnSelf) {
            dragOverFolder.value = targetFolder.idShort;
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'move';
            }
        }
    };

    /**
     * Handle drag leave from a folder target
     */
    const handleDragLeave = (event: DragEvent, targetFolder: FileSystemElement): void => {
        if (
            event.currentTarget === event.target ||
            !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)
        ) {
            if (dragOverFolder.value === targetFolder.idShort) {
                dragOverFolder.value = null;
            }
        }
    };

    /**
     * Handle drop on a folder target
     */
    const handleDrop = async (event: DragEvent, targetFolder: FileSystemElement): Promise<void> => {
        event.preventDefault();
        event.stopPropagation();
        dragOverFolder.value = null;

        // Copy items immediately as dragend may clear them
        const itemsToMove = [...draggedItems.value];
        draggedItems.value = [];

        if (itemsToMove.length === 0) return;

        // Don't allow dropping on itself
        const isDroppingOnSelf = itemsToMove.some((item) => item.idShort === targetFolder.idShort);
        if (isDroppingOnSelf) return;

        await onMoveItems(itemsToMove, targetFolder);
    };

    /**
     * Handle external file drag over the drop zone
     */
    const handleExternalDragOver = (event: DragEvent): void => {
        // Only show drop zone for external files (not internal drag)
        if (draggedItems.value.length > 0) return;

        if (event.dataTransfer?.types.includes('Files')) {
            isExternalDragOver.value = true;
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
        }
    };

    /**
     * Handle external file drag leave from the drop zone
     */
    const handleExternalDragLeave = (event: DragEvent): void => {
        // Only reset if we're leaving the drop zone entirely
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;

        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            isExternalDragOver.value = false;
        }
    };

    /**
     * Handle external file drop
     */
    const handleExternalDrop = async (event: DragEvent): Promise<void> => {
        isExternalDragOver.value = false;

        // If this is an internal drag operation, let the other handlers deal with it
        if (draggedItems.value.length > 0) return;

        const fileElements = event.dataTransfer?.files;
        if (!fileElements || fileElements.length === 0) return;

        // Filter files based on acceptedFiles prop if specified
        const fileArray = Array.from(fileElements);
        const validFiles = acceptedFiles
            ? fileArray.filter((file) => {
                  const acceptedTypes = acceptedFiles.split(',').map((t) => t.trim());
                  return acceptedTypes.some((type) => {
                      if (type.startsWith('.')) {
                          // Extension match
                          return file.name.toLowerCase().endsWith(type.toLowerCase());
                      } else if (type.endsWith('/*')) {
                          // MIME type wildcard (e.g., image/*)
                          const baseType = type.replace('/*', '');
                          return file.type.startsWith(baseType);
                      } else {
                          // Exact MIME type match
                          return file.type === type;
                      }
                  });
              })
            : fileArray;

        if (validFiles.length === 0) return;

        await onExternalFileDrop(validFiles);
    };

    /**
     * Check if a folder is currently being dragged over
     */
    const isDragOverFolder = (folderId: string): boolean => {
        return dragOverFolder.value === folderId;
    };

    /**
     * Check if currently dragging items
     */
    const isDragging = (): boolean => {
        return draggedItems.value.length > 0;
    };

    return {
        // State
        draggedItems,
        dragOverFolder,
        isExternalDragOver,

        // Methods
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleExternalDragOver,
        handleExternalDragLeave,
        handleExternalDrop,
        isDragOverFolder,
        isDragging,
    };
}
