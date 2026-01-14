import type { ShortcutDefinition } from './useShortcutDefinitions';
import { computed, type ComputedRef } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationStore } from '@/store/NavigationStore';

export function useRouteShortcuts(): {
    shortcuts: ComputedRef<ShortcutDefinition[]>;
} {
    const route = useRoute();
    const navigationStore = useNavigationStore();

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

        return routeShortcuts;
    });

    return {
        shortcuts,
    };
}
