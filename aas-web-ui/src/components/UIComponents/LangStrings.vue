<template>
    <v-container
        v-if="langStringsArray && Array.isArray(langStringsArray) && langStringsArray.length > 0"
        fluid
        class="pa-0">
        <v-list nav class="pa-0" :class="'bg-' + backgroundColor">
            <v-list-item class="py-2">
                <v-tooltip v-if="showTitle" activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-for="(langString, i) in langStringsArray" :key="i" class="text-caption">
                        <span class="font-weight-bold">{{ langString.language + ': ' }}</span
                        >{{ langString.text }}
                    </div>
                </v-tooltip>
                <!-- DisplayName Title -->
                <template v-if="showTitle" #title>
                    <div class="mt-1 text-subtitle-2 pb-2">
                        {{ title + ':' }}
                    </div>
                </template>
                <!-- Descriptions (different Languages) -->
                <v-list-item-subtitle v-for="(langString, i) in langStringsArray" :key="i">
                    <div :class="i > 0 ? 'pt-2' : ''">
                        <v-chip label size="x-small" border class="mr-2">
                            {{ langString.language ? langString.language : 'no-lang' }}
                        </v-chip>
                        <span>{{ langString.text }}</span>
                    </div>
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>
    </v-container>
</template>

<script setup lang="ts">
    // Props
    defineProps({
        langStringsArray: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        title: {
            type: String,
            default: 'Description',
        },
        backgroundColor: {
            type: String,
            default: '',
        },
        showTitle: {
            type: Boolean,
            default: true,
        },
    });
</script>
