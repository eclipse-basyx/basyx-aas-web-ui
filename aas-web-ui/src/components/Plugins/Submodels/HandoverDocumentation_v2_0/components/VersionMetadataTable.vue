<template>
    <v-card variant="outlined">
        <v-table>
            <tbody>
                <tr
                    v-for="(child, c) in metadataChildren"
                    :key="child.idShort ?? child.id ?? `child-${c}`"
                    :class="Number(c) % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                    <td class="w-50">
                        <div class="text-caption">
                            {{ nameToDisplay(child) }}
                            <DescriptionTooltip :description-array="getDescriptionArray(child)" />
                        </div>
                    </td>

                    <td>
                        <!-- MultiLanguageProperty -->
                        <template v-if="child.modelType === 'MultiLanguageProperty'">
                            <div v-if="valueToDisplay(child)" class="text-caption text-subtitleText">
                                {{ valueToDisplay(child) }}
                            </div>
                            <div v-else>
                                <div v-for="(langStringSet, k) in getLangSets(child)" :key="k" class="text-caption">
                                    <v-chip size="x-small" label class="mr-1">
                                        {{ langStringSet.language }}
                                    </v-chip>
                                    {{ langStringSet.text }}
                                </div>
                            </div>
                        </template>

                        <template v-else-if="child.modelType === 'SubmodelElementList'">
                            <div v-if="getChildEntries(child).length === 0" class="text-caption text-subtitleText">
                                —
                            </div>

                            <div v-else>
                                <div
                                    v-for="(entry, e) in getChildEntries(child)"
                                    :key="entry.idShort ?? entry.id ?? `entry-${e}`"
                                    class="text-caption text-subtitleText">
                                    <!-- entry can be Property, ReferenceElement, File etc -->
                                    <template v-if="entry.modelType === 'MultiLanguageProperty'">
                                        {{ valueToDisplay(entry) }}
                                    </template>

                                    <template v-else>
                                        {{ valueToDisplay(entry) }}
                                    </template>
                                </div>
                            </div>
                        </template>
                        <!-- File -->
                        <template v-else-if="child.modelType === 'File'">
                            <div class="text-caption text-subtitleText">
                                {{ child.contentType }}
                                <span v-if="child.value">
                                    —
                                    {{ child.value }}</span
                                >
                            </div>
                        </template>

                        <!-- Default -->
                        <span v-else class="text-caption text-subtitleText">
                            {{ valueToDisplay(child) }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </v-table>
    </v-card>
</template>

<script lang="ts" setup>
    import type { SubmodelElementLike } from '../types';
    import { computed } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { asSubmodelElementArray, getDescriptionArray, getLangSets } from '../utils/submodelElementUtils';

    defineOptions({
        name: 'VersionMetadataTable',
    });

    const { nameToDisplay } = useReferableUtils();
    const { valueToDisplay } = useSME();

    const props = defineProps<{
        versionSmc?: SubmodelElementLike | null;
    }>();

    const metadataChildren = computed(() => {
        const children = asSubmodelElementArray(props.versionSmc?.value);
        return children.filter((child) => !isAttachmentChild(child));
    });

    function isAttachmentChild(child: unknown): boolean {
        if (!child || typeof child !== 'object') {
            return false;
        }

        const entry = child as SubmodelElementLike;
        return entry.idShort === 'PreviewFile' || entry.idShort === 'DigitalFiles';
    }

    function getChildEntries(child: SubmodelElementLike): SubmodelElementLike[] {
        return asSubmodelElementArray(child.value);
    }
</script>
