import { ref } from 'vue';

const isPopupOverlayVisible = ref(false);

export function usePopupOverlay() {
    function showOverlay(): void {
        isPopupOverlayVisible.value = true;
    }

    function hideOverlay(): void {
        isPopupOverlayVisible.value = false;
    }

    return {
        isPopupOverlayVisible,
        showOverlay,
        hideOverlay,
    };
}
