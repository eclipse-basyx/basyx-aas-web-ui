import type { ShortcutDefinition } from './useShortcutDefinitions';
import { computed, type ComputedRef, ref, watch } from 'vue';
import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';
import { useNavigationStore } from '@/store/NavigationStore';

// Type for page/module shortcut definitions
export type PageShortcutDefinitions = (params: {
    route: RouteLocationNormalizedLoaded;
    [key: string]: any;
}) => ShortcutDefinition[];
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
 *     keys: 'cmd+m',
 *     handler: () => { ... }
 *   }
 * ];
 */
async function loadPageShortcuts(routeName: string): Promise<PageShortcutDefinitions | null> {
    // Check cache first
    if (pageShortcutsCache.has(routeName)) {
        return pageShortcutsCache.get(routeName) ?? null;
    }

    // Validate route name to prevent path traversal and invalid characters
    if (!routeName || typeof routeName !== 'string' || /[/\\.]/.test(routeName)) {
        if (import.meta.env.DEV) {
            console.warn(`[useRouteShortcuts] Invalid route name: "${routeName}"`);
        }
        pageShortcutsCache.set(routeName, null);
        return null;
    }

    let corePageError: Error | null = null;
    let modulePageError: Error | null = null;

    try {
        // Try loading from core pages first
        const corePage = await import(`../../pages/${routeName}.vue`);

        if (corePage.shortcuts && typeof corePage.shortcuts === 'function') {
            pageShortcutsCache.set(routeName, corePage.shortcuts);
            return corePage.shortcuts;
        }
    } catch (error) {
        corePageError = error as Error;
        // Not a core page, try modules
        try {
            const modulePage = await import(`../../pages/modules/${routeName}.vue`);

            if (modulePage.shortcuts && typeof modulePage.shortcuts === 'function') {
                pageShortcutsCache.set(routeName, modulePage.shortcuts);
                return modulePage.shortcuts;
            }
        } catch (error) {
            modulePageError = error as Error;
            // Neither core page nor module has shortcuts - this is normal for most routes
        }
    }

    // Log detailed error information in development mode only if both imports failed unexpectedly
    if (import.meta.env.DEV && corePageError && modulePageError) {
        // Only log if it's not a simple "module not found" error
        const isExpectedError =
            corePageError.message.includes('Cannot find module') || corePageError.message.includes('Unknown variable');
        if (!isExpectedError) {
            console.warn(
                `[useRouteShortcuts] Failed to load shortcuts for route "${routeName}":`,
                '\nCore page error:',
                corePageError.message,
                '\nModule page error:',
                modulePageError.message
            );
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
