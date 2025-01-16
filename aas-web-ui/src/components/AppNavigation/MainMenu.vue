<template>
    <v-container fluid class="pa-0">
        <v-card
            :min-width="200"
            :flat="isMobile"
            :color="isMobile ? 'card' : 'navigationMenu'"
            :style="{
                'border-style': isMobile ? '' : 'solid',
                'border-width': isMobile ? '' : '1px',
            }">
            <v-row>
                <!-- Navigation Column -->
                <v-col cols="12" :class="isMobile ? 'bg-card' : 'bg-navigationMenuSecondary'">
                    <v-card
                        variant="flat"
                        class="pt-3"
                        :style="{ borderRadius: '0px' }"
                        :color="isMobile ? 'card' : 'navigationMenuSecondary'">
                        <span v-if="!isMobile" class="mx-3 text-primary">Switch to</span>
                        <!-- Select the view you want to use -->
                        <v-list v-if="!isMobile" nav class="pa-0 ma-3 bg-navigationMenuSecondary">
                            <v-list-item to="/" @click="closeMenu()">
                                <v-list-item-title>AAS Viewer</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="allowEditing" to="/aaseditor" @click="closeMenu()">
                                <v-list-item-title>AAS Editor</v-list-item-title>
                            </v-list-item>
                            <v-list-item to="/submodelviewer" @click="closeMenu()">
                                <v-list-item-title>Submodel Viewer</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="dashboardAvailable" to="/dashboard" @click="closeMenu()">
                                <v-list-item-title>Dashboard</v-list-item-title>
                            </v-list-item>
                            <v-list-item to="/about" @click="closeMenu()">
                                <v-list-item-title>About</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card>
                </v-col>
            </v-row>
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
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Emit
    const emit = defineEmits<{
        (e: 'closeMenu'): void;
    }>();

    // Additional States
    const dashboardAvailable = ref(false);

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const currentRoute = computed(() => route.name); // get the current route name
    const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS Editor

    watch(currentRoute, () => {
        aasStore.dispatchSelectedAAS({}); // reset selected AAS
    });

    onMounted(async () => {
        dashboardAvailable.value = await checkDashboardAvailability();
    });

    function closeMenu(): void {
        emit('closeMenu');
    }
</script>
