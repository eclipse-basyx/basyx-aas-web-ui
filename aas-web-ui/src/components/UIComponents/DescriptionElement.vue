<template>
    <v-container fluid class="pa-0">
        <v-list-item>
            <!-- Tooltip with Description -->
            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                <div v-for="(description, i) in descriptionObject" :key="i" class="text-caption">
                    <span class="font-weight-bold">{{ description.language + ': ' }}</span
                    >{{ description.text }}
                </div>
            </v-tooltip>
            <!-- Description Title -->
            <template #title>
                <div
                    class="mt-2"
                    :class="small ? 'text-caption' : 'text-subtitle-2 '"
                    v-html="descriptionTitle + ':'"></div>
            </template>
            <!-- Descriptions List (different Languages) -->
            <v-list-item-subtitle v-for="(description, i) in descriptionObject" :key="i">
                <div class="pt-2">
                    <v-chip label size="x-small" border class="mr-2">{{
                        description.language ? description.language : 'no-lang'
                    }}</v-chip>
                    <span v-html="description.text"></span>
                </div>
            </v-list-item-subtitle>
        </v-list-item>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'DescriptionElement',
        props: ['descriptionObject', 'descriptionTitle', 'small'],
    });
</script>
