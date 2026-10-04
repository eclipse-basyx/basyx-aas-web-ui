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

    <!-- The 3D view and its overlays are always dark, regardless of the theme -->
    <v-theme-provider theme="dark">
      <v-chip
        v-if="formatText"
        class="models3d-overlay position-absolute top-0 left-0 ma-2 text-white"
        label
        size="x-small"
        variant="text"
      >
        {{ formatText }}
      </v-chip>

      <v-chip
        v-if="viewerFailed"
        class="models3d-overlay position-absolute bottom-0 left-0 ma-2"
        color="warning"
        label
        prepend-icon="mdi-alert-outline"
        size="x-small"
        variant="text"
      >
        3D preview unavailable
      </v-chip>

      <v-btn-group
        class="models3d-overlay models3d-toolbar position-absolute top-0 right-0 ma-2 text-white"
        density="compact"
        rounded
        variant="text"
      >
        <v-btn
          v-if="showModel"
          aria-label="Reset view"
          icon
          size="small"
          @click="cadPreview?.resetView()"
        >
          <v-icon size="16">mdi-fit-to-screen-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Reset view</v-tooltip>
        </v-btn>

        <v-btn
          v-if="canToggle"
          :aria-label="showImage ? 'Show 3D model' : 'Show preview image'"
          icon
          size="small"
          @click="showImage = !showImage"
        >
          <v-icon size="16">{{ showImage ? 'mdi-rotate-3d-variant' : 'mdi-image-outline' }}</v-icon>

          <v-tooltip activator="parent" location="bottom">
            {{ showImage ? 'Show 3D model' : 'Show preview image' }}
          </v-tooltip>
        </v-btn>

        <v-btn
          v-if="version?.digitalFile"
          aria-label="Download 3D model"
          icon
          size="small"
          @click="downloadFile(version.digitalFile)"
        >
          <v-icon size="16">mdi-download</v-icon>
          <v-tooltip activator="parent" location="bottom">Download 3D model</v-tooltip>
        </v-btn>
      </v-btn-group>
    </v-theme-provider>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type { Model3DVersion } from '../types'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'
  import { formatLabel } from '../utils/presentation'

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
  const formatText = computed(() => {
    const qualifier = props.version?.format.qualifier.match(/\(([^)]+)\)/)?.[1] // "binary (.glb)" → ".glb"
    return [formatLabel(props.version), qualifier].filter(Boolean).join(' · ')
  })

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

  .models3d-overlay {
    background: rgb(0 0 0 / 55%);
    backdrop-filter: blur(4px);
  }
</style>
