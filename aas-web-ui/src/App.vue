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
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { usePopupOverlay } from '@/composables/PopupOverlay';
    import { useShortcutManager } from '@/composables/useShortcutManager';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    // Stores
    const infrastructureStore = useInfrastructureStore();
    const navigationStore = useNavigationStore();

    // Shortcut Manager
    const shortcuts = useShortcutManager();

    // Popup Overlay
    const { isPopupOverlayVisible } = usePopupOverlay();

    // Data
    const mediaQueryList = window.matchMedia('(max-width: 600px)');
    const matchesMobile = ref(mediaQueryList.matches);
    let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

    let unregisterGlobalShortcuts: (() => void) | null = null;

    const isMac = computed(() => typeof navigator !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent));

    onMounted(() => {
        // Listen for viewport changes (mobile/desktop)
        mediaQueryList.addEventListener('change', handleMediaChange);

        // Start token refresh background timer (every 20 seconds)
        tokenRefreshInterval = setInterval(async () => {
            await refreshTokens();
        }, 20000);

        // Initial token refresh check
        refreshTokens();

        // Register global shortcuts once
        unregisterGlobalShortcuts = shortcuts.register('global', globalShortcuts /*, { allowInInputs: false } */);
    });

    onBeforeUnmount(() => {
        mediaQueryList.removeEventListener('change', handleMediaChange);

        // Clear token refresh interval
        if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
        }

        unregisterGlobalShortcuts?.();
        unregisterGlobalShortcuts = null;
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

    function isSlashShortcut(e: KeyboardEvent): boolean {
        // Allow Shift because some layouts need Shift to produce "/"
        if (e.metaKey || e.ctrlKey || e.altKey) return false;

        return (
            e.key === '/' || // character-based (works on DE Mac via Shift+7)
            e.code === 'Slash' || // physical slash key (US layout)
            e.code === 'NumpadDivide' // numpad /
        );
    }

    function globalShortcuts(event: KeyboardEvent): boolean {
        const keyLower = event.key.toLowerCase();

        // Home: Cmd+Shift+H (Mac), Ctrl+Shift+H (Win/Linux)
        const isHomeCombo =
            (isMac.value && event.metaKey && event.shiftKey && !event.ctrlKey && !event.altKey && keyLower === 'h') ||
            (!isMac.value && event.ctrlKey && event.shiftKey && !event.metaKey && !event.altKey && keyLower === 'h');

        // Cmd/Ctrl+K -> command palette
        const isCmdK =
            (isMac.value && event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && keyLower === 'k') ||
            (!isMac.value && event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && keyLower === 'k');

        // "/" -> navigation palette
        const isSlash = isSlashShortcut(event);

        if (isHomeCombo) {
            event.preventDefault();
            event.stopPropagation();

            router.push({ name: (route.name as string) ?? undefined, query: {} });

            return true;
        }

        if (isSlash) {
            event.preventDefault();
            event.stopPropagation();

            console.log('Navigation palette shortcut "/" triggered');
            // later: openPalette({ prefill: '/', mode: 'nav' })
            return true;
        }

        if (isCmdK) {
            event.preventDefault();
            event.stopPropagation();

            console.log('Command palette shortcut Cmd/Ctrl+K triggered');
            // later: openPalette({ prefill: '>', mode: 'cmd' })
            return true;
        }

        return false;
    }
</script>
