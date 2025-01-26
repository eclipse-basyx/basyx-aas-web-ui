<template>
    <v-container fluid class="pa-0">
        <v-card class="pa-2" border color="navigationMenu" :min-width="620">
            <v-container>
                <v-row>
                    <!-- Main Menu Items -->
                    <v-col cols="12" sm="7">
                        <v-list-item
                            class="py-2"
                            :active="false"
                            nav
                            :border="isActiveRoutePath('/')"
                            subtitle="Visualize Asset Administration Shells"
                            title="AAS Viewer"
                            to="/"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="custom:aasIcon" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-if="allowEditing"
                            class="mt-3 py-2"
                            :active="false"
                            nav
                            :border="isActiveRoutePath('/aaseditor')"
                            subtitle="Edit Asset Administration Shells"
                            title="AAS Editor"
                            to="/aaseditor"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="mdi-pencil" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                        <v-list-item
                            class="mt-3 py-2"
                            nav
                            :active="false"
                            :border="isActiveRoutePath('/submodelviewer')"
                            subtitle="Visualize Submodels"
                            title="Submodel Viewer"
                            to="/submodelviewer"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="mdi-chart-line" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                    </v-col>
                    <!-- Custom Modules -->
                    <v-col v-if="moduleRoutes.length > 0" cols="12" sm="5" class="pl-3">
                        <v-sheet border rounded color="rgba(0, 0, 0, 0)" class="py-2 px-3">
                            <div class="d-flex align-center text-subtitle-1">
                                <v-icon icon="mdi-view-module" size="x-small" color="primary" start />
                                <strong>Modules</strong>
                            </div>
                            <v-divider class="mt-2 mb-2"></v-divider>
                            <v-list
                                nav
                                class="pa-0 overflow-y-auto"
                                :max-height="52 * 5 + 'px'"
                                style="display: flex; flex-direction: column">
                                <v-virtual-scroll
                                    ref="virtualScrollRef"
                                    :items="filteredAndOrderedModuleRoutes"
                                    :item-height="52"
                                    class="bg-navigationMenu">
                                    <template #default="{ item }">
                                        <v-list-item
                                            class="my-1 mx-1"
                                            :active="false"
                                            :border="isActiveRoutePath(item.path)"
                                            slim
                                            nav
                                            :subtitle="item.path"
                                            :title="item.name?.toString()"
                                            :to="
                                                item?.meta?.preserveRouteQuery === true
                                                    ? { path: item.path, query: route.query }
                                                    : { path: item.path }
                                            "
                                            @click="closeMenu" />
                                    </template>
                                </v-virtual-scroll>
                            </v-list>
                        </v-sheet>
                    </v-col>
                </v-row>
            </v-container>
            <template #actions>
                <v-btn class="text-none" color="primary" text="About" to="/about" @click="closeMenu" />

                <v-divider inset vertical />

                <v-btn
                    append-icon="custom:aasIcon"
                    class="text-none"
                    color="primary"
                    text="Get Started"
                    href="https://basyx.org"
                    target="_blank" />

                <v-spacer></v-spacer>

                <v-img src="@/assets/PoweredByBaSyx.svg" :height="42" :max-width="126"></v-img>
            </template>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import type { ComponentPublicInstance } from 'vue';
    import type { RouteRecordRaw } from 'vue-router';
    import { computed, onMounted, Ref, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useDashboardHandling } from '@/composables/DashboardHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Extend the ComponentPublicInstance type to include scrollToIndex
    interface VirtualScrollInstance extends ComponentPublicInstance {
        scrollToIndex: (index: number) => void;
    }

    // Vue Router
    const route = useRoute();

    // Stores
    const envStore = useEnvStore();
    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    // Composables
    const { checkDashboardAvailability } = useDashboardHandling();

    // Emit
    const emit = defineEmits<{
        (e: 'closeMenu'): void;
    }>();

    // Data
    const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null); // Reference to the Virtual Scroll Component
    const dashboardAvailable = ref(false);

    // Computed Properties
    const currentRoute = computed(() => route.name); // get the current route name
    const currentRoutePath = computed(() => route.path); // get the current route path
    const currentRouteQuery = computed(() => route.query); // get the current route query
    const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS Editor
    const moduleRoutes = computed(() => navigationStore.getModuleRoutes); // get the module routes
    const selectedAas = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store
    const selectedNode = computed(() => aasStore.getSelectedNode); // get selected AAS from Store
    const filteredAndOrderedModuleRoutes = computed(() => {
        const filteredModuleRoutes = moduleRoutes.value.filter((moduleRoute: RouteRecordRaw) => {
            if (
                moduleRoute?.meta?.isOnlyVisibleWithSelectedAas &&
                (!selectedAas.value || Object.keys(selectedAas.value).length === 0)
            )
                return false;
            if (
                moduleRoute?.meta?.isOnlyVisibleWithSelectedNode &&
                (!selectedNode.value || Object.keys(selectedNode.value).length === 0)
            )
                return false;
            return moduleRoute?.meta?.isVisibleModule === true || moduleRoute.path === route.path;
        });
        const filteredAndOrderedModuleRoutes = filteredModuleRoutes.sort(
            (moduleRouteA: RouteRecordRaw, moduleRouteB: RouteRecordRaw) => {
                let moduleNameA: string = moduleRouteA?.name?.toString() || '';
                let moduleNameB: string = moduleRouteB?.name?.toString() || '';

                return moduleNameA.localeCompare(moduleNameB);
            }
        );
        return filteredAndOrderedModuleRoutes;
    });

    // Watchers
    // TODO move to route guard
    watch(
        () => currentRoute.value,
        () => {
            // Just reset dispatched AAS with aas query parameter is missing
            if (!currentRouteQuery.value.aas || currentRouteQuery.value.aas.toString().trim() === '')
                aasStore.dispatchSelectedAAS({});
        }
    );

    onMounted(async () => {
        dashboardAvailable.value = await checkDashboardAvailability();
        scrollToSelectedModule();
    });

    function closeMenu(): void {
        emit('closeMenu');
    }

    function isActiveRoutePath(routePath: string): boolean {
        return currentRoutePath.value === routePath;
    }

    // Function to scroll to the active module
    function scrollToSelectedModule(): void {
        // Find the index of the selected item
        const index = filteredAndOrderedModuleRoutes.value.findIndex((moduleRoute: RouteRecordRaw) =>
            isActiveRoutePath(moduleRoute.path)
        );

        if (index !== -1) {
            const intervalId = setInterval(() => {
                if (
                    virtualScrollRef.value &&
                    virtualScrollRef.value?.$el.querySelector('.v-virtual-scroll__container').children.length > 0
                ) {
                    // Access the scrollable container
                    virtualScrollRef.value.scrollToIndex(index);
                    clearInterval(intervalId);
                }
            }, 50);
        }
    }
</script>
