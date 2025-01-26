<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="displayNames && Array.isArray(displayNames) && displayNames.length > 0">
            <!-- Tooltip with DisplayName -->
            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                <div v-for="(displayName, i) in displayNames" :key="i" class="text-caption">
                    <span class="font-weight-bold">{{ displayName.language + ': ' }}</span
                    >{{ displayName.text }}
                </div>
            </v-tooltip>
            <!-- DisplayName Title -->
            <template #title>
                <div class="mt-1" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{
                        displayNamesTitle === ''
                            ? displayNames.length === 1
                                ? 'Display Name'
                                : 'Display Names'
                            : displayNamesTitle
                    }}
                </div>
            </template>
            <!-- DisplayNames List (different Languages) -->
            <v-list-item-subtitle v-for="(displayName, i) in displayNames" :key="i">
                <div class="pt-2">
                    <v-chip label size="x-small" border class="mr-2">{{
                        displayName.language ? displayName.language : 'no-lang'
                    }}</v-chip>
                    <span>{{ displayName.text }}</span>
                </div>
            </v-list-item-subtitle>
        </v-list-item>
    </v-container>
</template>

<script lang="ts" setup>
    // Properties
    defineProps({
        displayNames: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        displayNamesTitle: {
            type: String,
            default: '',
        },
        small: {
            type: Boolean,
            default: false,
        },
    });
</script>
