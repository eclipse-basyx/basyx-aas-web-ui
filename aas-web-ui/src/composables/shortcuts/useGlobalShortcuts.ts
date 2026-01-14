import { onBeforeUnmount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useShortcutManager } from '@/composables/shortcuts/useShortcutManager';

export function useGlobalShortcuts() {
    const router = useRouter();
    const route = useRoute();
    const shortcuts = useShortcutManager();

    const isMac = computed(() => typeof navigator !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent));

    function isSlashShortcut(e: KeyboardEvent): boolean {
        // Allow Shift because some layouts need Shift to produce "/"
        if (e.metaKey || e.ctrlKey || e.altKey) return false;

        return e.key === '/' || e.code === 'Slash' || e.code === 'NumpadDivide';
    }

    function globalShortcuts(event: KeyboardEvent): boolean {
        const keyLower = event.key.toLowerCase();

        const isHomeCombo =
            (isMac.value && event.metaKey && event.shiftKey && !event.ctrlKey && !event.altKey && keyLower === 'h') ||
            (!isMac.value && event.ctrlKey && event.shiftKey && !event.metaKey && !event.altKey && keyLower === 'h');

        const isCmdK =
            (isMac.value && event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && keyLower === 'k') ||
            (!isMac.value && event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && keyLower === 'k');

        const isSlash = isSlashShortcut(event);

        if (isHomeCombo) {
            event.preventDefault();
            event.stopPropagation();

            // pick ONE of these behaviors:
            // router.push({ name: 'Home' });
            router.push({ name: (route.name as string) ?? undefined, query: {} });

            return true;
        }

        if (isSlash) {
            event.preventDefault();
            event.stopPropagation();
            // eslint-disable-next-line no-console
            console.log('Navigation palette shortcut "/" triggered');
            // later: openPalette({ prefill: '/', mode: 'nav' })
            return true;
        }

        if (isCmdK) {
            event.preventDefault();
            event.stopPropagation();
            // eslint-disable-next-line no-console
            console.log('Command palette shortcut Cmd/Ctrl+K triggered');
            // later: openPalette({ prefill: '>', mode: 'cmd' })
            return true;
        }

        return false;
    }

    let unregister: (() => void) | null = null;

    onMounted(() => {
        unregister = shortcuts.register('global', globalShortcuts);
    });

    onBeforeUnmount(() => {
        unregister?.();
        unregister = null;
    });
}
