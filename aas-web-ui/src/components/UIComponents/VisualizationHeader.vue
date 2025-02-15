<template>
    <!-- Header -->
    <v-card class="mb-4">
        <v-card-title class="text-subtitle-1">{{
            nameToDisplay(submodelElementData, 'en', defaultTitle)
        }}</v-card-title>
        <v-card-subtitle v-if="descriptionToDisplay(submodelElementData)" class="mb-2 text-caption">
            {{ descriptionToDisplay(submodelElementData) }}
        </v-card-subtitle>
    </v-card>
</template>

<script lang="ts" setup>
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    // Composables
    const { descriptionToDisplay, nameToDisplay } = useReferableUtils();

    defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
        defaultTitle: {
            type: String,
            default: '',
        },
    });
</script>
