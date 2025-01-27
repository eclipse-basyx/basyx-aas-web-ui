<template>
    <v-switch
        v-model="statusCheckStatus"
        color="primary"
        class="ml-2"
        hide-details
        label="AAS Status Checks"
        @change="updateStatusCheck()"></v-switch>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Stores
    const navigationStore = useNavigationStore();

    // Data
    const statusCheckStatus = ref(navigationStore.getStatusCheck);

    function updateStatusCheck() {
        navigationStore.dispatchUpdateStatusCheck(statusCheckStatus.value);
        localStorage.setItem('statusCheck', statusCheckStatus.value.toString()); // save status-check preference in local storage
    }
</script>
