<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="descriptionArray && Array.isArray(descriptionArray) && descriptionArray.length > 0">
            <!-- Tooltip with Description -->
            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                <div v-for="(description, i) in descriptionArray" :key="i" class="text-caption">
                    <span class="font-weight-bold">{{ description.language + ': ' }}</span
                    >{{ description.text }}
                </div>
            </v-tooltip>
            <!-- Description Title -->
            <template #title>
                <div class="mt-1" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ descriptionTitle + ':' }}
                </div>
            </template>
            <!-- Descriptions List (different Languages) -->
            <v-list-item-subtitle v-for="(description, i) in descriptionArray" :key="i">
                <div class="pt-2">
                    <v-chip label size="x-small" border class="mr-2">{{
                        description.language ? description.language : 'no-lang'
                    }}</v-chip>
                    <span>{{ description.text }}</span>
                </div>
            </v-list-item-subtitle>
        </v-list-item>
    </v-container>
</template>

<script setup lang="ts">
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
        small: {
            type: Boolean,
            default: false,
        },
    });
</script>
