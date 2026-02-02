<template>
    <v-list-item border rounded="lg" class="pa-0 mb-2">
        <template #prepend>
            <v-btn
                :disabled="!canGoUp"
                icon="mdi-chevron-up"
                density="compact"
                class="ma-2"
                @click="$emit('go-up')"></v-btn>
            <v-divider vertical></v-divider>
        </template>
        <v-breadcrumbs divider="/" :items="breadcrumbs" class="ma-0 pa-0 ml-2"></v-breadcrumbs>
    </v-list-item>
</template>

<script setup lang="ts">
    import type { BreadcrumbItem } from '../types';

    interface Props {
        breadcrumbs: BreadcrumbItem[];
        canGoUp: boolean;
    }

    defineProps<Props>();

    defineEmits<{
        (e: 'go-up'): void;
    }>();
</script>
