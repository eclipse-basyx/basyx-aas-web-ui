<template>
    <v-app>
        <AppNavigation />
        <v-main style="padding-top: 33px">
            <!-- App Content (eg. AASViewer, AASEditor, etc.) -->
            <router-view v-slot="{ Component }">
                <component :is="Component" />
            </router-view>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
    import { onBeforeUnmount, onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const router = useRouter();

    // Stores
    const infrastructureStore = useInfrastructureStore();
    const navigationStore = useNavigationStore();

    // Data
    const mediaQueryList = window.matchMedia('(max-width: 600px)');
    const matchesMobile = ref(mediaQueryList.matches);
    let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

    onMounted(() => {
        // Listen for viewport changes (mobile/desktop)
        mediaQueryList.addEventListener('change', handleMediaChange);

        // Start token refresh background timer (every 20 seconds)
        tokenRefreshInterval = setInterval(async () => {
            await refreshTokens();
        }, 20000);

        // Initial token refresh check
        refreshTokens();
    });

    onBeforeUnmount(() => {
        mediaQueryList.removeEventListener('change', handleMediaChange);

        // Clear token refresh interval
        if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
        }
    });

    /**
     * Refresh tokens for all infrastructures and show notifications if any fail.
     * This leverages the InfrastructureStore's centralized token refresh logic.
     */
    async function refreshTokens(): Promise<void> {
        const failures = await infrastructureStore.refreshInfrastructureTokens();

        // Handle refresh failures by notifying user
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
        }
    }

    /**
     * Handle viewport changes (mobile/desktop switch).
     * Reloads the current route to adapt the layout.
     */
    function handleMediaChange(event: MediaQueryListEvent): void {
        if (matchesMobile.value !== event.matches) {
            router.go(0); // Reloads current route
        }
    }
</script>
