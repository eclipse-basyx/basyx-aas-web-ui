<template>
    <v-container fluid class="pa-0">
        <v-list-item
            v-if="
                supplementalSemanticIdsArray &&
                Array.isArray(supplementalSemanticIdsArray) &&
                supplementalSemanticIdsArray.length > 0
            "
            :class="supplementalSemanticIdsTitle && supplementalSemanticIdsTitle.trim().length > 0 ? '' : 'pa-0'">
            <!-- SupplementalSemanticIds Title -->
            <template v-if="supplementalSemanticIdsTitle && supplementalSemanticIdsTitle.trim().length > 0" #title>
                <div class="text-subtitle-2 mt-2">{{ supplementalSemanticIdsTitle + ':' }}</div>
            </template>
            <!-- SupplementalSemanticIds List -->
            <template
                v-for="(supplementalSemanticId, supplementalSemanticIdIndex) in supplementalSemanticIdsArray"
                :key="supplementalSemanticIdIndex">
                <v-container fluid class="pa-0 my-n2">
                    <SemanticID
                        v-if="
                            supplementalSemanticId &&
                            supplementalSemanticId.keys &&
                            supplementalSemanticId.keys.length > 0
                        "
                        :semantic-id-object="supplementalSemanticId"
                        :small="false"></SemanticID>
                </v-container>
                <v-divider
                    v-if="supplementalSemanticIdIndex < supplementalSemanticIdsArray.length - 1"
                    class="mt-2 mb-0"></v-divider>
            </template>
        </v-list-item>
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
    });
</script>
