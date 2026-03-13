<template>
    <!-- TODO Generalize StatusCheck Feature -->
    <!-- TODO Add StatusCheck for SM in SM list/tree -->
    <!-- TODO Add StatusCheck for SM in SMEView -->
    <!-- TODO Add StatusCheck for CD in SMEView -->
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
    <v-list-item class="py-0 mt-n3 mb-3">
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
    import { computed } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Stores
    const navigationStore = useNavigationStore();

    // Computed Properties
    const statusCheck = computed(() => navigationStore.getStatusCheck);

    // Checks if the input is smaller than 1000ms and sets it to 1000ms if it is
    function checkMin(e: boolean) {
        if (statusCheck.value.interval < 1000 && !e) statusCheck.value.interval = 1000;
        if (!e) updateStatusCheck();
    }

    function updateStatusCheck() {
        navigationStore.dispatchStatusCheck(statusCheck.value);
        localStorage.setItem('statusCheck', JSON.stringify(statusCheck.value));
    }
</script>
