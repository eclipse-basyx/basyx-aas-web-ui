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
                            :border="isActive('/')"
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
                            :border="isActive('/aaseditor')"
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
                            :border="isActive('/submodelviewer')"
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
                    <v-col cols="12" sm="5" class="pl-3">
                        <v-sheet border rounded color="rgba(0, 0, 0, 0)" class="pt-2 px-3" height="100%">
                            <div class="d-flex align-center text-subtitle-1">
                                <v-icon icon="mdi-view-module" size="x-small" color="primary" start />
                                <strong>Modules</strong>
                            </div>
                            <v-divider class="mt-3"></v-divider>
                            <v-list-item
                                v-for="module in moduleRoutes"
                                :key="module.name"
                                class="mt-3 py-2"
                                :active="false"
                                :border="isActive(module.path)"
                                slim
                                nav
                                :subtitle="module.path"
                                :title="module.name?.toString()"
                                :to="module.path"
                                @click="closeMenu" />
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

                <v-img src="@/assets/PoweredByBaSyx.svg" :height="42" style="margin-right: -36px"></v-img>
            </template>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useDashboardHandling } from '@/composables/DashboardHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();

    // Composables
    const { checkDashboardAvailability } = useDashboardHandling();

    // Stores
    const aasStore = useAASStore();
    const envStore = useEnvStore();
    const navigationStore = useNavigationStore();

    // Emit
    const emit = defineEmits<{
        (e: 'closeMenu'): void;
    }>();

    // Additional States
    const dashboardAvailable = ref(false);

    // Computed Properties
    const currentRoute = computed(() => route.name); // get the current route name
    const currentRoutePath = computed(() => route.path); // get the current route path
    const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS Editor
    const moduleRoutes = computed(() => navigationStore.getModuleRoutes); // get the module routes

    watch(currentRoute, () => {
        aasStore.dispatchSelectedAAS({}); // reset selected AAS
    });

    onMounted(async () => {
        dashboardAvailable.value = await checkDashboardAvailability();
    });

    function closeMenu(): void {
        emit('closeMenu');
    }

    function isActive(route: string): boolean {
        return currentRoutePath.value === route;
    }
</script>
