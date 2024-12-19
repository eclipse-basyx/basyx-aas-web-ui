<template>
    <!-- Mobile Autosync Toggle -->
    <v-badge
        v-if="isMobile"
        dot
        :color="autoSyncStatus ? 'success' : 'rgba(0,0,0,0)'"
        :offset-x="10"
        :offset-y="10"
        @click="toggleAutoSync()">
        <v-btn icon="mdi-autorenew"></v-btn>
    </v-badge>
    <!-- Desktop Autosync Menu -->
    <v-btn v-else class="mr-6" variant="outlined">
        <span class="mr-1">{{ 'Auto Sync:' }}</span>
        <span class="text-primary">{{ autoSyncStatus ? 'On' : 'Off' }}</span>
        <v-icon :style="{ 'margin-left': autoSyncStatus ? '12.5px' : '6px' }">mdi-chevron-down</v-icon>
        <v-menu activator="parent" :close-on-content-click="false" width="300px">
            <v-list nav class="py-0 bg-navigationMenu" style="border-style: solid; border-width: 1px">
                <!-- Switch to activate/deactive auto-sync -->
                <v-list-item class="py-0">
                    <v-switch
                        v-model="autoSyncStatus"
                        label="Auto Sync"
                        color="primary"
                        class="mx-3"
                        hide-details
                        @change="updateAutoSync()">
                        <template #append>
                            <v-icon>mdi-autorenew</v-icon>
                        </template>
                    </v-switch>
                </v-list-item>
                <!-- Hint -->
                <v-list-item class="py-0" style="margin-top: -10px">
                    <v-list-item-subtitle class="ml-1">{{
                        'Only SubmodelElements can be auto-synced.'
                    }}</v-list-item-subtitle>
                    <v-list-item-subtitle class="ml-1">{{ 'Submodels are synced on selection.' }}</v-list-item-subtitle>
                </v-list-item>
                <!-- Input Field to set the sync-interval -->
                <v-list-item class="py-0">
                    <v-text-field
                        v-model="intervalTime"
                        density="compact"
                        variant="outlined"
                        type="number"
                        hide-details
                        @update:focused="checkMin">
                        <template #append-inner>
                            <span>ms</span>
                        </template>
                    </v-text-field>
                </v-list-item>
                <!-- Hint -->
                <v-list-item class="py-0" style="margin-top: -10px">
                    <v-list-item-subtitle class="ml-1">{{ 'Be careful decreasing the time!' }}</v-list-item-subtitle>
                    <v-list-item-subtitle class="ml-1">{{
                        'A smaller time means more requests.'
                    }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider></v-divider>
                <!-- Switch to enable/disable AAS Status Checks -->
                <StatusSwitch></StatusSwitch>
            </v-list>
        </v-menu>
    </v-btn>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import StatusSwitch from '@/components/AppNavigation/Settings/StatusSwitch.vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    const navigationStore = useNavigationStore();

    const autoSyncStatus = ref(navigationStore.getAutoSync ? navigationStore.getAutoSync.state : false);
    const intervalTime = ref(1000);

    const isMobile = computed(() => navigationStore.getIsMobile);

    // Checks if the input is smaller than 100ms and sets it to 100ms if it is
    function checkMin(e: boolean) {
        if (intervalTime.value < 100 && !e) intervalTime.value = 100;
        if (!e) updateAutoSync();
    }

    // Updates the auto-sync (+ interval) in the store
    function updateAutoSync() {
        navigationStore.dispatchUpdateAutoSync({
            state: autoSyncStatus.value,
            interval: intervalTime.value,
        });
    }

    // Toggles the auto-sync
    function toggleAutoSync() {
        autoSyncStatus.value = !autoSyncStatus.value;
        updateAutoSync();
    }
</script>
