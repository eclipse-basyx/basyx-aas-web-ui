import { useNavigationStore } from '@/store/NavigationStore';

export function useVirtualContactFileUtils() {
    // Stores
    const navigationStore = useNavigationStore();

    // Computed Properties
    const isMac = computed(() => navigationStore.getPlatform.mac);
    const isIOs = computed(() => navigationStore.getPlatform.ios);

    function downloadVCard(vCardString: string, filename: string) {
        if (vCardString.startsWith('BEGIN:VCARD') && vCardString.endsWith('END:VCARD')) {
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
