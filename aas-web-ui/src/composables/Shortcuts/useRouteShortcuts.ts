import type { ShortcutDefinition } from './useShortcutDefinitions';
import { computed, type ComputedRef } from 'vue';
import { useRoute } from 'vue-router';
import { useAASStore } from '@/store/AASDataStore';

export function useRouteShortcuts(): {
    shortcuts: ComputedRef<ShortcutDefinition[]>;
} {
    const route = useRoute();
    const aasStore = useAASStore();

    const shortcuts = computed<ShortcutDefinition[]>(() => {
        const currentRoute = route.name as string;
        const routeShortcuts: ShortcutDefinition[] = [];

        // AAS Viewer specific shortcuts
        if (currentRoute === 'AASViewer') {
            routeShortcuts.push(
                {
                    id: 'aas-viewer-refresh',
                    title: 'Refresh AAS',
                    description: 'Reload the current AAS data',
                    prependIcon: 'mdi-refresh',
                    category: 'AAS Viewer Shortcuts',
                    keys: {
                        mac: 'cmd+r',
                        windows: 'ctrl+r',
                    },
                    handler: (event: KeyboardEvent) => {
                        event.preventDefault();
                        event.stopPropagation();
                        // Trigger AAS refresh logic
                        const selectedAAS = aasStore.getSelectedAAS;
                        if (selectedAAS && Object.keys(selectedAAS).length > 0) {
                            // This would trigger a refresh - adjust based on your store methods
                            window.location.reload();
                        }
                    },
                },
                {
                    id: 'aas-viewer-copy-id',
                    title: 'Copy AAS ID',
                    description: 'Copy the current AAS identifier to clipboard',
                    prependIcon: 'mdi-content-copy',
                    category: 'AAS Viewer Shortcuts',
                    keys: {
                        mac: 'cmd+shift+c',
                        windows: 'ctrl+shift+c',
                    },
                    handler: (event: KeyboardEvent) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const selectedAAS = aasStore.getSelectedAAS;
                        if (selectedAAS && selectedAAS.id) {
                            navigator.clipboard.writeText(selectedAAS.id);
                        }
                    },
                },
                {
                    id: 'aas-viewer-navigate-submodels',
                    title: 'Focus Submodel List',
                    description: 'Navigate to the submodel list',
                    prependIcon: 'mdi-file-tree',
                    category: 'AAS Viewer Shortcuts',
                    keys: {
                        mac: 'cmd+shift+s',
                        windows: 'ctrl+shift+s',
                    },
                    handler: (event: KeyboardEvent) => {
                        event.preventDefault();
                        event.stopPropagation();
                        // Focus or navigate to submodel list
                        const submodelListElement = document.querySelector('.submodel-list');
                        if (submodelListElement) {
                            (submodelListElement as HTMLElement).focus();
                        }
                    },
                }
            );
        }

        // Add more route-specific shortcuts here for other routes
        // if (currentRoute === 'AASEditor') { ... }
        // if (currentRoute === 'SMViewer') { ... }

        return routeShortcuts;
    });

    return {
        shortcuts,
    };
}
