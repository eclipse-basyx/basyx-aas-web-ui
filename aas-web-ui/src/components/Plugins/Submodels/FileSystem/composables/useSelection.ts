/**
 * Composable for multi-selection functionality in the FileSystem component.
 */
import type { FileSystemElement } from '../types';
import { computed, type Ref, ref } from 'vue';

export interface UseSelectionOptions {
    fileObjects: Ref<FileSystemElement[]>;
}

export function useSelection(options: UseSelectionOptions) {
    const { fileObjects } = options;

    // Reactive state
    const selectedItems = ref<FileSystemElement[]>([]);

    /**
     * Get all selectable items (excluding navigation elements)
     */
    const selectableItems = computed(() => {
        return fileObjects.value.filter((item) => item.modelType !== 'NavigationElement');
    });

    /**
     * Check if all selectable items are selected
     */
    const isAllSelected = computed(() => {
        return selectableItems.value.length > 0 && selectedItems.value.length === selectableItems.value.length;
    });

    /**
     * Check if some (but not all) items are selected
     */
    const isSomeSelected = computed(() => {
        return selectedItems.value.length > 0;
    });

    /**
     * Check if a specific item is selected
     */
    const isItemSelected = (item: FileSystemElement): boolean => {
        return selectedItems.value.some((selected) => selected.idShort === item.idShort);
    };

    /**
     * Toggle selection of all items
     */
    const toggleSelectAll = (): void => {
        if (isAllSelected.value) {
            selectedItems.value = [];
        } else {
            selectedItems.value = [...selectableItems.value];
        }
    };

    /**
     * Toggle selection of a specific item
     */
    const toggleItemSelection = (item: FileSystemElement): void => {
        // Don't allow selecting navigation elements
        if (item.modelType === 'NavigationElement') return;

        const index = selectedItems.value.findIndex((selected) => selected.idShort === item.idShort);
        if (index === -1) {
            selectedItems.value.push(item);
        } else {
            selectedItems.value.splice(index, 1);
        }
    };

    /**
     * Select a single item (replacing current selection)
     */
    const selectItem = (item: FileSystemElement): void => {
        if (item.modelType === 'NavigationElement') return;
        selectedItems.value = [item];
    };

    /**
     * Add an item to the selection
     */
    const addToSelection = (item: FileSystemElement): void => {
        if (item.modelType === 'NavigationElement') return;
        if (!isItemSelected(item)) {
            selectedItems.value.push(item);
        }
    };

    /**
     * Remove an item from the selection
     */
    const removeFromSelection = (item: FileSystemElement): void => {
        const index = selectedItems.value.findIndex((selected) => selected.idShort === item.idShort);
        if (index !== -1) {
            selectedItems.value.splice(index, 1);
        }
    };

    /**
     * Clear all selections
     */
    const clearSelection = (): void => {
        selectedItems.value = [];
    };

    /**
     * Get the count of selected items
     */
    const selectionCount = computed(() => selectedItems.value.length);

    /**
     * Check if selection is not empty
     */
    const hasSelection = computed(() => selectedItems.value.length > 0);

    return {
        // State
        selectedItems,

        // Computed
        selectableItems,
        isAllSelected,
        isSomeSelected,
        selectionCount,
        hasSelection,

        // Methods
        isItemSelected,
        toggleSelectAll,
        toggleItemSelection,
        selectItem,
        addToSelection,
        removeFromSelection,
        clearSelection,
    };
}
