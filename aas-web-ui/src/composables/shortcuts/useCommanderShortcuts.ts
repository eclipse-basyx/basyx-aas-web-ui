import { onBeforeUnmount, onMounted } from 'vue';
import { useShortcutManager } from '@/composables/shortcuts/useShortcutManager';

export type CommanderShortcutsApi = {
    focusLeft: () => void;
    focusRight: () => void;
    resetSplit: () => void;
};

/**
 * Registers commander-specific shortcuts in the shortcut manager and sets the active scope to "commander".
 *
 * Current shortcuts:
 * - Ctrl+Alt+ArrowLeft  => focusLeft()
 * - Ctrl+Alt+ArrowRight => focusRight()
 * - Ctrl+Alt+ArrowUp/ArrowDown/0/Numpad0 => resetSplit()
 *
 * Usage:
 *   const unregister = useCommanderShortcuts({ focusLeft, focusRight, resetSplit });
 *   // (No need to manually call setScope/unregister; handled internally)
 */
export function useCommanderShortcuts(api: CommanderShortcutsApi) {
    const shortcuts = useShortcutManager();

    function commanderShortcuts(event: KeyboardEvent): boolean {
        if (!(event.ctrlKey && event.altKey)) return false;

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            api.focusLeft();
            return true;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            api.focusRight();
            return true;
        }

        if (['ArrowUp', 'ArrowDown', '0', 'Numpad0'].includes(event.key)) {
            event.preventDefault();
            api.resetSplit();
            return true;
        }

        return false;
    }

    let unregister: (() => void) | null = null;

    onMounted(() => {
        unregister = shortcuts.register('commander', commanderShortcuts);
        shortcuts.setScope('commander');
    });

    onBeforeUnmount(() => {
        unregister?.();
        unregister = null;
        shortcuts.setScope('global');
    });

    // optional: return a manual cleanup function if you ever need it
    return () => {
        unregister?.();
        unregister = null;
        shortcuts.setScope('global');
    };
}
