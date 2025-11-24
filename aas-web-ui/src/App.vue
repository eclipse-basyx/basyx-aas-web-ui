<template>
    <v-app>
        <AppNavigation />
        <v-main style="padding-top: 33px">
            <!-- App Content (eg. AASViewer, AASEditor, etc.) -->
            <router-view v-slot="{ Component }">
                <component :is="Component" />
            </router-view>
        </v-main>

        <!-- Popup Overlay -->
        <v-overlay v-model="isPopupOverlayVisible" persistent class="align-center justify-center">
            <div class="text-center">
                <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
                <div class="mt-4 text-h6">Please complete authentication in the popup window</div>
            </div>
        </v-overlay>
    </v-app>
</template>

<script lang="ts" setup>
    import { onBeforeUnmount, onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { usePopupOverlay } from '@/composables/PopupOverlay';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const router = useRouter();

    // Stores
    const infrastructureStore = useInfrastructureStore();
    const navigationStore = useNavigationStore();

    // Popup Overlay
    const { isPopupOverlayVisible } = usePopupOverlay();

    // Data
    const mediaQueryList = window.matchMedia('(max-width: 600px)');
    const matchesMobile = ref(mediaQueryList.matches);
    let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;
    refreshTokens();
    onMounted(() => {
        mediaQueryList.addEventListener('change', handleMediaChange);
        // Start token refresh background timer (every 60 seconds)
        tokenRefreshInterval = setInterval(async () => {
            await refreshTokens();
        }, 20000); // 60 seconds
    });

    async function refreshTokens(): Promise<void> {
        const failures = await infrastructureStore.refreshInfrastructureTokens();

        // Handle refresh failures
        if (failures.length > 0) {
            const failureMessages = failures.map((f) => `${f.infraName}: ${f.error}`).join('\n');

            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 10000,
                color: 'warning',
                btnColor: 'buttonText',
                text: `Token refresh failed for ${failures.length} component(s). Please re-authenticate.`,
                extendedError: failureMessages,
            });

            // Trigger opening the infrastructure management dialog
            infrastructureStore.dispatchTriggerInfrastructureDialog();
        }
    }

    onBeforeUnmount(() => {
        mediaQueryList.removeEventListener('change', handleMediaChange);

        // Clear token refresh interval
        if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
        }
    });

    function handleMediaChange(event: MediaQueryListEvent): void {
        if (matchesMobile.value !== event.matches) {
            router.go(0); // Reloads current route
        }
    }
</script>
