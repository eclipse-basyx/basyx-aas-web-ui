<template>
    <v-container fluid class="pa-0">
        <v-card class="pa-2" border rounded="lg" color="navigationMenu" :min-width="620">
            <v-container>
                <v-sheet
                    class="overflow-hidden mx-auto mb-4"
                    :elevation="smViewerEditor || filteredAndOrderedModuleRoutes.length > 0 ? 2 : 0"
                    rounded="lg"
                    min-width="450">
                    <template v-if="smViewerEditor || filteredAndOrderedModuleRoutes.length > 0">
                        <v-tabs v-model="currentTab" color="primary" grow>
                            <v-tab value="aas" class="text-none" text="AAS" />

                            <v-divider vertical />

                            <v-tab v-if="smViewerEditor" value="submodel" class="text-none" text="Submodel" />

                            <v-divider vertical />

                            <v-tab
                                v-if="filteredAndOrderedModuleRoutes.length > 0"
                                value="modules"
                                class="text-none"
                                text="Modules" />
                        </v-tabs>
                        <v-divider></v-divider>
                    </template>
                    <div class="pa-2">
                        <v-list-item
                            v-if="currentTab === 'aas'"
                            class="py-2"
                            :active="false"
                            nav
                            :border="isActiveRoutePath('/')"
                            subtitle="View Asset Administration Shells"
                            title="AAS Viewer"
                            :to="isActiveRoutePath('/') ? '' : { path: '/', query: route.query }"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="custom:aasIcon" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-if="allowEditing && currentTab === 'aas'"
                            class="mt-3 py-2"
                            :active="false"
                            nav
                            :border="isActiveRoutePath('/aaseditor')"
                            subtitle="Edit Asset Administration Shells"
                            title="AAS Editor"
                            :to="isActiveRoutePath('/aaseditor') ? '' : { path: '/aaseditor', query: route.query }"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="mdi-pencil" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-if="currentTab === 'aas'"
                            class="mt-3 py-2"
                            nav
                            :active="false"
                            :border="isActiveRoutePath('/aassmviewer')"
                            subtitle="View Submodel Visualizations of Asset Administration Shells"
                            title="AAS SM Visualizations"
                            :to="isActiveRoutePath('/aassmviewer') ? '' : { path: '/aassmviewer', query: route.query }"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="mdi-group" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-if="smViewerEditor && currentTab === 'submodel'"
                            class="py-2"
                            nav
                            :active="false"
                            :border="isActiveRoutePath('/smviewer')"
                            subtitle="View Submodels"
                            title="SM Viewer"
                            :to="isActiveRoutePath('/smviewer') ? '' : { path: '/smviewer', query: route.query }"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="mdi-ungroup" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-if="smViewerEditor && allowEditing && currentTab === 'submodel'"
                            class="mt-3 py-2"
                            :active="false"
                            nav
                            :border="isActiveRoutePath('/smeditor')"
                            subtitle="Edit Submodels"
                            title="SM Editor"
                            :to="isActiveRoutePath('/smeditor') ? '' : { path: '/smeditor', query: route.query }"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="mdi-pencil" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-if="selectedNode && Object.keys(selectedNode).length > 0 && currentTab === 'submodel'"
                            class="mt-3 py-2"
                            nav
                            :active="false"
                            :border="isActiveRoutePath('/visu')"
                            subtitle="Visualize Submodels/Submodel Elements"
                            title="Visualization"
                            :to="isActiveRoutePath('/visu') ? '' : { path: '/visu', query: route.query }"
                            @click="closeMenu">
                            <template #prepend>
                                <v-avatar color="surface-light" icon="mdi-chart-line" rounded>
                                    <v-icon color="medium-emphasis" />
                                </v-avatar>
                            </template>
                        </v-list-item>
                        <v-list
                            v-if="currentTab === 'modules'"
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
                                        :title="
                                            item.meta?.title ? item.meta.title.toString() : item.meta?.name?.toString()
                                        "
                                        :to="
                                            item?.meta?.preserveRouteQuery === true
                                                ? { path: item.path, query: route.query }
                                                : { path: item.path }
                                        "
                                        @click="closeMenu" />
                                </template>
                            </v-virtual-scroll>
                        </v-list>
                    </div>
                </v-sheet>
            </v-container>
            <template #actions>
                <v-btn
                    class="text-none"
                    color="primary"
                    text="About"
                    :to="isActiveRoutePath('/about') ? '' : '/about'"
                    @click="closeMenu" />

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
    import { computed, onMounted, Ref, ref } from 'vue';
    import { useRoute } from 'vue-router';
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
    const aasStore = useAASStore();
    const envStore = useEnvStore();
    const navigationStore = useNavigationStore();

    // Emit
    const emit = defineEmits<{
        (e: 'closeMenu'): void;
    }>();

    // Data
    const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null); // Reference to the Virtual Scroll Component
    const currentTab: Ref<string> = ref('aas'); // Current Tab Index

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const currentRoutePath = computed(() => route.path); // get the current route path
    const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS resp. SM Editor
    const smViewerEditor = computed(() => envStore.getSmViewerEditor); // Check the current environment allows showing the SM Viewer/Editor
    const moduleRoutes = computed(() => navigationStore.getModuleRoutes); // get the module routes
    const selectedAas = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store
    const selectedNode = computed(() => aasStore.getSelectedNode); // get selected AAS from Store
    const filteredAndOrderedModuleRoutes = computed(() => {
        const filteredModuleRoutes = moduleRoutes.value.filter((moduleRoute: RouteRecordRaw) => {
            if (isMobile.value && !moduleRoute?.meta?.isMobileModule) return false;
            if (!isMobile.value && !moduleRoute?.meta?.isDesktopModule) return false;
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

    onMounted(async () => {
        scrollToSelectedModule();
        setTabByRoutePath();
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

    function setTabByRoutePath(): void {
        if (isActiveRoutePath('/') || isActiveRoutePath('/aaseditor') || isActiveRoutePath('/aassmviewer')) {
            currentTab.value = 'aas';
        } else if (isActiveRoutePath('/smviewer') || isActiveRoutePath('/smeditor') || isActiveRoutePath('/visu')) {
            currentTab.value = 'submodel';
        } else {
            currentTab.value = 'modules';
        }
    }
</script>
