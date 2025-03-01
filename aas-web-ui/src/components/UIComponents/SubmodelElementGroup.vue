<template>
    <v-container fluid class="pa-0">
        <v-card color="elevatedCard" :class="topMargin">
            <v-list
                v-if="smeObject[smeLocator] && Array.isArray(smeObject[smeLocator]) && smeObject[smeLocator].length > 0"
                nav
                class="bg-elevatedCard">
                <div v-for="(SubmodelElement, i) in smeObject[smeLocator]" :key="i">
                    <v-list-item class="pt-0">
                        <v-list-item-title class="pt-2">
                            <!-- SubmodelElementCollection -->
                            <v-alert
                                v-if="SubmodelElement.modelType == 'SubmodelElementCollection'"
                                :text="nameToDisplay(SubmodelElement)"
                                density="compact"
                                variant="outlined"
                                border="start">
                                <template #prepend>
                                    <v-chip label size="x-small" border color="primary">{{
                                        SubmodelElement.modelType
                                    }}</v-chip>
                                </template>
                                <template #append>
                                    <v-badge
                                        :content="SubmodelElement.value ? SubmodelElement.value.length : 0"
                                        inline></v-badge>
                                </template>
                            </v-alert>
                            <!-- SubmodelElementList -->
                            <v-alert
                                v-else-if="SubmodelElement.modelType == 'SubmodelElementList'"
                                :text="nameToDisplay(SubmodelElement)"
                                density="compact"
                                variant="outlined"
                                border="start">
                                <template #prepend>
                                    <v-chip label size="x-small" border color="primary">{{
                                        SubmodelElement.modelType
                                    }}</v-chip>
                                </template>
                                <template #append>
                                    <v-badge
                                        :content="SubmodelElement.value ? SubmodelElement.value.length : 0"
                                        inline></v-badge>
                                </template>
                            </v-alert>
                            <!-- Entity -->
                            <v-alert
                                v-else-if="SubmodelElement.modelType == 'Entity'"
                                :text="nameToDisplay(SubmodelElement)"
                                density="compact"
                                variant="outlined"
                                border="start">
                                <template #prepend>
                                    <v-chip label size="x-small" border color="primary">{{
                                        SubmodelElement.modelType
                                    }}</v-chip>
                                </template>
                                <template #append>
                                    <v-badge
                                        :content="SubmodelElement.statements ? SubmodelElement.statements.length : 0"
                                        inline></v-badge>
                                </template>
                            </v-alert>
                            <!-- Property -->
                            <v-text-field
                                v-else-if="SubmodelElement.modelType == 'Property'"
                                v-model="SubmodelElement.value"
                                :label="nameToDisplay(SubmodelElement)"
                                density="compact"
                                variant="outlined"
                                readonly
                                hide-details>
                                <!-- Current Value -->
                                <template #prepend-inner>
                                    <v-chip label size="x-small" border color="primary">{{
                                        SubmodelElement.valueType
                                    }}</v-chip>
                                </template>
                                <template #append-inner>
                                    <span class="text-subtitleText">{{ unitSuffix(SubmodelElement) }}</span>
                                </template>
                            </v-text-field>
                            <!-- MultiLanguageProperty -->
                            <DescriptionElement
                                v-else-if="SubmodelElement.modelType == 'MultiLanguageProperty'"
                                :description-array="SubmodelElement.value"
                                :description-title="nameToDisplay(SubmodelElement)"
                                :small="false"
                                style="margin-top: -12px"></DescriptionElement>
                            <!-- Operation -->
                            <v-alert
                                v-else-if="SubmodelElement.modelType == 'Operation'"
                                :text="nameToDisplay(SubmodelElement)"
                                density="compact"
                                variant="tonal"
                                border="start">
                                <template #prepend>
                                    <v-chip label size="x-small" border color="primary">{{
                                        SubmodelElement.modelType
                                    }}</v-chip>
                                </template>
                                <template #append>
                                    <v-icon style="margin-right: 5px">mdi-lightning-bolt-circle</v-icon>
                                </template>
                            </v-alert>
                            <!-- File -->
                            <v-text-field
                                v-else-if="SubmodelElement.modelType == 'File'"
                                v-model="SubmodelElement.value"
                                :label="nameToDisplay(SubmodelElement)"
                                density="compact"
                                variant="outlined"
                                readonly
                                hide-details>
                                <template #prepend-inner>
                                    <v-chip label size="x-small" border color="primary">{{
                                        SubmodelElement.modelType
                                    }}</v-chip>
                                </template>
                            </v-text-field>
                            <!-- Blob -->
                            <v-text-field
                                v-else-if="SubmodelElement.modelType == 'Blob'"
                                v-model="SubmodelElement.value"
                                :label="nameToDisplay(SubmodelElement)"
                                density="compact"
                                variant="outlined"
                                readonly
                                hide-details>
                                <template #prepend-inner>
                                    <v-chip label size="x-small" border color="primary">{{
                                        SubmodelElement.modelType
                                    }}</v-chip>
                                </template>
                            </v-text-field>
                            <!-- ReferenceElement -->
                            <div v-else-if="SubmodelElement.modelType == 'ReferenceElement'">
                                <v-list-item style="margin-top: -12px">
                                    <!-- Reference idShort -->
                                    <template #title>
                                        <div class="text-subtitle-2">{{ nameToDisplay(SubmodelElement) }}</div>
                                    </template>
                                </v-list-item>
                                <v-chip label size="x-small" border class="mr-2">{{
                                    referenceKeyTypeToDisplay(SubmodelElement.value?.keys)
                                }}</v-chip>
                                <span>{{ referenceKeyValueToDisplay(SubmodelElement.value?.keys) }}</span>
                            </div>
                            <!-- Range -->
                            <div v-else-if="SubmodelElement.modelType == 'Range'">
                                <v-list-item style="margin-top: -12px">
                                    <!-- Range idShort -->
                                    <template #title>
                                        <div class="text-subtitle-2">{{ nameToDisplay(SubmodelElement) }}</div>
                                    </template>
                                </v-list-item>
                                <v-row>
                                    <v-col>
                                        <v-text-field
                                            v-model="SubmodelElement.min"
                                            label="min"
                                            density="compact"
                                            variant="outlined"
                                            readonly
                                            hide-details></v-text-field>
                                    </v-col>
                                    <v-col>
                                        <v-text-field
                                            v-model="SubmodelElement.max"
                                            label="max"
                                            density="compact"
                                            variant="outlined"
                                            readonly
                                            hide-details></v-text-field>
                                    </v-col>
                                </v-row>
                            </div>
                            <!-- RelationshipElement -->
                            <div v-else-if="SubmodelElement.modelType == 'RelationshipElement'">
                                <v-list-item style="margin-top: -12px">
                                    <!-- Relationship idShort -->
                                    <template #title>
                                        <div class="text-subtitle-2">{{ nameToDisplay(SubmodelElement) }}</div>
                                    </template>
                                </v-list-item>
                                <div>
                                    <v-chip label size="x-small" border class="mr-2">{{ 'first' }}</v-chip>
                                    <v-chip label size="x-small" border class="mr-2">{{
                                        referenceKeyTypeToDisplay(SubmodelElement.first?.keys)
                                    }}</v-chip>
                                    <span>{{ referenceKeyValueToDisplay(SubmodelElement.first?.keys) }}</span>
                                </div>
                                <div class="mt-3">
                                    <v-chip label size="x-small" border class="mr-2">{{ 'second' }}</v-chip>
                                    <v-chip label size="x-small" border class="mr-2">{{
                                        referenceKeyTypeToDisplay(SubmodelElement.second?.keys)
                                    }}</v-chip>
                                    <span>{{ referenceKeyValueToDisplay(SubmodelElement.second?.keys) }}</span>
                                </div>
                            </div>
                            <!-- AnnotatedRelationshipElement -->
                            <div v-else-if="SubmodelElement.modelType == 'AnnotatedRelationshipElement'">
                                <v-list-item style="margin-top: -12px">
                                    <!-- Relationship idShort -->
                                    <template #title>
                                        <div class="text-subtitle-2">{{ nameToDisplay(SubmodelElement) }}</div>
                                    </template>
                                </v-list-item>
                                <div>
                                    <v-chip label size="x-small" border class="mr-2">{{ 'first' }}</v-chip>
                                    <v-chip label size="x-small" border class="mr-2">{{
                                        referenceKeyTypeToDisplay(SubmodelElement.first?.keys)
                                    }}</v-chip>
                                    <span>{{ referenceKeyValueToDisplay(SubmodelElement.first?.keys) }}</span>
                                </div>
                                <div class="mt-3">
                                    <v-chip label size="x-small" border class="mr-2">{{ 'second' }}</v-chip>
                                    <v-chip label size="x-small" border class="mr-2">{{
                                        referenceKeyTypeToDisplay(SubmodelElement.second?.keys)
                                    }}</v-chip>
                                    <span>{{ referenceKeyValueToDisplay(SubmodelElement.second?.keys) }}</span>
                                </div>
                                <div class="mt-3 ml-3">
                                    <span class="text-caption">{{ 'Annotations: ' }}</span>
                                    <v-chip size="x-small" border class="mr-2">{{
                                        SubmodelElement.annotations.length
                                    }}</v-chip>
                                </div>
                            </div>
                            <!-- InvalidElement -->
                            <v-alert
                                v-else
                                text="Invalid SubmodelElement!"
                                density="compact"
                                type="warning"
                                variant="outlined"></v-alert>
                        </v-list-item-title>
                    </v-list-item>
                    <v-divider v-if="i < smeObject[smeLocator].length - 1" class="mt-2 mb-1"></v-divider>
                </div>
            </v-list>
            <v-list v-else nav class="bg-elevatedCard pt-0">
                <v-list-item>
                    <v-list-item-title class="pt-2">
                        <v-alert
                            :text="smeObject.modelType + ' doesn\'t contain any SubmodelElements!'"
                            density="compact"
                            type="warning"
                            variant="outlined"></v-alert>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import DescriptionElement from '@/components/UIComponents/DescriptionElement.vue';
    import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'SubmodelElementGroup',
        components: {
            DescriptionElement,
        },
        props: ['smeObject', 'smeLocator', 'topMargin'],

        setup() {
            const aasStore = useAASStore();
            const { unitSuffix } = useConceptDescriptionHandling();
            const { nameToDisplay } = useReferableUtils();

            return {
                aasStore, // AASStore Object
                nameToDisplay,
                unitSuffix,
            };
        },

        computed: {
            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },
        },

        methods: {
            referenceKeyTypeToDisplay(keys: any): string {
                if (keys?.length > 0) {
                    return keys[keys.length - 1].type;
                }
                return '';
            },

            referenceKeyValueToDisplay(keys: any): string {
                if (keys?.length > 0) {
                    return keys[keys.length - 1].value;
                }
                return '';
            },
        },
    });
</script>
