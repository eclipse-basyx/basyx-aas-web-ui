<template>
    <v-container fluid class="pa-0">
        <v-expansion-panels
            v-if="qualifierArray && Array.isArray(qualifierArray) && qualifierArray.length > 0"
            class="mb-n2">
            <v-expansion-panel elevation="0" tile static>
                <v-expansion-panel-title class="px-2">
                    <span :class="small ? 'text-caption' : 'text-subtitle-2 '">
                        {{ qualifierTitle }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="mx-2 mb-2">
                    <v-divider class="mb-1" opacity="0.05"></v-divider>
                    <v-list>
                        <v-list-item
                            v-for="(qualifier, index) in qualifierArray"
                            :key="index"
                            class="bg-elevatedCard mt-2"
                            rounded>
                            <!-- Qualifier SemanticId -->
                            <v-list-item-subtitle
                                v-if="
                                    qualifier.semanticId &&
                                    qualifier.semanticId.keys &&
                                    qualifier.semanticId.keys.length > 0
                                "
                                class="pt-1">
                                <span class="text-caption">
                                    {{ 'Semantic Id: ' }}
                                </span>
                            </v-list-item-subtitle>
                            <SemanticID
                                v-if="
                                    qualifier.semanticId &&
                                    qualifier.semanticId.keys &&
                                    qualifier.semanticId.keys.length > 0
                                "
                                :semantic-id-object="qualifier.semanticId"
                                :semantic-title="''"
                                :small="true"
                                class="mt-n4 mb-n2 ml-2" />
                            <v-divider
                                v-if="
                                    qualifier.semanticId &&
                                    qualifier.semanticId.keys &&
                                    qualifier.semanticId.keys.length > 0
                                "
                                class="mt-2 mb-3"></v-divider>
                            <!-- Qualifier Type -->
                            <v-list-item-subtitle v-if="qualifier.type && !isEmptyString(qualifier.type)" class="pt-1">
                                <span class="text-caption">
                                    {{ 'Type: ' }}
                                </span>
                                <v-chip label size="x-small" border color="primary">
                                    {{ qualifier.type }}
                                </v-chip>
                            </v-list-item-subtitle>
                            <!-- Qualifier Value Type -->
                            <v-list-item-subtitle
                                v-if="qualifier.valueType && !isEmptyString(qualifier.valueType)"
                                class="pt-1">
                                <span class="text-caption">
                                    {{ 'Value Type: ' }}
                                </span>
                                <v-chip label size="x-small" border color="primary">
                                    {{ qualifier.valueType }}
                                </v-chip>
                            </v-list-item-subtitle>
                            <!-- Qualifier Value -->
                            <v-list-item-subtitle class="pt-4 pb-3">
                                <v-text-field
                                    :model-value="qualifier.value"
                                    readonly
                                    label="value"
                                    variant="outlined"
                                    density="compact"
                                    hide-details></v-text-field>
                            </v-list-item-subtitle>
                            <template #append>
                                <!-- Qualifier Kind -->
                                <v-chip
                                    v-if="qualifier.kind && !isEmptyString(qualifier.kind)"
                                    class="ml-3"
                                    size="x-small"
                                    color="primary">
                                    {{ qualifier.kind }}
                                </v-chip>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script setup lang="ts">
    import { isEmptyString } from '@/utils/StringUtils';

    // Props
    defineProps({
        qualifierArray: {
            type: Object as any,
            default: {} as any,
        },
        qualifierTitle: {
            type: String,
            default: 'Qualifiers',
        },
        small: {
            type: Boolean,
            default: false,
        },
    });
</script>
