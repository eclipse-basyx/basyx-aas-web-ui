import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type ShortcutDefinition = {
    id: string;
    title: string;
    description?: string;
    prependIcon?: string;
    category: string;
    keys: string; // e.g., 'cmd+k' (cmd automatically becomes Ctrl on Windows/Linux)
    handler: (event: KeyboardEvent) => void;
};

export function useShortcutDefinitions(onCommandPalette?: () => void): {
    shortcuts: ComputedRef<ShortcutDefinition[]>;
    getDisplayKeys: (shortcut: ShortcutDefinition) => string;
} {
    const router = useRouter();
    const route = useRoute();

    const shortcuts = computed<ShortcutDefinition[]>(() => [
        {
            id: 'home',
            title: 'Go Home',
            description: 'Navigate to home and clear query parameters',
            prependIcon: 'mdi-home',
            category: 'Global Shortcuts',
            keys: 'cmd+shift+h',
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
            keys: 'cmd+k',
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
        return shortcut.keys;
    };

    return {
        shortcuts,
        getDisplayKeys,
    };
}
