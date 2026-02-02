<template>
    <div style="position: absolute; width: 100%; bottom: 0; z-index: 999; display: flex; justify-content: center">
        <v-card color="error" :width="300" class="mb-4 pa-0" flat>
            <v-card-text class="pa-0">
                <v-list-item>
                    <span class="font-weight-bold">Selected Objects: {{ selectedCount }}</span>
                    <template #append>
                        <v-btn icon="mdi-delete" variant="text" class="mr-3" @click="$emit('delete-selected')">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                </v-list-item>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        selectedCount: number;
    }

    defineProps<Props>();

    defineEmits<{
        (e: 'delete-selected'): void;
    }>();
</script>
