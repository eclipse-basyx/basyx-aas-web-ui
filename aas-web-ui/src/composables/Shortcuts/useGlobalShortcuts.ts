import { onBeforeUnmount, onMounted } from 'vue';
import { useRouteShortcuts } from '@/composables/Shortcuts/useRouteShortcuts';
import { useShortcutDefinitions } from '@/composables/Shortcuts/useShortcutDefinitions';
import { useShortcutManager } from '@/composables/Shortcuts/useShortcutManager';

export function useGlobalShortcuts(onCommandPalette?: () => void): void {
    const shortcutManager = useShortcutManager();
    const { shortcuts: globalShortcuts, isMac } = useShortcutDefinitions(onCommandPalette);
    const { shortcuts: routeShortcuts } = useRouteShortcuts();

    function matchesShortcut(event: KeyboardEvent, keys: { mac: string; windows: string }): boolean {
        const targetKeys = isMac.value ? keys.mac : keys.windows;
        const parts = targetKeys.toLowerCase().split('+');

        const needsMeta = parts.includes('cmd') || parts.includes('meta');
        const needsCtrl = parts.includes('ctrl');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');
        const key = parts[parts.length - 1];

        return (
            event.key.toLowerCase() === key &&
            event.metaKey === needsMeta &&
            event.ctrlKey === needsCtrl &&
            event.shiftKey === needsShift &&
            event.altKey === needsAlt
        );
    }

    function globalShortcutsHandler(event: KeyboardEvent): boolean {
        // Allow command palette to always work (even when other inputs are focused)
        for (const shortcut of globalShortcuts.value) {
            if (shortcut.id === 'command-palette' && matchesShortcut(event, shortcut.keys)) {
                // Blur active element (e.g., input field) when opening command palette
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
                shortcut.handler(event);
                return true;
            }
        }

        // Check route-specific shortcuts first
        for (const shortcut of routeShortcuts.value) {
            if (matchesShortcut(event, shortcut.keys)) {
                shortcut.handler(event);
                return true;
            }
        }

        // Then check other global shortcuts
        for (const shortcut of globalShortcuts.value) {
            if (shortcut.id !== 'command-palette' && matchesShortcut(event, shortcut.keys)) {
                shortcut.handler(event);
                return true;
            }
        }
        return false;
    }

    let unregister: (() => void) | null = null;

    onMounted(() => {
        unregister = shortcutManager.register('global', globalShortcutsHandler, { allowInInputs: true });
    });

    onBeforeUnmount(() => {
        unregister?.();
        unregister = null;
    });
}
