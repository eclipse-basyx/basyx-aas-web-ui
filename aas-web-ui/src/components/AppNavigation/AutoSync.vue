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
    <v-btn v-else class="mr-6" variant="outlined">
        <span class="mr-1">{{ 'Auto Sync:' }}</span>
        <span class="text-primary">{{ autoSync.state ? 'On' : 'Off' }}</span>
        <v-icon :style="{ 'margin-left': autoSync.state ? '12.5px' : '6px' }">mdi-chevron-down</v-icon>
        <v-menu activator="parent" :close-on-content-click="false" width="300px">
            <v-list nav class="py-0 bg-navigationMenu" style="border-style: solid; border-width: 1px">
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
                <v-list-item class="py-0" style="margin-top: -10px">
                    <v-list-item-subtitle class="ml-1">
                        {{ 'Selected AAS and SM/SME are auto-synced.' }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle class="ml-1">
                        {{ 'Submodel list/tree is not auto-synced!' }}
                    </v-list-item-subtitle>
                </v-list-item>
                <!-- Input Field to set the sync-interval -->
                <v-list-item class="py-0">
                    <v-text-field
                        v-model="autoSync.interval"
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
    import { computed, onMounted } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { AutoSyncType } from '@/types/Application';

    const navigationStore = useNavigationStore();

    // Data
    const autoSyncDefault = { state: false, interval: 3000 } as AutoSyncType;

    // Computed properties
    const isMobile = computed(() => navigationStore.getIsMobile);
    const autoSync = computed(() => navigationStore.getAutoSync);

    onMounted(async () => {
        // Get auto-sync object from the lcoal storage, if not set use auto-sync default object
        var autoSyncToDispatch = JSON.parse(
            localStorage.getItem('autoSync') || JSON.stringify(autoSyncDefault)
        ) as AutoSyncType;
        navigationStore.dispatchUpdateAutoSync(autoSyncToDispatch);
    });

    // Checks if the input is smaller than 100ms and sets it to 100ms if it is
    function checkMin(e: boolean) {
        if (autoSync.value.interval < 100 && !e) autoSync.value.interval = 100;
        if (!e) updateAutoSync();
    }

    // Updates the auto-sync object in the store and local storage
    function updateAutoSync() {
        localStorage.setItem('autoSync', JSON.stringify(autoSync.value));
        navigationStore.dispatchUpdateAutoSync(autoSync.value);
    }

    function toggleAutoSync() {
        autoSync.value.state = !autoSync.value.state;
        updateAutoSync();
    }
</script>
