<template>
    <v-list-item class="py-0">
        <v-switch
            v-model="statusCheck.state"
            color="primary"
            class="mx-3"
            hide-details
            label="AAS Status Checks"
            @change="updateStatusCheck()">
            <template #append>
                <v-icon>mdi-cloud-outline</v-icon>
            </template></v-switch
        >
    </v-list-item>
    <!-- Input Field to set the sync-interval -->
    <v-list-item class="py-y0 mt-n3">
        <v-text-field
            v-model="statusCheck.interval"
            density="compact"
            variant="outlined"
            type="number"
            hide-details
            :disabled="true"
            @update:focused="checkMin">
            <template #prepend-inner>
                <v-icon>mdi-timer</v-icon>
            </template>
            <template #append-inner>
                <span>ms</span>
            </template>
        </v-text-field>
    </v-list-item>
</template>

<script lang="ts" setup>
    import { computed, onMounted } from 'vue';
    import { StatusCheckType, useNavigationStore } from '@/store/NavigationStore';

    // Stores
    const navigationStore = useNavigationStore();

    // Data
    const statusCheckDefault = { state: true, interval: 3000 } as StatusCheckType;

    // Computed Properties
    const statusCheck = computed(() => navigationStore.getStatusCheck);

    onMounted(async () => {
        // Get auto-sync object from the lcoal storage, if not set use auto-sync default object
        var statusCheckToDispatch = JSON.parse(
            localStorage.getItem('statusCheck') || JSON.stringify(statusCheckDefault)
        ) as StatusCheckType;
        navigationStore.dispatchUpdateStatusCheck(statusCheckToDispatch);
    });

    // Checks if the input is smaller than 100ms and sets it to 100ms if it is
    function checkMin(e: boolean) {
        if (statusCheck.value.interval < 100 && !e) statusCheck.value.interval = 100;
        if (!e) updateStatusCheck();
    }

    function updateStatusCheck() {
        localStorage.setItem('statusCheck', JSON.stringify(statusCheck.value));
        navigationStore.dispatchUpdateStatusCheck(statusCheck.value);
    }
</script>
