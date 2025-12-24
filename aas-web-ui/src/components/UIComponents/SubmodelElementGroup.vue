<template>
    <v-container fluid class="pa-0">
        <v-card color="elevatedCard" :class="topMargin">
            <v-list
                v-if="
                    submodelElementData[smeLocator] &&
                    Array.isArray(submodelElementData[smeLocator]) &&
                    submodelElementData[smeLocator].length > 0
                "
                nav
                class="bg-elevatedCard">
                <div v-for="(SubmodelElement, i) in submodelElementData[smeLocator]" :key="i">
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
                            <template v-else-if="SubmodelElement.modelType == 'MultiLanguageProperty'">
                                <v-list-item class="mt-n2">
                                    <template #title>
                                        <div class="mt-1 text-subtitle-2">
                                            {{ nameToDisplay(SubmodelElement) + ':' }}
                                        </div>
                                    </template>
                                    <v-list-item-subtitle v-for="(value, i) in SubmodelElement.value" :key="i">
                                        <div class="pt-2">
                                            <v-chip label size="x-small" border class="mr-2">{{
                                                value.language ? value.language : 'no-lang'
                                            }}</v-chip>
                                            <span>{{ value.text }}</span>
                                        </div>
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </template>
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
                                :placeholder="formatBlobSize(SubmodelElement.value)"
                                :label="nameToDisplay(SubmodelElement)"
                                density="compact"
                                variant="outlined"
                                readonly
                                persistent-placeholder
                                hide-details>
                                <template #prepend-inner>
                                    <v-chip label size="x-small" border color="primary">{{
                                        SubmodelElement.modelType
                                    }}</v-chip>
                                </template>
                                <template v-if="SubmodelElement.contentType" #append-inner>
                                    <v-chip size="x-small" density="compact" color="grey-lighten-3">{{
                                        SubmodelElement.contentType
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
                    <v-divider v-if="(i as number) < smeObject[smeLocator].length - 1" class="mt-2 mb-1"></v-divider>
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

<script lang="ts" setup>
    import { onMounted, ref, watch } from 'vue';
    import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';

    // Composables
    const { setData } = useSMHandling();
    const { unitSuffix } = useConceptDescriptionHandling();
    const { nameToDisplay } = useReferableUtils();

    // Properties
    const props = defineProps({
        smeObject: {
            type: Object as any,
            default: {} as any,
        },
        smeLocator: {
            type: String,
            default: '',
        },
        topMargin: {
            type: String,
            default: '',
        },
    });

    // Data
    const submodelElementData = ref({} as any);

    // Watchers
    watch(
        () => props.smeObject,
        () => {
            initialize();
        }
    );

    onMounted(async () => {
        await initialize();
    });

    async function initialize(): Promise<void> {
        if (!props.smeObject || Object.keys(props.smeObject).length === 0) {
            return;
        }

        // First: set data (to view quickly the SMEs without units)
        submodelElementData.value = props.smeObject;

        // Second: fetch ConceptDescriptions to view the SMEs with units
        submodelElementData.value = await setData(props.smeObject, props.smeObject.path, true);
    }

    function referenceKeyTypeToDisplay(keys: any): string {
        if (keys?.length > 0) {
            return keys[keys.length - 1].type;
        }
        return '';
    }

    function referenceKeyValueToDisplay(keys: any): string {
        if (keys?.length > 0) {
            return keys[keys.length - 1].value;
        }
        return '';
    }

    function formatBlobSize(base64Value: string): string {
        if (!base64Value) return 'No content';

        try {
            // Calculate size based on base64 string
            // Base64 uses 4 characters to represent 3 bytes of data
            const padding = base64Value.endsWith('==') ? 2 : base64Value.endsWith('=') ? 1 : 0;
            const byteLength = (base64Value.length * 3) / 4 - padding;

            return formatFileSize(byteLength);
        } catch (error) {
            console.error('Error calculating blob size:', error);
            return 'Unknown size';
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
</script>
