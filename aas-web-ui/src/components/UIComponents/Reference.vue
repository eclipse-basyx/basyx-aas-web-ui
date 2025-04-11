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
        <v-list nav class="pa-0" :class="'bg-' + backgroundColor">
            <v-list-item :class="small ? 'py-0' : 'py-2'">
                <v-tooltip v-if="showTitle" activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-for="(key, i) in referenceObject.keys" :key="i" class="text-caption">
                        <span class="font-weight-bold">{{ '(' + key.type + ') ' }}</span
                        >{{ key.value }}
                    </div>
                </v-tooltip>
                <!-- SemanticIId Title -->
                <template v-if="showTitle" #title>
                    <div class="mt-1 text-subtitle-2 pb-2">
                        {{ title + ':' }}
                    </div>
                </template>
                <v-list-item-subtitle v-for="(key, i) in referenceObject.keys" :key="i">
                    <div :class="i > 0 ? 'pt-2' : ''">
                        <v-chip label size="x-small" border class="mr-2">
                            {{ key.type }}
                        </v-chip>
                        <span>{{ key.value }}</span>
                    </div>
                </v-list-item-subtitle></v-list-item
            >
        </v-list>
    </v-container>
</template>

<script setup lang="ts">
    // Props
    defineProps({
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
        showTitle: {
            type: Boolean,
            default: true,
        },
        small: {
            type: Boolean,
            default: false,
        },
    });
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding: 0px !important;
        margin: 0px !important;
    }
</style>
