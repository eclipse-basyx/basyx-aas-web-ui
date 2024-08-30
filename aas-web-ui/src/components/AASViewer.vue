<template>
    <v-container fluid class="pa-0">
        <!-- Horizontal Flexbox for the two main components (SubmodelList, SubmodelVisualization) -->
        <div style="display: flex">
            <!-- SubmodelList Component -->
            <div class="pa-0 window" style="width: 350px; min-width: 350px">
                <SubmodelList />
            </div>
            <!-- Divider between SubmodelList and SubmodelVisualization -->
            <div style="position: relative; height: calc(100vh - 106px); z-index: 1">
                <v-divider vertical style="position: absolute; height: calc(100vh - 106px); z-index: 1"></v-divider>
            </div>
            <!-- SubmodelVisualization Component -->
            <div class="pa-0 window" style="flex-grow: 1">
                <ComponentVisualization />
            </div>
        </div>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import ComponentVisualization from './ComponentVisualization.vue';
    import SubmodelList from './SubmodelList.vue';

    export default defineComponent({
        name: 'AASViewer',
        components: {
            SubmodelList,
            ComponentVisualization,
        },

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        computed: {},

        methods: {},
    });
</script>
