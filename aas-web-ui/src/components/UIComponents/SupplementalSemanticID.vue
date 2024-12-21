<template>
    <v-container fluid class="pa-0">
        <v-list-item
            :class="supplementalSemanticIdsTitle && supplementalSemanticIdsTitle.trim().length > 0 ? '' : 'pa-0'">
            <!-- SupplementalSemanticIds Title -->
            <template v-if="supplementalSemanticIdsTitle && supplementalSemanticIdsTitle.trim().length > 0" #title>
                <div class="text-subtitle-2 mt-2">{{ supplementalSemanticIdsTitle + ':' }}</div>
            </template>
            <!-- SupplementalSemanticIds List -->
            <template
                v-for="(supplementalSemanticId, supplementalSemanticIdIndex) in supplementalSemanticIdsArray"
                :key="supplementalSemanticIdIndex">
                <SemanticID
                    v-if="
                        supplementalSemanticId && supplementalSemanticId.keys && supplementalSemanticId.keys.length > 0
                    "
                    :semantic-id-object="supplementalSemanticId"></SemanticID>
                <v-divider
                    v-if="supplementalSemanticIdIndex < supplementalSemanticIdsArray.length - 1"
                    class="mt-2 mb-1"></v-divider>
            </template>
        </v-list-item>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'SupplementalSemanticID',
        props: ['supplementalSemanticIdsArray', 'supplementalSemanticIdsTitle'],
    });
</script>
