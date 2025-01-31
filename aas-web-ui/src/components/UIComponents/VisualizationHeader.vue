<template>
    <!-- Header -->
    <v-card class="mb-4">
        <v-card-title>
            <div class="text-subtitle-1">
                {{ nameToDisplay(submodelElementData, 'en', defaultTitle) }}
            </div>
        </v-card-title>
        <v-card-text v-if="descriptionToDisplay(submodelElementData)" class="pt-0">
            {{ descriptionToDisplay(submodelElementData) }}
        </v-card-text>
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
