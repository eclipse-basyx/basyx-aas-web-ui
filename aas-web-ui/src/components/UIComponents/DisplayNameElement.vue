<template>
    <v-container fluid class="pa-0">
        <v-list-item>
            <!-- Tooltip with DisplayName -->
            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                <div v-for="(displayName, i) in displayNameObject" :key="i" class="text-caption">
                    <span class="font-weight-bold">{{ displayName.language + ': ' }}</span
                    >{{ displayName.text }}
                </div>
            </v-tooltip>
            <!-- DisplayName Title -->
            <template #title>
                <div class="mt-1" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ displayNameTitle + ':' }}
                </div>
            </template>
            <!-- DisplayNames List (different Languages) -->
            <v-list-item-subtitle v-for="(displayName, i) in displayNameObject" :key="i">
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

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'DisplayNameElement',
        props: ['displayNameObject', 'displayNameTitle', 'small'],
    });
</script>
