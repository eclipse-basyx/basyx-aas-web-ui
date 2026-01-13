import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type ShortcutDefinition = {
    id: string;
    title: string;
    description?: string;
    prependIcon?: string;
    category: string;
    keys: {
        mac: string;
        windows: string;
    };
    handler: (event: KeyboardEvent) => void;
};

export function useShortcutDefinitions(onCommandPalette?: () => void): {
    shortcuts: ComputedRef<ShortcutDefinition[]>;
    getDisplayKeys: (shortcut: ShortcutDefinition) => string;
    isMac: ComputedRef<boolean>;
} {
    const router = useRouter();
    const route = useRoute();
    const isMac = computed(() => typeof navigator !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent));

    const shortcuts = computed<ShortcutDefinition[]>(() => [
        {
            id: 'home',
            title: 'Go Home',
            description: 'Navigate to home and clear query parameters',
            prependIcon: 'mdi-home',
            category: 'Global Shortcuts',
            keys: {
                mac: 'cmd+shift+h',
                windows: 'ctrl+shift+h',
            },
            handler: (event: KeyboardEvent) => {
                event.preventDefault();
                event.stopPropagation();
                router.push({ name: (route.name as string) ?? undefined, query: {} });
            },
        },
        {
            id: 'command-palette',
            title: 'Open Command Palette',
            description: 'Open the command palette for quick actions',
            prependIcon: 'mdi-console-line',
            category: 'Global Shortcuts',
            keys: {
                mac: 'cmd+k',
                windows: 'ctrl+k',
            },
            handler: (event: KeyboardEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (onCommandPalette) {
                    onCommandPalette();
                }
            },
        },
    ]);

    const getDisplayKeys = (shortcut: ShortcutDefinition): string => {
        return isMac.value ? shortcut.keys.mac : shortcut.keys.windows;
    };

    return {
        shortcuts,
        getDisplayKeys,
        isMac,
    };
}
