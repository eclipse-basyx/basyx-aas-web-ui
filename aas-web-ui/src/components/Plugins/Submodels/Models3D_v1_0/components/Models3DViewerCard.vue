<template>
  <v-sheet border class="models3d-viewer position-relative overflow-hidden" rounded>
    <!-- Interactive 3D view -->
    <CADPreview
      v-if="showModel"
      :key="version?.key"
      ref="cadPreview"
      fill
      :submodel-element-data="version?.digitalFile"
      @error="viewerFailed = true"
    />

    <!-- Preview image / fallback -->
    <div v-else class="d-flex flex-column align-center justify-center h-100 w-100">
      <div class="flex-grow-1 w-100 overflow-hidden">
        <Models3DPreviewImage
          :alt="title"
          contain
          :file="version?.previewFile ?? null"
          icon-size="64"
        />
      </div>

      <v-btn
        v-if="!version?.digitalFile && externalUrl"
        class="mb-4"
        color="primary"
        :href="externalUrl"
        prepend-icon="mdi-open-in-new"
        rel="noopener noreferrer"
        target="_blank"
        variant="tonal"
      >
        Open external file
      </v-btn>
    </div>

    <v-chip
      v-if="viewerFailed"
      class="position-absolute bottom-0 left-0 ma-2"
      color="warning"
      label
      prepend-icon="mdi-alert-outline"
      size="x-small"
      variant="tonal"
    >
      3D preview unavailable
    </v-chip>

    <!-- Toolbar -->
    <div class="position-absolute top-0 right-0 ma-2 d-flex ga-1">
      <v-btn
        v-if="showModel"
        aria-label="Reset view"
        density="comfortable"
        icon
        size="small"
        variant="tonal"
        @click="cadPreview?.resetView()"
      >
        <v-icon>mdi-fit-to-screen-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">Reset view</v-tooltip>
      </v-btn>

      <v-btn
        v-if="canToggle"
        :aria-label="showImage ? 'Show 3D model' : 'Show preview image'"
        density="comfortable"
        icon
        size="small"
        variant="tonal"
        @click="showImage = !showImage"
      >
        <v-icon>{{ showImage ? 'mdi-rotate-3d-variant' : 'mdi-image-outline' }}</v-icon>

        <v-tooltip activator="parent" location="bottom">
          {{ showImage ? 'Show 3D model' : 'Show preview image' }}
        </v-tooltip>
      </v-btn>

      <v-btn
        v-if="version?.digitalFile"
        aria-label="Download 3D model"
        density="comfortable"
        icon
        size="small"
        variant="tonal"
        @click="downloadFile(version.digitalFile)"
      >
        <v-icon>mdi-download</v-icon>
        <v-tooltip activator="parent" location="bottom">Download 3D model</v-tooltip>
      </v-btn>
    </div>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type { Model3DVersion } from '../types'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'

  // Props
  const props = defineProps<{
    version: Model3DVersion | undefined
    title: string
  }>()

  // Template refs
  const cadPreview = ref<{ resetView: () => void } | null>(null)

  // Composables
  const { downloadFile } = useSMEFile()

  // Reactive data
  const showImage = ref(false)
  const viewerFailed = ref(false)

  // Computed properties
  const canToggle = computed(() => !!props.version?.digitalFile && !!props.version?.previewFile)
  const showModel = computed(() => !!props.version?.digitalFile && !showImage.value && !viewerFailed.value)
  const externalUrl = computed(() => props.version?.externalFiles[0]?.url ?? '')

  // Watchers
  watch(
    () => props.version?.key,
    () => {
      showImage.value = false
      viewerFailed.value = false
    },
  )
</script>

<style scoped>
  .models3d-viewer {
    aspect-ratio: 4 / 3;
    min-height: 260px;
    max-height: min(60svh, 560px);
    width: 100%;
  }
</style>
