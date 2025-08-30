import { defineStore } from 'pinia';
import { useClipboardUtil } from '@/composables/ClipboardUtil';

export const useClipboardStore = defineStore('clipboardStore', () => {
    // composables
    const { cleanObjectRecursively } = useClipboardUtil();

    // States
    const clipboardContent = ref<unknown | null>(null);

    // Getters
    function getClipboardContent() {
        return clipboardContent.value;
    }
    function getClipboardElementModelType() {
        const content = clipboardContent.value;
        return content && typeof content === 'object' && 'modelType' in content
            ? (content as { modelType?: string }).modelType || null
            : null;
    }

    // Actions
    function setClipboardContent(content: unknown) {
        clipboardContent.value = cleanObjectRecursively(content);
    }

    return {
        getClipboardContent,
        getClipboardElementModelType,
        setClipboardContent,
    };
});
