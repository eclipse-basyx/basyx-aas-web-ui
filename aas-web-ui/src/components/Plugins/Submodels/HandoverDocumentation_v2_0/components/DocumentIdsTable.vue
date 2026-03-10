<template>
    <template v-if="(props.documentIds ?? []).length > 0">
        <v-card variant="outlined" class="mt-3">
            <v-table>
                <thead>
                    <tr>
                        <th v-for="idProperty in props.documentIds?.[0]?.value ?? []" :key="idProperty.idShort">
                            <div class="text-caption">
                                <span>{{ nameToDisplay(idProperty) }}</span>
                                <DescriptionTooltip :description-array="idProperty?.description" />
                            </div>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr
                        v-for="(documentIdSMC, j) in getDocumentIds(props.documentIds)"
                        v-show="hasValue(documentIdSMC)"
                        :key="documentIdSMC.idShort ?? String(j)"
                        :class="Number(j) % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                        <td v-for="idProperty in documentIdSMC.value ?? []" :key="idProperty.idShort">
                            <!-- MultiLanguageProperty -->
                            <template v-if="idProperty.modelType === 'MultiLanguageProperty'">
                                <!-- Show english value, if available -->
                                <div v-if="valueToDisplay(idProperty)" class="text-caption text-subtitleText">
                                    {{ valueToDisplay(idProperty) }}
                                </div>

                                <!-- Otherwise show all available values -->
                                <div v-else>
                                    <template v-for="(langStringSet, k) in getLangSets(idProperty)" :key="k">
                                        <div class="text-caption">
                                            <v-chip size="x-small" label class="mr-1">
                                                {{ langStringSet.language }}
                                            </v-chip>
                                            {{ langStringSet.text }}
                                        </div>
                                    </template>
                                </div>
                            </template>

                            <!-- Default -->
                            <span v-else class="text-caption text-subtitleText">
                                {{ valueToDisplay(idProperty) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-card>
    </template>

    <v-alert v-else class="mt-3" density="compact" type="warning" variant="outlined" text="No Document IDs available" />
</template>
<script lang="ts" setup>
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';

    const { nameToDisplay } = useReferableUtils();
    const { hasValue, valueToDisplay } = useSME();

    defineOptions({
        name: 'DocumentIdsTable',
    });

    const props = defineProps({
        documentIds: {
            type: Array as any,
            default: () => [],
        },
    });

    // return only entries that have text
    function getLangSets(idProperty: any): any[] {
        return (idProperty?.value ?? []).filter((ls: any) => ls?.text?.length > 0);
    }
    function getDocumentIds(documentIds: any): any[] {
        return Array.isArray(documentIds) ? documentIds : [];
    }
</script>
