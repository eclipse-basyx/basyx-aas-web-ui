<template>
  <v-card
    border
    class="mx-auto draggable-item"
    :class="{ 'selected-item': isSelected }"
    :draggable="true"
    flat
    rounded="lg"
    @dragend="handleDragEnd"
    @dragstart="handleDragStart"
  >
    <v-toolbar class="cursor-pointer" color="transparent" density="compact" @click="handlePreview">
      <v-toolbar-title class="text-truncate text-subtitle-2 ml-2">{{ fullFileName }}</v-toolbar-title>
      <template #prepend>
        <v-checkbox-btn
          class="ml-1"
          density="compact"
          :model-value="isSelected"
          @click.stop
          @update:model-value="handleToggleSelection"
        />
      </template>
      <template #append>
        <v-btn icon size="x-small" variant="text">
          <v-icon icon="mdi-dots-vertical" />
          <v-menu activator="parent" :close-on-content-click="false" location="top end" origin="overlap">
            <v-sheet border>
              <v-list class="py-0" dense density="compact" slim>
                <v-list-item @click="handleDownload">
                  <template #prepend>
                    <v-icon size="x-small">mdi-download</v-icon>
                  </template>
                  <v-list-item-subtitle>Download File</v-list-item-subtitle>
                </v-list-item>
                <v-list-item @click="handleDelete">
                  <template #prepend>
                    <v-icon size="x-small">mdi-delete</v-icon>
                  </template>
                  <v-list-item-subtitle>Delete File</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-menu>
        </v-btn>
      </template>
    </v-toolbar>
    <v-card-item class="px-2 pb-2 pt-0 cursor-pointer" @click="handlePreview">
      <v-card border class="media-card" flat rounded="lg">
        <v-img v-if="contentTypeCategory === 'image'" block cover :src="fileUrl">
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular color="grey-lighten-4" indeterminate />
            </div>
          </template>
        </v-img>
        <video
          v-else-if="contentTypeCategory === 'video'"
          class="video-element"
          controls
          :src="fileUrl"
        />
        <v-icon
          v-else-if="file.contentType === 'application/pdf'"
          color="red"
          size="x-large"
        >mdi-file-pdf-box</v-icon>
        <v-icon v-else color="grey" size="x-large">mdi-file</v-icon>
      </v-card>
    </v-card-item>
  </v-card>
</template>

<script setup lang="ts">
  import type { ContentTypeCategory, FileElement } from '../types'
  import { computed } from 'vue'
  import { checkContentType, mimeToExtension } from '@/utils/FileHandling'

  interface Props {
    file: FileElement
    fileUrl?: string
    isSelected: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    fileUrl: '',
  })

  const emit = defineEmits<{
    'preview': []
    'download': []
    'delete': []
    'toggle-selection': []
    'change-startscreen': [state: boolean]
    'dragstart': [event: DragEvent]
    'dragend': []
  }>()

  const handlePreview = (): void => emit('preview')
  const handleDownload = (): void => emit('download')
  const handleDelete = (): void => emit('delete')
  const handleToggleSelection = (): void => emit('toggle-selection')
  const handleDragStart = (event: DragEvent): void => emit('dragstart', event)
  const handleDragEnd = (): void => emit('dragend')

  const fullFileName = computed(() => {
    const extension = mimeToExtension(props.file.contentType)
    return `${props.file.idShort}.${extension}`
  })

  const contentTypeCategory = computed((): ContentTypeCategory => {
    return checkContentType(props.file.contentType) as ContentTypeCategory
  })
</script>

<style scoped>
    .draggable-item {
        width: 100%;
        cursor: pointer;
    }

    .draggable-item:not(.selected-item):hover {
        background-color: rgba(var(--v-theme-on-surface), 0.08);
    }

    .draggable-item:active {
        opacity: 0.5;
    }

    .media-card {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding-bottom: 56.25%;
        /* 16:9 aspect ratio */
        height: 0;
        overflow: hidden;
    }

    .media-card > * {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .video-element {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* Selected state */
    .selected-item {
        background-color: rgba(var(--v-theme-primary), 0.15);
        outline: 2px solid rgb(var(--v-theme-primary));
        outline-offset: -2px;
    }

    .selected-item:hover {
        background-color: rgba(var(--v-theme-primary), 0.2);
    }
</style>
