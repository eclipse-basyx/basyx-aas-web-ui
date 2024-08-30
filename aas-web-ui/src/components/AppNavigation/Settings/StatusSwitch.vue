<template>
    <v-switch
        v-model="statusCheckStatus"
        color="primary"
        class="ml-2"
        hide-details
        label="AAS Status Checks"
        @change="updateStatusCheck()"></v-switch>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'StatusSwitch',

        setup() {
            const navigationStore = useNavigationStore();

            return {
                navigationStore, // NavigationStore Object
            };
        },

        data() {
            return {
                statusCheckStatus: false, // Status of the status-check (true = active, false = inactive)
            };
        },

        computed: {
            // get the status-check state from the store
            statusCheck() {
                return this.navigationStore.getStatusCheck;
            },
        },

        mounted() {
            this.statusCheckStatus = this.statusCheck;
        },

        methods: {
            // Function to toggle the status-check
            updateStatusCheck() {
                this.navigationStore.dispatchUpdateStatusCheck(this.statusCheckStatus);
                // save status-check preference in local storage
                localStorage.setItem('statusCheck', this.statusCheckStatus.toString());
            },
        },
    });
</script>
