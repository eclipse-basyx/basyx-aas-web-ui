<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="tonal" size="small" style="padding-right: 28px; padding-left: 28px">
                <v-icon>mdi-cog</v-icon>
                <v-icon>mdi-menu-down</v-icon>
            </v-btn>
        </template>
        <v-card
            :width="364"
            :color="isMobile ? 'card' : 'navigationMenu'"
            :rounded="isMobile ? '' : 'lg'"
            :border="!isMobile">
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
    import { computed, ref } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getVersionDisplay } from '@/version';

    const navigationStore = useNavigationStore();

    const infrastructureMenu = ref(false); // Variable to show the Infrastructure Menu
    const infrastructureManagementDialog = ref(false); // Variable to show the Infrastructure Management Dialog

    const isMobile = computed(() => navigationStore.getIsMobile);
    const versionDisplay = getVersionDisplay();

    function openInfrastructureManagement(): void {
        infrastructureMenu.value = false;
        infrastructureManagementDialog.value = true;
    }
</script>
