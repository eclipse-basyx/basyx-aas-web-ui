<template>
    <v-container fluid class="pa-0">
        <v-list-item :class="semanticTitle && semanticTitle.trim().length > 0 && !small ? '' : 'pa-0'">
            <!-- Tooltip with SemanticId -->
            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                <div v-for="(semanticId, i) in semanticIdObject.keys" :key="i" class="text-caption">
                    <span class="font-weight-bold">{{ '(' + semanticId.type + ') ' }}</span
                    >{{ semanticId.value }}
                </div>
            </v-tooltip>
            <!-- SemanticIId Title -->
            <template v-if="semanticTitle && semanticTitle.trim().length > 0" #title>
                <div class="mt-2" :class="small ? 'text-caption' : 'text-subtitle-2 '">{{ semanticTitle + ':' }}</div>
            </template>
            <!-- SemanticId List -->
            <v-list-item-subtitle v-for="(semanticId, i) in semanticIdObject.keys" :key="i">
                <div :class="semanticTitle && semanticTitle.trim().length > 0 && !small ? 'pt-2' : 'pt-1'">
                    <v-chip label size="x-small" border class="mr-2">{{ semanticId.type }}</v-chip>
                    <span>{{ semanticId.value }}</span>
                </div>
            </v-list-item-subtitle>
        </v-list-item>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'SemanticID',
        props: ['semanticIdObject', 'semanticTitle', 'small'],
    });
</script>
