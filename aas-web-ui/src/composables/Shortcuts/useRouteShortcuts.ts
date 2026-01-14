import type { ShortcutDefinition } from './useShortcutDefinitions';
import { computed, type ComputedRef, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationStore } from '@/store/NavigationStore';

// Type for page/module shortcut definitions
export type PageShortcutDefinitions = (params: { route: any; [key: string]: any }) => ShortcutDefinition[];

// Cache for dynamically loaded page shortcuts
const pageShortcutsCache = new Map<string, PageShortcutDefinitions | null>();

/**
 * Dynamically loads shortcuts from a page or module file if it exports a `shortcuts` function.
 * Works for both core pages and modules:
 * - Core pages: @/pages/PageName.vue
 * - Modules: @/pages/modules/ModuleName.vue
 *
 * Pages can define shortcuts like:
 *
 * export const shortcuts: PageShortcutDefinitions = ({ route, ... }) => [
 *   {
 *     id: 'page-action',
 *     title: 'Page Action',
 *     category: 'Page Shortcuts',
 *     keys: { mac: 'cmd+m', windows: 'ctrl+m' },
 *     handler: () => { ... }
 *   }
 * ];
 */
async function loadPageShortcuts(routeName: string): Promise<PageShortcutDefinitions | null> {
    // Check cache first
    if (pageShortcutsCache.has(routeName)) {
        return pageShortcutsCache.get(routeName) ?? null;
    }

    try {
        // Try loading from core pages first
        const corePage = await import(`../../pages/${routeName}.vue`);

        if (corePage.shortcuts && typeof corePage.shortcuts === 'function') {
            pageShortcutsCache.set(routeName, corePage.shortcuts);
            return corePage.shortcuts;
        }
    } catch {
        // Not a core page, try modules
        try {
            const modulePage = await import(`../../pages/modules/${routeName}.vue`);

            if (modulePage.shortcuts && typeof modulePage.shortcuts === 'function') {
                pageShortcutsCache.set(routeName, modulePage.shortcuts);
                return modulePage.shortcuts;
            }
        } catch {
            // Neither core page nor module has shortcuts - this is not an error
        }
    }

    // Cache null to avoid repeated failed imports
    pageShortcutsCache.set(routeName, null);
    return null;
}

export function useRouteShortcuts(): {
    shortcuts: ComputedRef<ShortcutDefinition[]>;
} {
    const route = useRoute();
    const navigationStore = useNavigationStore();
    const pageShortcuts = ref<ShortcutDefinition[]>([]);

    // Watch for route changes and load page shortcuts
    watch(
        () => route.name,
        async (currentRoute) => {
            const routeName = currentRoute as string;

            if (routeName) {
                const shortcutsFn = await loadPageShortcuts(routeName);
                if (shortcutsFn) {
                    pageShortcuts.value = shortcutsFn({ route, navigationStore });
                } else {
                    pageShortcuts.value = [];
                }
            } else {
                pageShortcuts.value = [];
            }
        },
        { immediate: true }
    );

    const shortcuts = computed<ShortcutDefinition[]>(() => {
        return pageShortcuts.value;
    });

    return {
        shortcuts,
    };
}
