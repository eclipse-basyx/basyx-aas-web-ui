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
                        <p>
                            <v-tooltip
                                location="bottom start"
                                open-delay="250"
                                :text="descriptionToDisplay(submodelElement)">
                                <template #activator="{ props }">
                                    <span v-bind="props" class="text-caption">
                                        {{ nameToDisplay(submodelElement) }}
                                    </span>
                                </template>
                            </v-tooltip>
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

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

    export default defineComponent({
        name: 'GenericDataTableView',
        mixins: [SubmodelElementHandling],
        inheritAttrs: false,
        props: {
            submodelElementData: {
                type: Object,
                default() {
                    return {};
                },
                required: true,
            },
            level: {
                type: Number,
                default: 0,
            },
        },

        setup() {
            const theme = useTheme();

            return {
                theme, // Theme Object
            };
        },
    });
</script>
