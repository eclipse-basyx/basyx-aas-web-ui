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

    // Actions
    function setClipboardContent(content: unknown) {
        clipboardContent.value = cleanObjectRecursively(content);
    }

    return { getClipboardContent, setClipboardContent };
});
