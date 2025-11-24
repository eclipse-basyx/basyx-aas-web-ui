<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-cog" class="ml-3"></v-btn>
        </template>
        <v-card
            :width="364"
            :color="isMobile ? 'card' : 'navigationMenu'"
            :style="{ 'border-style': isMobile ? '' : 'solid', 'border-width': isMobile ? '' : '1px' }">
            <v-list nav class="py-0" :class="isMobile ? 'bg-card' : 'bg-navigationMenu'">
                <!-- Switch to change the app theme -->
                <ThemeSwitch></ThemeSwitch>
                <v-divider class="mt-3"></v-divider>
                <!-- Backend Configuration (infrastructure selection) -->
                <InfrastructureSelector @open-manage="openInfrastructureManagement"></InfrastructureSelector>
                <v-divider class="mt-3"></v-divider>
                <v-list-item class="py-0" density="compact" nav>
                    <v-list-item-title class="text-caption text-medium-emphasis pb-0">
                        <span>Version: </span>
                        <span v-if="versionDisplay.showVersion" class="font-weight-medium">
                            {{ versionDisplay.versionText }}
                        </span>
                        <span v-if="versionDisplay.showVersion && versionDisplay.showSnapshot" class="mx-1">·</span>
                        <span v-if="versionDisplay.showSnapshot">{{ versionDisplay.snapshotText }}</span>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>

    <!-- Infrastructure Management Dialog -->
    <InfrastructureManagement v-model:open="infrastructureManagementDialog"></InfrastructureManagement>
</template>

<script lang="ts" setup>
    import { computed, ref, watch } from 'vue';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getVersionDisplay } from '@/version';

    // const envStore = useEnvStore();
    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    const infrastructureMenu = ref(false); // Variable to show the Infrastructure Menu
    const infrastructureManagementDialog = ref(false); // Variable to show the Infrastructure Management Dialog

    const isMobile = computed(() => navigationStore.getIsMobile);
    const versionDisplay = getVersionDisplay();

    // Watch for trigger to open infrastructure management dialog (e.g., from token refresh failure)
    watch(
        () => infrastructureStore.getTriggerInfrastructureDialog,
        () => {
            infrastructureManagementDialog.value = true;
        }
    );

    function openInfrastructureManagement(): void {
        infrastructureMenu.value = false;
        infrastructureManagementDialog.value = true;
    }
</script>
