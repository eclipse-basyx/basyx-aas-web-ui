<template>
    <v-container
        v-if="
            supplementalSemanticIdsArray &&
            Array.isArray(supplementalSemanticIdsArray) &&
            supplementalSemanticIdsArray.length > 0
        "
        fluid
        class="pa-0">
        <v-expansion-panel elevation="0" tile static>
            <v-expansion-panel-title class="px-2 py-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                <span v-if="supplementalSemanticIdsTitle" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ supplementalSemanticIdsTitle }}
                </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                <v-list nav class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                    <!-- <v-list-item :class="supplementalSemanticIdsArray.length === 1 ? 'my-0' : 'py-2'"> -->
                    <v-list-item class="py-0">
                        <template v-for="(supplementalSemanticId, i) in supplementalSemanticIdsArray" :key="i">
                            <!-- Supplemental Semantic IDs -->
                            <v-divider v-if="i > 0" />
                            <SemanticIdElement
                                :semantic-id-object="supplementalSemanticId"
                                :semantic-id-title="
                                    supplementalSemanticIdsArray.length > 1 ? i + 1 + '. Supplemental Semantic ID' : ''
                                "
                                :with-expansion-panel="false"
                                :small="true" />
                        </template>
                    </v-list-item>
                </v-list>
            </v-expansion-panel-text>
        </v-expansion-panel>
        <!-- <v-list-item
            :class="supplemental-semantic-ids-title && supplementalSemanticIdsTitle.trim().length > 0 ? '' : 'pa-0'">
            <template
                v-for="(supplementalSemanticId, supplementalSemanticIdIndex) in supplementalSemanticIdsArray"
                :key="supplementalSemanticIdIndex">
                <v-container fluid class="pa-0 my-n2">
                    <SemanticIdElement
                        v-if="
                            supplementalSemanticId &&
                            supplementalSemanticId.keys &&
                            supplementalSemanticId.keys.length > 0
                        "
                        :semantic-id-object="supplementalSemanticId"
                        :small="false"></SemanticIdElement>
                </v-container>
                <v-divider
                    v-if="supplementalSemanticIdIndex < supplementalSemanticIdsArray.length - 1"
                    class="mt-2 mb-0"></v-divider>
            </template>
        </v-list-item> -->
    </v-container>
</template>

<script lang="ts" setup>
    // Props
    defineProps({
        supplementalSemanticIdsArray: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        supplementalSemanticIdsTitle: {
            type: String,
            default: 'Supplemental Semantic IDs',
        },
        small: {
            type: Boolean,
            default: false,
        },
        backgroundColor: {
            type: String,
            default: '',
        },
    });
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding-left: 0px !important;
        padding-right: 0px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
    }
</style>
