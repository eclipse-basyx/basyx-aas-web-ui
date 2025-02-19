<template>
    <v-container
        v-if="
            semanticIdObject &&
            Object.keys(semanticIdObject).length > 0 &&
            semanticIdObject.keys &&
            Array.isArray(semanticIdObject.keys) &&
            semanticIdObject.keys.length > 0
        "
        fluid
        class="pa-0">
        <v-expansion-panels class="mb-n2">
            <v-expansion-panel elevation="0" tile static :class="'bg-' + backgroundColor">
                <v-expansion-panel-title class="px-2">
                    <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                        <div v-for="(semanticId, i) in semanticIdObject.keys" :key="i" class="text-caption">
                            <span class="font-weight-bold">
                                {{ '(' + semanticId.type + ') ' }}
                            </span>
                            {{ semanticId.value }}
                        </div>
                    </v-tooltip>
                    <span class="text-subtitle-2">
                        {{ semanticTitle }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-list nav class="pa-0" :class="'bg-' + backgroundColor">
                        <v-list-item class="py-0">
                            <v-list-item-subtitle v-for="(semanticId, i) in semanticIdObject.keys" :key="i">
                                <div>
                                    <v-chip label size="x-small" border class="mr-2">
                                        {{ semanticId.type }}
                                    </v-chip>
                                    <span>{{ semanticId.value }}</span>
                                </div>
                            </v-list-item-subtitle></v-list-item
                        >
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script setup lang="ts">
    // Props
    defineProps({
        semanticIdObject: {
            type: Object as any,
            default: {} as any,
        },
        semanticTitle: {
            type: String,
            default: 'Semantic ID',
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
