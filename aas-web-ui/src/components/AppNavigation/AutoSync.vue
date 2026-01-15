<template>
    <!-- Mobile Autosync Toggle -->
    <v-badge
        v-if="isMobile"
        dot
        :color="autoSync.state ? 'success' : 'rgba(0,0,0,0)'"
        :offset-x="10"
        :offset-y="10"
        @click="toggleAutoSync()">
        <v-btn icon="mdi-autorenew"></v-btn>
    </v-badge>
    <!-- Desktop Autosync Menu -->
    <v-btn v-else variant="tonal" icon size="small" style="padding-right: 28px; padding-left: 28px">
        <v-icon>mdi-autorenew</v-icon>
        <v-icon>mdi-menu-down</v-icon>
        <v-menu activator="parent" :close-on-content-click="false" width="300px">
            <v-list nav class="py-0 bg-navigationMenu" border rounded="lg">
                <!-- Switch to activate/deactive auto-sync -->
                <v-list-item class="py-0">
                    <v-switch
                        v-model="autoSync.state"
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
                <v-list-item class="py-0 mt-n5">
                    <v-list-item-subtitle class="ml-1">
                        {{ 'Selected AAS & SM/SME (incl. CDs) are synced' }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle class="ml-1">
                        <!-- TODO Auto-Sync feature for ComponentVisualization -->
                        <!-- TODO Auto-Sync feature for Submodel list/tree -->
                        <!-- TODO Add checkboxes for AAS, SM/SME, CD to control which data should be auto-synced -->
                        {{ 'SM list/tree & Visualization are not synced!' }}
                    </v-list-item-subtitle>
                </v-list-item>
                <!-- Input Field to set the sync-interval -->
                <v-list-item class="py-0 mt-n2">
                    <v-text-field
                        v-model="autoSync.interval"
                        density="compact"
                        variant="outlined"
                        type="number"
                        hide-details
                        @update:focused="checkMin">
                        <template #prepend-inner>
                            <v-icon>mdi-timer</v-icon>
                        </template>
                        <template #append-inner>
                            <span>ms</span>
                        </template>
                    </v-text-field>
                </v-list-item>
                <!-- Hint -->
                <v-list-item class="py-0 mt-n2">
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
        <v-badge dot :color="autoSync.state ? 'success' : 'rgba(0,0,0,0)'" :offset-x="16" :offset-y="-10" />
    </v-btn>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Stores
    const navigationStore = useNavigationStore();

    // Computed properties
    const isMobile = computed(() => navigationStore.getIsMobile);
    const autoSync = computed(() => navigationStore.getAutoSync);

    // Checks if the input is smaller than 100ms and sets it to 100ms if it is
    function checkMin(e: boolean) {
        if (autoSync.value.interval < 100 && !e) autoSync.value.interval = 100;
        if (!e) updateAutoSync();
    }

    // Updates the auto-sync object in the store and local storage
    function updateAutoSync() {
        localStorage.setItem('autoSync', JSON.stringify(autoSync.value));
        navigationStore.dispatchAutoSync(autoSync.value);
    }

    function toggleAutoSync() {
        autoSync.value.state = !autoSync.value.state;
        updateAutoSync();
    }
</script>
