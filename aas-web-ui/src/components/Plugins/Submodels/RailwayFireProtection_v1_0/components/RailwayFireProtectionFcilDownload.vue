<template>
  <div class="d-flex align-center ga-1">
    <v-tooltip location="bottom" open-delay="600">
      <template #activator="{ props: tooltipProps }">
        <v-btn
          v-bind="tooltipProps"
          :disabled="data.requirementsSets.length === 0"
          :loading="isGenerating"
          prepend-icon="mdi-microsoft-excel"
          size="small"
          variant="tonal"
          @click="download"
        >
          Download FCIL
        </v-btn>
      </template>

      <span>Fire Certificate Inventory List (UNIFE TGFS.06) with these requirement sets, as Excel file</span>
    </v-tooltip>

    <v-tooltip v-if="hasTemplate" location="bottom" open-delay="600">
      <template #activator="{ props: tooltipProps }">
        <v-btn
          v-bind="tooltipProps"
          aria-label="Choose another FCIL template"
          :disabled="data.requirementsSets.length === 0"
          icon="mdi-file-replace-outline"
          size="small"
          variant="text"
          @click="openDialog('')"
        />
      </template>

      <span>Choose another FCIL template</span>
    </v-tooltip>

    <RailwayFireProtectionFcilTemplateDialog
      v-model="dialogOpen"
      :error="dialogError"
      :loading="isGenerating"
      @select="useSelectedTemplate"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { RailwayFireProtectionData } from '../types'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { downloadFile } from '@/utils/generalUtils'
  import { loadFcilTemplate, saveFcilTemplate } from '../utils/templateStorage'

  defineOptions({
    name: 'RailwayFireProtectionFcilDownload',
  })

  // Props
  const props = defineProps<{
    data: RailwayFireProtectionData
  }>()

  // Stores
  const navigationStore = useNavigationStore()

  // Reactive data
  const isGenerating = ref(false)
  const hasTemplate = ref(false)
  const dialogOpen = ref(false)
  const dialogError = ref('')

  // Lifecycle hooks
  onMounted(async () => {
    hasTemplate.value = (await loadFcilTemplate()) !== null
  })

  // Methods
  /** Exports with the remembered template; asks for one if there is none or it cannot be used */
  async function download (): Promise<void> {
    isGenerating.value = true
    try {
      const template = await loadFcilTemplate()
      hasTemplate.value = template !== null
      if (template) {
        await exportFcil(template)
      } else {
        openDialog('')
      }
    } catch (error) {
      openDialog(errorMessage(error))
    } finally {
      isGenerating.value = false
    }
  }

  async function useSelectedTemplate (file: File): Promise<void> {
    isGenerating.value = true
    dialogError.value = ''
    try {
      const template = new Uint8Array(await file.arrayBuffer())
      // Exporting first also checks the file, so that only a usable template is remembered
      await exportFcil(template)
      dialogOpen.value = false
      if (await saveFcilTemplate(template)) {
        hasTemplate.value = true
      } else {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 5000,
          color: 'warning',
          btnColor: 'buttonText',
          text: 'The FCIL template could not be remembered in this browser; it will be asked for again.',
        })
      }
    } catch (error) {
      dialogError.value = errorMessage(error)
    } finally {
      isGenerating.value = false
    }
  }

  async function exportFcil (template: Uint8Array): Promise<void> {
    // Loaded on demand: the XLSX code is only needed for the download
    const { fcilFileName, fillFcilTemplate } = await import('../utils/fcilExport')
    const workbook = fillFcilTemplate(template, props.data)
    downloadFile(
      fcilFileName(props.data),
      new Blob([workbook as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    )
  }

  function openDialog (error: string): void {
    dialogError.value = error
    dialogOpen.value = true
  }

  function errorMessage (error: unknown): string {
    return `The FCIL could not be created: ${error instanceof Error ? error.message : String(error)}`
  }
</script>
