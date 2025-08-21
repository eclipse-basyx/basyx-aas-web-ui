<template>
    <!-- Toggle between File and URL -->
    <v-btn-toggle v-model="toggle" color="primary" variant="outlined" divided density="compact" class="mb-3">
        <v-btn value="none">
            <span>None</span>
        </v-btn>
        <v-btn value="file">
            <span>File</span>
        </v-btn>
        <v-btn value="url">
            <span>URL</span>
        </v-btn>
    </v-btn-toggle>
    <!-- URL based File -->
    <v-list-item v-if="toggle === 'url'" class="px-0">
        <template #prepend>
            <v-combobox
                v-model="contentTypeValue"
                :items="contentTypeOptions"
                label="Content Type"
                variant="outlined"
                density="comfortable"
                placeholder="Select or enter Content Type"
                :width="200"
                class="mr-3 mt-2"></v-combobox>
        </template>
        <v-text-field
            v-model="pathValue"
            variant="outlined"
            density="comfortable"
            label="Path"
            class="mt-2"
            @update:model-value="errorLoadingImage = false"></v-text-field>
    </v-list-item>
    <!-- URL File Preview -->
    <v-sheet
        v-if="toggle === 'url' && pathValue && pathValue.length > 0 && contentTypeValue.includes('image')"
        border
        rounded>
        <v-img
            v-if="!errorLoadingImage"
            :src="filePreviewPath"
            max-width="100%"
            max-height="100%"
            contain
            rounded
            @error="errorLoadingImage = true"></v-img>
        <v-alert v-else text="No File preview available" density="compact" type="warning" variant="outlined"></v-alert>
    </v-sheet>
    <v-file-upload v-if="toggle === 'file'" v-model="file" clearable density="default"></v-file-upload>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';

    const props = defineProps<{
        path: string | null;
        contentType: string;
        newFile: boolean;
        smePath?: string;
    }>();

    const emit = defineEmits<{
        (event: 'update:path', value: string | null): void;
        (event: 'update:contentType', value: string): void;
        (event: 'update:file', value: File | undefined): void;
    }>();

    const pathValue = ref<string | null>(props.path);
    const contentTypeValue = ref<string>(props.contentType);
    const file = ref<File | undefined>(undefined);
    const toggle = ref<string>('none');
    const errorLoadingImage = ref<boolean>(false);
    const contentTypeOptions = ref<string[]>([
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'image/gif',
        'image/webp',
        'image/tiff',
        'image/bmp',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/heic',
        'image/heif',
        'application/json',
        'application/xml',
        'text/xml',
        'application/pdf',
    ]);

    watch(pathValue, (newValue) => {
        if (toggle.value === 'none') {
            emit('update:path', null);
            return;
        }
        emit('update:path', newValue);
    });

    watch(contentTypeValue, (newValue) => {
        if (newValue === null) {
            return;
        }
        emit('update:contentType', newValue);
    });

    watch(
        () => props.path,
        (newValue) => {
            pathValue.value = newValue;
        }
    );

    watch(
        () => props.contentType,
        (newValue) => {
            contentTypeValue.value = newValue;
        }
    );

    watch(
        () => toggle.value,
        (newValue) => {
            if (newValue === 'none') {
                pathValue.value = null;
                contentTypeValue.value = 'application/unknown';
                file.value = undefined;
                emit('update:file', undefined);
            } else if (newValue === 'url') {
                file.value = undefined;
                emit('update:file', undefined);
            } else if (newValue === 'file') {
                pathValue.value = null;
                emit('update:path', null);
            }
        }
    );

    watch(file, (newValue) => {
        if (newValue === null) {
            return;
        }
        emit('update:file', newValue);
    });

    onMounted(() => {
        if (!props.newFile && props.path && props.path.length > 0 && props.contentType !== 'application/unknown') {
            toggle.value = 'url';
        }
    });

    const filePreviewPath = computed(() => {
        if (pathValue.value === null || !contentTypeValue.value.includes('image')) {
            return '';
        }
        if (pathValue.value.startsWith('http')) {
            return pathValue.value;
        } else if (props.smePath) {
            // TODO: This does not work with active keycloak because there the file would have to be fetched with a token
            return props.smePath + '/attachment';
        } else {
            return '';
        }
    });
</script>
