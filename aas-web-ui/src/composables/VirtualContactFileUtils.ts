import { useNavigationStore } from '@/store/NavigationStore';

export function useVirtualContactFileUtils() {
    // Stores
    const navigationStore = useNavigationStore();

    // Computed Properties
    const isMac = computed(() => navigationStore.getPlatform.mac);
    const isIOs = computed(() => navigationStore.getPlatform.ios);

    /**
     * Downloads a vCard file with the specified filename.
     *
     * This function checks if the provided string is a valid vCard format (starts with 'BEGIN:VCARD'
     * and ends with 'END:VCARD'). If valid, it creates a Blob from the string, generates a URL
     * for that Blob, and then initiates a download of the file. On iOS and Mac devices, it opens
     * the vCard in a new tab instead of downloading it directly.
     *
     * @param {string} vCardString - The vCard data string, which must be in valid vCard format.
     * @param {string} filename - The desired filename for the downloaded vCard file.
     * @returns {void} This function does not return a value.
     */
    function downloadVCard(vCardString: string, filename: string): void {
        if (vCardString.startsWith('BEGIN:VCARD') && vCardString.endsWith('END:VCARD')) {
            // Add file extension
            if (!filename.toLocaleLowerCase().endsWith('.vcf')) {
                filename = filename + '.vcf';
            }

            const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8;' });
            const data = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = data;
            link.download = filename;

            // this part will prompt the user to view the VCard in a new tab on iOS
            if (isIOs.value || isMac.value) {
                window.open(data, '_blank');
            } else {
                // For desktop browsers, download the vCard
                link.click();
            }

            setTimeout(function () {
                // For Firefox it is necessary to delay revoking the ObjectURL
                window.URL.revokeObjectURL(data);
            }, 100);
        }
    }

    return { downloadVCard };
}
