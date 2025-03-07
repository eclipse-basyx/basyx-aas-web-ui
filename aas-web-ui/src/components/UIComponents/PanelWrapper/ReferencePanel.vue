<template>
    <v-container
        v-if="
            referenceObject &&
            Object.keys(referenceObject).length > 0 &&
            referenceObject.keys &&
            Array.isArray(referenceObject.keys) &&
            referenceObject.keys.length > 0
        "
        fluid
        class="pa-0">
        <v-expansion-panels v-model="panel">
            <v-expansion-panel elevation="0" tile static :class="'bg-' + backgroundColor">
                <v-expansion-panel-title class="px-2">
                    <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                        <div v-for="(key, i) in referenceObject.keys" :key="i" class="text-caption">
                            <span class="font-weight-bold">
                                {{ '(' + key.type + ') ' }}
                            </span>
                            {{ key.value }}
                        </div>
                    </v-tooltip>
                    <span class="text-subtitle-2">
                        {{ title }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <Reference
                        :reference-object="referenceObject"
                        :title="title"
                        :background-color="backgroundColor"
                        :show-title="false" />
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script setup lang="ts">
    import { onMounted, ref } from 'vue';

    // Props
    const props = defineProps({
        referenceObject: {
            type: Object as any,
            default: {} as any,
        },
        title: {
            type: String,
            default: 'Semantic ID',
        },
        backgroundColor: {
            type: String,
            default: '',
        },
        opened: {
            type: Boolean,
            default: false,
        },
    });

    // Data
    const panel = ref();

    onMounted(() => {
        if (props.opened) panel.value = 0;
    });
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding: 0px !important;
        margin: 0px !important;
    }
</style>
