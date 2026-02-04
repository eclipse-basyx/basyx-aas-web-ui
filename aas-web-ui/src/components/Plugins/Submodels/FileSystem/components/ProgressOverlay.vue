<template>
    <v-card class="pa-6" min-width="350">
        <v-card-title class="text-center">{{ title }}</v-card-title>
        <v-card-text>
            <div class="text-center mb-2">
                <span class="text-h5">{{ progress.current }}</span>
                <span class="text-body-1"> / {{ progress.total }}</span>
            </div>
            <v-progress-linear :model-value="percentComplete" color="primary" height="20" rounded>
                <template #default>
                    <strong>{{ Math.round(percentComplete) }}%</strong>
                </template>
            </v-progress-linear>
            <div class="text-caption text-center mt-2 text-truncate" :title="itemName">
                {{ itemName }}
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import type { MoveProgress, UploadProgress } from '../types';
    import { computed } from 'vue';

    interface Props {
        title: string;
        progress: UploadProgress | MoveProgress;
    }

    const props = defineProps<Props>();

    const percentComplete = computed(() => {
        if (props.progress.total === 0) return 0;
        return (props.progress.current / props.progress.total) * 100;
    });

    const itemName = computed(() => {
        if ('fileName' in props.progress) {
            return props.progress.fileName;
        }
        return props.progress.itemName;
    });
</script>
