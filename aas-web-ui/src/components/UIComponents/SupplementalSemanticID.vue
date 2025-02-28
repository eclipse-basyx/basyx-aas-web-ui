<template>
    <v-container
        v-if="
            supplementalSemanticIdsArray &&
            Array.isArray(supplementalSemanticIdsArray) &&
            supplementalSemanticIdsArray.length > 0
        "
        fluid
        class="pa-0">
        <v-expansion-panels class="mb-n2">
            <v-expansion-panel elevation="0" tile static :class="'bg-' + backgroundColor">
                <v-expansion-panel-title class="px-2">
                    <span class="text-subtitle-2">
                        {{ supplementalSemanticIdsTitle }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-list nav class="pa-0" :class="'bg-' + backgroundColor">
                        <v-list-item class="py-0">
                            <!-- SupplementalSemanticIds List -->
                            <template
                                v-for="(
                                    supplementalSemanticId, supplementalSemanticIdIndex
                                ) in supplementalSemanticIdsArray"
                                :key="supplementalSemanticIdIndex">
                                <SemanticID :semantic-id-object="supplementalSemanticId" />
                                <!-- <v-divider
                                    v-if="
                                        supplementalSemanticId &&
                                        Object.keys(supplementalSemanticId).length > 0 &&
                                        supplementalSemanticId.keys &&
                                        Array.isArray(supplementalSemanticId.keys) &&
                                        supplementalSemanticId.keys.length > 0 &&
                                        supplementalSemanticIdIndex < supplementalSemanticIdsArray.length - 1
                                    "
                                    class="mt-2 mb-0" /> -->
                            </template>
                        </v-list-item>
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script setup lang="ts">
    // Props
    defineProps({
        supplementalSemanticIdsArray: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        supplementalSemanticIdsTitle: {
            type: String,
            default: 'Description',
        },
        backgroundColor: {
            type: String,
            default: '',
        },
    });
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding: 0px !important;
        margin: 0px !important;
    }
</style>
