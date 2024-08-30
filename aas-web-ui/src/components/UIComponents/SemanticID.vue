<template>
    <v-container fluid class="pa-0">
        <v-list-item>
            <!-- Tooltip with SemanticId -->
            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                <div v-for="(semanticId, i) in semanticIdObject.keys" :key="i" class="text-caption">
                    <span class="font-weight-bold">{{ '(' + semanticId.type + ') ' }}</span
                    >{{ semanticId.value }}
                </div>
            </v-tooltip>
            <!-- SemanticIId Title -->
            <template #title>
                <div class="text-subtitle-2 mt-2" v-html="semanticTitle + ':'"></div>
            </template>
            <!-- SemanticId List -->
            <v-list-item-subtitle v-for="(semanticId, i) in semanticIdObject.keys" :key="i">
                <div class="pt-2">
                    <v-chip label size="x-small" border class="mr-2">{{ semanticId.type }}</v-chip>
                    <span v-html="semanticId.value"></span>
                </div>
            </v-list-item-subtitle>
        </v-list-item>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'SemanticID',
        props: ['semanticIdObject', 'semanticTitle'],
    });
</script>
