<template>
    <v-container fluid class="pa-0">
        <v-expansion-panels class="mb-n2">
            <v-expansion-panel elevation="0" tile static :color="backgroundColor">
                <v-expansion-panel-title class="px-2">
                    <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                        <div v-for="(displayName, i) in displayNameArray" :key="i" class="text-caption">
                            <span class="font-weight-bold">{{ displayName.language + ': ' }}</span
                            >{{ displayName.text }}
                        </div>
                    </v-tooltip>
                    <span :class="small ? 'text-caption' : 'text-subtitle-2 '">
                        {{ displayNameTitle }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text :class="'bg-' + backgroundColor">
                    <v-list nav class="pa-0">
                        <v-list-item
                            v-if="displayNameArray && Array.isArray(displayNameArray) && displayNameArray.length > 0"
                            class="py-0">
                            <!-- DisplayNames List (different Languages) -->
                            <v-list-item-subtitle v-for="(displayName, i) in displayNameArray" :key="i">
                                <div>
                                    <v-chip label size="x-small" border class="mr-2">{{
                                        displayName.language ? displayName.language : 'no-lang'
                                    }}</v-chip>
                                    <span>{{ displayName.text }}</span>
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
    // Props
    defineProps({
        displayNameArray: {
            type: Object as any,
            default: {} as any,
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
        padding: 0px !important;
        margin: 0px !important;
    }
</style>
