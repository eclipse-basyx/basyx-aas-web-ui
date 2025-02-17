<template>
    <v-container fluid class="pa-0">
        <!-- Plugin Title -->
        <v-card class="mb-3">
            <v-card-title>
                <div class="text-subtitle-1">{{ nameToDisplay(submodelElementData) }}</div>
            </v-card-title>
        </v-card>
        <v-card>
            <v-card-text class="pt-1">
                <GenericDataVisu :submodel-element-data="submodelElementData.submodelElements"></GenericDataVisu>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASStore } from '@/store/AASDataStore';

    defineOptions({
        name: 'HelloWorldPlugin',
        semanticId: 'http://hello.world.de/plugin_submodel',
    });

    // Stores
    const aasStore = useAASStore();

    // Composables
    const { setData } = useSMHandling();
    const { nameToDisplay } = useReferableUtils();

    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const submodelData = ref<any>({});

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);

    onMounted(() => {
        initializePlugin();
    });

    async function initializePlugin(): Promise<void> {
        // Check ig the prop has been passed
        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            return; // Return if no data is available
        }

        // Extract the Submodel data as a copy from the prop and save it in a local variable
        const copiedSubmodelData = { ...props.submodelElementData };

        // Calculate the pathes of the child elements and save the data in the mySubmodelData variable
        // Set last parameter `withConceptDescriptions` to true, if Concept Descriptions are needed in the plugin
        submodelData.value = await setData(
            copiedSubmodelData,
            selectedNode.value.path,
            false,
            selectedNode.value.timestamp
        );
    }
</script>
