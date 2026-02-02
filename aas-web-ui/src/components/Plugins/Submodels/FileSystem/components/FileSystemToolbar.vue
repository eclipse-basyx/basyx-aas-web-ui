<template>
    <v-toolbar color="cardHeader">
        <v-toolbar-title>{{ selectedView === 0 ? 'Gallery' : 'File Explorer' }}</v-toolbar-title>
        <v-spacer></v-spacer>

        <!-- Switch between list and grid view -->
        <v-btn-toggle
            v-model="internalSelectedView"
            border
            density="compact"
            divided
            rounded="lg"
            class="mr-3"
            mandatory>
            <v-btn icon="mdi-view-grid" class="px-5"></v-btn>
            <v-btn icon="mdi-view-list" class="px-5"></v-btn>
        </v-btn-toggle>

        <!-- New File/Folder Menu -->
        <v-menu>
            <template #activator="{ props: menuProps }">
                <v-btn
                    prepend-icon="mdi-plus"
                    text="New"
                    variant="flat"
                    color="primary"
                    class="mr-3 text-buttonText"
                    rounded="lg"
                    v-bind="menuProps" />
            </template>
            <v-list>
                <v-list-item @click="handleOpenUploadDialog">
                    <v-list-item-title>
                        <v-icon>mdi-file</v-icon>
                        File
                    </v-list-item-title>
                </v-list-item>
                <v-list-item @click="handleCreateFolder">
                    <v-list-item-title>
                        <v-icon>mdi-folder</v-icon>
                        Folder
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </v-toolbar>
</template>

<script setup lang="ts">
    import { computed } from 'vue';

    interface Props {
        selectedView: number;
    }

    const props = defineProps<Props>();

    const emit = defineEmits<{
        (e: 'update:selected-view', value: number): void;
        (e: 'open-upload-dialog'): void;
        (e: 'create-folder'): void;
    }>();

    const handleOpenUploadDialog = (): void => emit('open-upload-dialog');
    const handleCreateFolder = (): void => emit('create-folder');

    const internalSelectedView = computed({
        get: () => props.selectedView,
        set: (value: number) => emit('update:selected-view', value),
    });
</script>
