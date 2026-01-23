<template>
    <v-container fluid class="pa-0">
        <!-- Global Asset ID -->
        <v-row v-if="showGlobalAssetId" align="center">
            <v-col class="py-0">
                <v-text-field
                    v-model="globalAssetIdValue"
                    label="Global Asset Id"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    clearable>
                    <template v-if="showGenerateIriForGlobal" #append-inner>
                        <v-btn
                            color="primary"
                            size="small"
                            slim
                            border
                            variant="text"
                            text="Generate IRI"
                            class="text-none"
                            @click.stop="globalAssetIdValue = generateIri('GlobalAssetId')" />
                    </template>
                </v-text-field>
            </v-col>
            <v-col cols="auto" class="px-0">
                <HelpInfoButton help-type="globalAssetId" />
            </v-col>
        </v-row>

        <!-- Specific Asset IDs -->
        <template v-if="showSpecificAssetIds">
            <v-divider v-if="showGlobalAssetId" class="my-3"></v-divider>
            <span class="text-subtitle-2 font-weight-medium">Specific Asset Ids</span>
            <v-list-item v-for="(assetId, i) in specificAssetIdsValue" :key="i" class="px-0">
                <v-row>
                    <v-col class="py-0">
                        <v-text-field
                            v-model="assetId.name"
                            label="Name"
                            variant="outlined"
                            density="comfortable"
                            clearable>
                            <template v-if="showGenerateIriForSpecific" #append-inner>
                                <v-btn
                                    color="primary"
                                    size="small"
                                    slim
                                    border
                                    variant="text"
                                    text="Generate IRI"
                                    class="text-none"
                                    @click.stop="assetId.name = generateIri('SpecificAssetId')" />
                            </template>
                        </v-text-field>
                    </v-col>
                    <v-col class="py-0">
                        <v-text-field
                            v-model="assetId.value"
                            label="Value"
                            variant="outlined"
                            density="comfortable"
                            append-icon="mdi-delete"
                            @click:append="deleteSpecificAssetId(assetId)"></v-text-field>
                    </v-col>
                </v-row>
            </v-list-item>
            <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                variant="outlined"
                text="Add"
                class="text-none mt-1"
                @click="addSpecificAssetId"></v-btn>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { ref, watch } from 'vue';
    import { useIDUtils } from '@/composables/IDUtils';

    // Composables
    const { generateIri } = useIDUtils();

    const props = withDefaults(
        defineProps<{
            globalAssetId?: string | null;
            specificAssetIds?: Array<aasTypes.SpecificAssetId> | null;
            showGlobalAssetId?: boolean;
            showSpecificAssetIds?: boolean;
            showGenerateIriForGlobal?: boolean;
            showGenerateIriForSpecific?: boolean;
        }>(),
        {
            globalAssetId: null,
            specificAssetIds: null,
            showGlobalAssetId: true,
            showSpecificAssetIds: true,
            showGenerateIriForGlobal: false,
            showGenerateIriForSpecific: false,
        }
    );

    const emit = defineEmits<{
        (event: 'update:globalAssetId', value: string | null): void;
        (event: 'update:specificAssetIds', value: Array<aasTypes.SpecificAssetId> | null): void;
    }>();

    const globalAssetIdValue = ref<string | null>(props.globalAssetId);
    const specificAssetIdsValue = ref<Array<aasTypes.SpecificAssetId>>(
        props.specificAssetIds && props.specificAssetIds.length > 0 ? props.specificAssetIds : []
    );

    watch(globalAssetIdValue, (newValue) => {
        if (newValue === '') {
            emit('update:globalAssetId', null);
            globalAssetIdValue.value = null;
        } else {
            emit('update:globalAssetId', newValue);
        }
    });

    watch(
        specificAssetIdsValue,
        (newValue) => {
            emit('update:specificAssetIds', newValue.length > 0 ? newValue : null);
        },
        { deep: true }
    );

    watch(
        () => props.globalAssetId,
        (newValue) => {
            globalAssetIdValue.value = newValue;
        }
    );

    watch(
        () => props.specificAssetIds,
        (newValue) => {
            specificAssetIdsValue.value = newValue && newValue.length > 0 ? newValue : [];
        }
    );

    function addSpecificAssetId() {
        specificAssetIdsValue.value.push(new aasTypes.SpecificAssetId('', ''));
    }

    function deleteSpecificAssetId(assetId: aasTypes.SpecificAssetId) {
        const index = specificAssetIdsValue.value.indexOf(assetId);
        if (index !== -1) {
            specificAssetIdsValue.value.splice(index, 1);
        }
    }
</script>
