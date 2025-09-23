<template>
    <div class="mb-2">
        <div class="d-flex align-center mb-1">
            <span class="text-body-2 mr-1">{{ label }}</span>
            <v-tooltip location="top">
                <template #activator="{ props }">
                    <v-icon v-bind="props" size="16" color="primary" aria-label="Info">mdi-information</v-icon>
                </template>
                <span class="text-body-2">{{ tip }}</span>
            </v-tooltip>
        </div>
        <div>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
    defineProps<{
        label: string;
        tip: string;
    }>();
</script>
