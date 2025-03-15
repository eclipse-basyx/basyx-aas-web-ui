<template>
    <v-container
        v-if="langStringsArray && Array.isArray(langStringsArray) && langStringsArray.length > 0"
        fluid
        class="pa-0">
        <v-expansion-panels v-model="panel">
            <v-expansion-panel elevation="0" tile static :color="backgroundColor">
                <v-expansion-panel-title class="px-2">
                    <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                        <div v-for="(langString, i) in langStringsArray" :key="i" class="text-caption">
                            <span class="font-weight-bold">
                                {{ langString.language + ': ' }}
                            </span>
                            {{ langString.text }}
                        </div>
                    </v-tooltip>
                    <span class="text-subtitle-2">
                        {{ title }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <LangStrings
                        :lang-strings-array="langStringsArray"
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
        langStringsArray: {
            type: Object as any,
            default: {} as any,
        },
        title: {
            type: String,
            default: 'Display Name',
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
