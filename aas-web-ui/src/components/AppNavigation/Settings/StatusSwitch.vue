<template>
    <v-list-item class="py-0">
        <v-switch
            v-model="localAasStatusCheck.state"
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
            v-model="localAasStatusCheck.interval"
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
    import { computed, onMounted, ref } from 'vue';
    import { AASStatusCheckType, useNavigationStore } from '@/store/NavigationStore';

    // Stores
    const navigationStore = useNavigationStore();

    // Data
    const localAasStatusCheck = ref({} as AASStatusCheckType);

    // Computed Properties
    const aasStatusCheck = computed(() => navigationStore.getAASStatusCheck);

    onMounted(() => {
        localAasStatusCheck.value = aasStatusCheck.value;
    });

    // Checks if the input is smaller than 100ms and sets it to 100ms if it is
    function checkMin(e: boolean) {
        if (localAasStatusCheck.value.interval < 100 && !e) localAasStatusCheck.value.interval = 100;
        if (!e) updateStatusCheck();
    }

    function updateStatusCheck() {
        navigationStore.dispatchUpdateStatusCheck(localAasStatusCheck.value);
        localStorage.setItem('aasStatusCheck', JSON.stringify(localAasStatusCheck.value)); // save status-check preference in local storage
    }
</script>
