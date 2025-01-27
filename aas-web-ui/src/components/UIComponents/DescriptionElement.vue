<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="descriptions && Array.isArray(descriptions) && descriptions.length > 0">
            <!-- Tooltip with Description -->
            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                <div v-for="(description, i) in descriptions" :key="i" class="text-caption">
                    <span class="font-weight-bold">{{ description.language + ': ' }}</span>
                    {{ description.text }}
                </div>
            </v-tooltip>
            <!-- Description Title -->
            <template #title>
                <div class="mt-1" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{
                        descriptionsTitle === ''
                            ? descriptions.length === 1
                                ? 'Description'
                                : 'Descriptions'
                            : descriptionsTitle
                    }}
                </div>
            </template>
            <!-- Descriptions List (different Languages) -->
            <v-list-item-subtitle v-for="(description, i) in descriptions" :key="i">
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

<script lang="ts" setup>
    // Properties
    defineProps({
        descriptions: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        descriptionsTitle: {
            type: String,
            default: '',
        },
        small: {
            type: Boolean,
            default: false,
        },
    });
</script>
