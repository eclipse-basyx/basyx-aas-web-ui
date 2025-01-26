import { useNavigationStore } from '@/store/NavigationStore';

export function useClipboardUtil() {
    // Stores
    const navigationStore = useNavigationStore();

    function copyToClipboard(value: string, valueName: string, iconReference: { value: string }): void {
        if (!value) return;

        iconReference.value = 'mdi-check';

        // copy value to clipboard
        navigator.clipboard.writeText(value);

        // set the clipboard tooltip to false after 1.5 seconds
        setTimeout(() => {
            iconReference.value = 'mdi-clipboard-file-outline';
        }, 2000);

        // open Snackbar to inform the user that the path was copied to the clipboard
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 2000,
            color: 'success',
            btnColor: 'buttonText',
            text: (valueName.trim() !== '' ? valueName : "'" + value + "'") + ' copied to Clipboard.',
        });
    }

    return { copyToClipboard };
}
