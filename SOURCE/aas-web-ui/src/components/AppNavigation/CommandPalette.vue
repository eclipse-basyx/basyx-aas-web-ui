<template>
    <v-dialog v-model="dialogModel" :max-width="500" absolute contained>
        <v-sheet rounded="lg" border>
            <!-- Global search -->
            <v-combobox
                v-model="search"
                density="comfortable"
                hide-details
                placeholder="Search..."
                autofocus
                prepend-inner-icon="mdi-magnify"
                @keydown.down.prevent="selectNext"
                @keydown.up.prevent="selectPrevious"
                @keydown.enter.prevent="activateSelected" />
            <v-card-text class="pa-0" style="max-height: 400px; overflow-y: auto">
                <!-- List of route search results -->
                <v-list v-if="search?.trim() && filteredRoutes.length > 0" density="compact" nav slim>
                    <v-list-item
                        v-for="(routeItem, index) in filteredRoutes"
                        :key="routeItem.name"
                        :title="getDisplayName(routeItem)"
                        :subtitle="routeItem.path"
                        :active="index === selectedIndex"
                        link
                        rounded
                        @click="navigateToRoute(routeItem)">
                        <template #prepend>
                            <v-icon icon="mdi-arrow-right" class="me-2" size="small" />
                        </template>
                    </v-list-item>
                </v-list>

                <!-- Divider between routes and shortcuts -->
                <v-divider v-if="search?.trim() && filteredRoutes.length > 0"></v-divider>

                <!-- List of available commands/shortcuts -->
                <v-list density="compact" nav slim>
                    <template v-for="command in commands" :key="command.id">
                        <v-list-subheader v-if="command.isHeader" class="mt-2">
                            {{ command.category }}
                        </v-list-subheader>
                        <v-list-item v-else :title="command.title" link rounded @click="executeCommand(command)">
                            <template #prepend>
                                <v-icon
                                    v-if="command.prependIcon"
                                    :icon="command.prependIcon"
                                    class="me-2"
                                    size="small" />
                            </template>
                            <template #append>
                                <v-hotkey v-if="command.shortcut" class="text-caption" :keys="command.shortcut" />
                            </template>
                        </v-list-item>
                    </template>
                </v-list>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer />
                <div class="pe-4 text-caption">
                    <v-kbd>Esc</v-kbd>
                    to close
                </div>
            </v-card-actions>
        </v-sheet>
    </v-dialog>
</template>

<script setup lang="ts">
    import type { RouteRecordRaw } from 'vue-router';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useRouteShortcuts } from '@/composables/Shortcuts/useRouteShortcuts';
    import { useShortcutDefinitions } from '@/composables/Shortcuts/useShortcutDefinitions';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    const props = defineProps<{
        modelValue: boolean;
    }>();

    const emit = defineEmits<{
        'update:modelValue': [value: boolean];
    }>();

    const route = useRoute();
    const router = useRouter();
    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    const { shortcuts: globalShortcuts, getDisplayKeys } = useShortcutDefinitions();
    const { shortcuts: routeShortcuts } = useRouteShortcuts();

    const search = ref('');
    const selectedIndex = ref(0);

    const isMobile = computed(() => navigationStore.getIsMobile);

    const selectedAas = computed(() => {
        return aasStore.getSelectedNode && Object.keys(aasStore.getSelectedNode).length > 0;
    });

    const selectedNode = computed(() => {
        return (
            aasStore.getSelectedNode &&
            Object.keys(aasStore.getSelectedNode).length > 0 &&
            aasStore.getSelectedNode.path &&
            aasStore.getSelectedNode.path !== 'AssetAdministrationShell'
        );
    });

    const allRoutes = computed((): RouteRecordRaw[] => {
        // Get all routes from router, excluding NotFound404 and routes without names
        const routes = router.getRoutes().filter((route) => {
            return route.name && route.name !== 'NotFound404';
        });
        return routes;
    });

    const filteredRoutes = computed((): RouteRecordRaw[] => {
        // Apply search filter
        let routes = allRoutes.value;
        if (search.value && search.value.trim()) {
            const searchLower = search.value.toLowerCase();
            routes = routes.filter((route) => {
                const name = (route.name as string)?.toLowerCase() || '';
                const title = (route.meta?.title as string)?.toLowerCase() || '';
                const path = route.path.toLowerCase();
                return name.includes(searchLower) || title.includes(searchLower) || path.includes(searchLower);
            });
        }

        // Apply visibility filtering (same logic as MainMenu)
        routes = routes.filter((route) => {
            // Filter based on mobile/desktop
            if (isMobile.value && route.meta?.hideInMobile) return false;
            if (!isMobile.value && route.meta?.hideOnDesktop) return false;

            // Filter based on AAS/node selection
            if (route.meta?.requiresSelectedAas && !selectedAas.value) return false;
            if (route.meta?.requiresSelectedNode && !selectedNode.value) return false;

            return true;
        });

        // Limit results to prevent overwhelming UI
        return routes.slice(0, 8);
    });
    const commands = computed(() => {
        // Combine global and route-specific shortcuts
        const allShortcuts = [...globalShortcuts.value, ...routeShortcuts.value];

        // Group shortcuts by category
        const grouped = allShortcuts.reduce(
            (acc, shortcut) => {
                const category = shortcut.category;
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push({
                    id: shortcut.id,
                    title: shortcut.title,
                    prependIcon: shortcut.prependIcon,
                    shortcut: getDisplayKeys(shortcut),
                    category: category,
                    handler: shortcut.handler,
                });
                return acc;
            },
            {} as Record<
                string,
                Array<{
                    id: string;
                    title: string;
                    prependIcon?: string;
                    shortcut: string;
                    category: string;
                    handler: (event: KeyboardEvent) => void;
                }>
            >
        );

        // Convert to array with category headers
        const result: Array<{
            id: string;
            title?: string;
            prependIcon?: string;
            shortcut?: string;
            category: string;
            isHeader?: boolean;
            handler?: (event: KeyboardEvent) => void;
        }> = [];
        Object.keys(grouped).forEach((category) => {
            result.push({ id: `header-${category}`, category, isHeader: true });
            result.push(...grouped[category]);
        });

        return result;
    });

    const dialogModel = computed({
        get: () => props.modelValue,
        set: (value: boolean) => emit('update:modelValue', value),
    });

    // Clear search when dialog is closed
    watch(dialogModel, (isOpen) => {
        if (!isOpen) {
            search.value = '';
            selectedIndex.value = 0;
        }
    });

    // Reset selected index when search changes
    watch(search, () => {
        selectedIndex.value = 0;
    });

    function selectNext(): void {
        if (filteredRoutes.value.length > 0) {
            selectedIndex.value = Math.min(selectedIndex.value + 1, filteredRoutes.value.length - 1);
        }
    }

    function selectPrevious(): void {
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
    }

    function activateSelected(): void {
        if (filteredRoutes.value.length > 0 && selectedIndex.value < filteredRoutes.value.length) {
            navigateToRoute(filteredRoutes.value[selectedIndex.value]);
        }
    }

    function executeCommand(command: { handler?: (event: KeyboardEvent) => void }): void {
        if (command.handler) {
            // Create a synthetic keyboard event for the handler
            const syntheticEvent = new KeyboardEvent('keydown');
            command.handler(syntheticEvent);
            // Close the dialog after executing
            dialogModel.value = false;
        }
    }

    function navigateToRoute(targetRoute: RouteRecordRaw): void {
        // Preserve query parameters if the target route has preserveRouteQuery meta
        if (targetRoute.meta?.preserveRouteQuery && route.query) {
            router.push({ name: targetRoute.name, query: route.query });
        } else {
            router.push({ name: targetRoute.name });
        }
        // Close the dialog after navigation
        dialogModel.value = false;
    }

    function getDisplayName(route: RouteRecordRaw): string {
        return (route.meta?.title as string) || (route.name as string) || route.path;
    }
</script>
