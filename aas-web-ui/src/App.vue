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
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { authenticateKeycloak } from '@/composables/KeycloakAuth';
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

    // Computed Properties
    const currentInfrastructure = computed(() => infrastructureStore.getSelectedInfrastructure);

    watch(
        () => infrastructureStore.getSelectedInfrastructure,
        (newInfra, oldInfra) => {
            if (newInfra !== oldInfra) {
                authKeycloak();
            }
        }
    );

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
        authKeycloak();
    });

    async function authKeycloak(): Promise<void> {
        try {
            const infra = currentInfrastructure.value;
            if (!infra || !infra.auth) return;
            const config = infra.auth.keycloakConfig!;
            const result = await authenticateKeycloak(config);
            const keycloakToken = {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresAt: result.expiresAt,
                idToken: result.idToken,
            };
            infra.token = keycloakToken;
            infrastructureStore.dispatchUpdateInfrastructure(infra);
            navigationStore.dispatchTriggerAASListReload();
            navigationStore.dispatchTriggerTreeviewReload();
        } catch (error) {
            // snackbar
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 10000,
                color: 'error',
                btnColor: 'buttonText',
                text: `Authentication failed for the selected infrastructure. Please check your configuration.`,
                extendedError: (error as Error).message,
            });
        }
    }

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
