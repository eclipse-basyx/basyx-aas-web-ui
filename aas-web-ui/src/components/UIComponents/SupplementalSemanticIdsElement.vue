<template>
    <v-container fluid class="pa-0">
        <v-list-item
            v-if="
                supplementalSemanticIds && Array.isArray(supplementalSemanticIds) && supplementalSemanticIds.length > 0
            ">
            <template #title>
                <div class="text-subtitle-2 mt-2">
                    {{
                        supplementalSemanticIdsTitle === ''
                            ? supplementalSemanticIds.length === 1
                                ? 'Supplemental Semantic ID'
                                : 'Supplemental Semantic IDs'
                            : supplementalSemanticIdsTitle
                    }}
                </div>
            </template>
            <!-- SupplementalSemanticIds List -->
            <template v-for="(semanticId, i) in supplementalSemanticIds" :key="i">
                <v-container fluid class="pa-0 my-n2">
                    <SemanticIdElement
                        v-if="
                            semanticId &&
                            semanticId.keys &&
                            Array.isArray(semanticId.keys) &&
                            semanticId.keys.length > 0
                        "
                        :semantic-id-object="semanticId"
                        :small="false" />
                </v-container>
                <v-divider v-if="i < supplementalSemanticIds.length - 1" class="mt-2 mb-0"></v-divider>
            </template>
        </v-list-item>
    </v-container>
</template>

<script lang="ts" setup>
    // Properties
    defineProps({
        supplementalSemanticIds: {
            type: Object as any,
            default: {} as any,
        },
        supplementalSemanticIdsTitle: {
            type: String,
            default: '',
        },
        small: {
            type: Boolean,
            default: false,
        },
    });
</script>
