<template>
    <template v-if="submodelElementData && Array.isArray(submodelElementData) && submodelElementData.length > 0">
        <template v-for="(submodelElement, index) in submodelElementData" :key="index">
            <template v-if="['SubmodelElementCollection', 'SubmodelElementList'].includes(submodelElement.modelType)">
                <tr class="bg-tableOdd">
                    <td colspan="4">
                        <p class="text-subtitle-2 py-4" :class="'pl-' + level * 3">
                            <v-icon class="mr-2" size="small" color="icon">mdi-folder</v-icon>
                            <span class="text-titleText">{{ nameToDisplay(submodelElement) }}</span>
                        </p>
                    </td>
                </tr>
                <GenericDataTableView
                    :submodel-element-data="submodelElement.value"
                    :level="Number(level) + 1"></GenericDataTableView>
            </template>
            <template v-else-if="['Property', 'MultiLanguageProperty'].includes(submodelElement.modelType)">
                <tr>
                    <td>
                        <p class="text-caption">
                            {{ nameToDisplay(submodelElement) }}
                        </p>
                    </td>
                    <td>
                        <p class="text-caption" style="min-width: 100px">{{ descriptionToDisplay(submodelElement) }}</p>
                    </td>
                    <td>
                        <p class="text-caption" style="min-width: 200px">{{ cdDefinition(submodelElement) }}</p>
                    </td>
                    <td>
                        <p class="text-caption">
                            {{ valueToDisplay(submodelElement) }}
                        </p>
                    </td>
                </tr>
            </template>
        </template>
    </template>
    <template v-else>
        <tr style="border: 0 !important'">
            <td colspan="4" style="border: 0 !important">-</td>
        </tr>
    </template>
</template>

<script lang="ts" setup>
    import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';

    defineOptions({
        inheritAttrs: false,
    });

    // Composables
    const { cdDefinition } = useConceptDescriptionHandling();
    const { descriptionToDisplay, nameToDisplay } = useReferableUtils();
    const { valueToDisplay } = useSME();

    // Properties
    defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
        level: {
            type: Number,
            default: 0,
        },
    });
</script>
