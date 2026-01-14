import type { ShortcutDefinition } from './useShortcutDefinitions';
import { computed, type ComputedRef, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationStore } from '@/store/NavigationStore';

// Type for module shortcut definitions
export type ModuleShortcutDefinitions = (params: { route: any; [key: string]: any }) => ShortcutDefinition[];

// Cache for dynamically loaded module shortcuts
const moduleShortcutsCache = new Map<string, ModuleShortcutDefinitions | null>();

/**
 * Dynamically loads shortcuts from a module file if it exports a `shortcuts` function.
 * Modules can define shortcuts like:
 *
 * export const shortcuts: ModuleShortcutDefinitions = ({ route, ... }) => [
 *   {
 *     id: 'module-action',
 *     title: 'Module Action',
 *     category: 'Module Shortcuts',
 *     keys: { mac: 'cmd+m', windows: 'ctrl+m' },
 *     handler: () => { ... }
 *   }
 * ];
 */
async function loadModuleShortcuts(moduleName: string): Promise<ModuleShortcutDefinitions | null> {
    // Check cache first
    if (moduleShortcutsCache.has(moduleName)) {
        return moduleShortcutsCache.get(moduleName) ?? null;
    }

    try {
        // Dynamically import the module
        const module = await import(`../../pages/modules/${moduleName}.vue`);

        // Check if module exports shortcuts
        if (module.shortcuts && typeof module.shortcuts === 'function') {
            moduleShortcutsCache.set(moduleName, module.shortcuts);
            return module.shortcuts;
        }
    } catch (error) {
        console.warn(`No shortcuts found for module: ${moduleName}`, error);
    }

    // Cache null to avoid repeated failed imports
    moduleShortcutsCache.set(moduleName, null);
    return null;
}

export function useRouteShortcuts(): {
    shortcuts: ComputedRef<ShortcutDefinition[]>;
} {
    const route = useRoute();
    const navigationStore = useNavigationStore();
    const moduleShortcuts = ref<ShortcutDefinition[]>([]);

    // Watch for route changes and load module shortcuts
    watch(
        () => route.name,
        async (currentRoute) => {
            const routeName = currentRoute as string;

            // Check if this is a module route (not a core route)
            if (
                routeName &&
                !['AASViewer', 'AASEditor', 'SMViewer', 'SMEditor', 'About', 'NotFound404'].includes(routeName)
            ) {
                const shortcutsFn = await loadModuleShortcuts(routeName);
                if (shortcutsFn) {
                    moduleShortcuts.value = shortcutsFn({ route, navigationStore });
                } else {
                    moduleShortcuts.value = [];
                }
            } else {
                moduleShortcuts.value = [];
            }
        },
        { immediate: true }
    );

    const shortcuts = computed<ShortcutDefinition[]>(() => {
        const currentRoute = route.name as string;
        const routeShortcuts: ShortcutDefinition[] = [];

        // AAS Viewer specific shortcuts
        if (currentRoute === 'AASViewer') {
            routeShortcuts.push({
                id: 'aas-viewer-refresh',
                title: 'Refresh AAS List',
                description: 'Reload the AAS list',
                prependIcon: 'mdi-refresh',
                category: 'AAS Viewer Shortcuts',
                keys: {
                    mac: 'cmd+shift+r',
                    windows: 'ctrl+shift+r',
                },
                handler: (event: KeyboardEvent) => {
                    event.preventDefault();
                    event.stopPropagation();
                    // Trigger AAS list reload through the navigation store
                    navigationStore.dispatchTriggerAASListReload();
                },
            });
        }

        // AAS Editor specific shortcuts
        if (currentRoute === 'AASEditor') {
            routeShortcuts.push({
                id: 'aas-editor-refresh',
                title: 'Refresh AAS List',
                description: 'Reload the AAS list',
                prependIcon: 'mdi-refresh',
                category: 'AAS Editor Shortcuts',
                keys: {
                    mac: 'cmd+shift+r',
                    windows: 'ctrl+shift+r',
                },
                handler: (event: KeyboardEvent) => {
                    event.preventDefault();
                    event.stopPropagation();
                    // Trigger AAS list reload through the navigation store
                    navigationStore.dispatchTriggerAASListReload();
                },
            });
        }

        // Add more route-specific shortcuts here for other routes
        // if (currentRoute === 'SMViewer') { ... }

        return [...routeShortcuts, ...moduleShortcuts.value];
    });

    return {
        shortcuts,
    };
}
