import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'

interface CodePreviewSource {
  path?: string
  content?: unknown
}

export function useCodePreviewSource (source: () => CodePreviewSource, language: 'JSON' | 'XML') {
  const { fetchAttachmentFile } = useSMRepositoryClient()
  const text = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  watch(source, async (input, _previous, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })
    text.value = ''
    error.value = null
    loading.value = false

    try {
      if (input.content !== undefined && input.content !== null) {
        text.value = typeof input.content === 'string' ? input.content : JSON.stringify(input.content, null, 2)
        return
      }
      if (!input.path) {
        error.value = 'No file path provided'
        return
      }
      loading.value = true
      const file = await fetchAttachmentFile(input.path, 'blob')
      if (!active) {
        return
      }
      if (!file) {
        throw new Error(`Failed to load ${language} file`)
      }
      const content = file instanceof Blob ? await file.text() : JSON.stringify(file, null, 2)
      if (active) {
        text.value = content
      }
    } catch (error_) {
      if (active) {
        error.value = `Error loading ${language}: ${error_ instanceof Error ? error_.message : String(error_)}`
      }
    } finally {
      if (active) {
        loading.value = false
      }
    }
  }, { immediate: true, deep: true })

  return { text, loading, error }
}
