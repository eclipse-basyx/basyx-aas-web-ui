<template>
    <v-container fluid class="pa-0">
        <v-expansion-panel elevation="0" tile static :class="'bg-' + backgroundColor">
            <v-expansion-panel-title class="px-2 py-0">
                <!-- Tooltip with DisplayName -->
                <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-for="(displayNameObject, i) in displayNameArray" :key="i" class="text-caption">
                        <span class="font-weight-bold">{{ displayNameObject.language + ': ' }}</span
                        >{{ displayNameObject.text }}
                    </div>
                </v-tooltip>
                <span :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ displayNameTitle }}
                </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-0" :class="'bg-' + backgroundColor">
                <v-list nav class="pa-0" :class="'bg-' + backgroundColor">
                    <v-list-item>
                        <!-- DisplayNames (different Languages) -->
                        <v-list-item-subtitle v-for="(displayNameObject, i) in displayNameArray" :key="i">
                            <div :class="i === 0 ? '' : 'pt-2'">
                                <v-chip label size="x-small" border class="mr-2">{{
                                    displayNameObject.language ? displayNameObject.language : 'no-lang'
                                }}</v-chip>
                                <span>{{ displayNameObject.text }}</span>
                            </div>
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-container>
</template>

<script lang="ts" setup>
    // Props
    defineProps({
        displayNameArray: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        displayNameTitle: {
            type: String,
            default: 'Display Name',
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
