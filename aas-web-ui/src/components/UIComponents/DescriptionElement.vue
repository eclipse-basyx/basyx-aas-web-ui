<template>
    <v-container
        v-if="descriptionArray && Array.isArray(descriptionArray) && descriptionArray.length > 0"
        fluid
        class="pa-0">
        <v-expansion-panels v-model="openPanels" class="mb-n2">
            <v-expansion-panel elevation="0" tile static :class="'bg-' + backgroundColor">
                <v-expansion-panel-title class="px-2">
                    <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                        <div v-for="(description, i) in descriptionArray" :key="i" class="text-caption">
                            <span class="font-weight-bold">
                                {{ description.language + ': ' }}
                            </span>
                            {{ description.text }}
                        </div>
                    </v-tooltip>
                    <span class="text-subtitle-2">
                        {{ descriptionTitle }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-list nav class="pa-0" :class="'bg-' + backgroundColor">
                        <v-list-item class="py-0">
                            <v-list-item-subtitle v-for="(description, i) in descriptionArray" :key="i">
                                <div>
                                    <v-chip label size="x-small" border class="mr-2">
                                        {{ description.language ? description.language : 'no-lang' }}
                                    </v-chip>
                                    <span>{{ description.text }}</span>
                                </div>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script setup lang="ts">
    import { ref } from 'vue';

    // Props
    defineProps({
        descriptionArray: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        descriptionTitle: {
            type: String,
            default: 'Description',
        },
        backgroundColor: {
            type: String,
            default: '',
        },
    });

    // Data
    const openPanels = ref<number[]>([0]);
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding: 0px !important;
        margin: 0px !important;
    }
</style>
