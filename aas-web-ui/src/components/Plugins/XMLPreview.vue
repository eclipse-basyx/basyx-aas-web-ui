<template>
  <v-container class="pa-0" fluid>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-xml</v-icon>
        XML Preview
        <v-spacer />
        <!-- Search input -->
        <v-text-field
          v-if="xmlContent"
          v-model="searchQuery"
          class="mx-2"
          clearable
          density="compact"
          hide-details
          placeholder="Search in XML"
          prepend-inner-icon="mdi-magnify"
          style="max-width: 200px"
          @update:model-value="searchInXml"
        />
        <!-- Line wrap toggle -->
        <v-btn
          v-if="xmlContent"
          icon
          :title="wordWrapEnabled ? 'Disable word wrap' : 'Enable word wrap'"
          variant="text"
          @click="toggleWordWrap"
        >
          <v-icon>{{ wordWrapEnabled ? 'mdi-wrap-disabled' : 'mdi-wrap' }}</v-icon>
        </v-btn>
        <!-- Line numbers toggle -->
        <v-btn
          v-if="xmlContent"
          icon
          :title="showLineNumbers ? 'Hide line numbers' : 'Show line numbers'"
          variant="text"
          @click="showLineNumbers = !showLineNumbers"
        >
          <v-icon>mdi-format-list-numbered</v-icon>
        </v-btn>
        <!-- Download button -->
        <v-btn
          v-if="xmlContent"
          icon
          title="Download XML"
          variant="text"
          @click="downloadXml"
        >
          <v-icon>mdi-download</v-icon>
        </v-btn>
        <!-- Copy button -->
        <v-btn
          v-if="xmlContent"
          icon
          title="Copy to clipboard"
          variant="text"
          @click="copyToClipboard"
        >
          <v-icon>{{ hasCopied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />
      <!-- Search results indicator -->
      <v-card-subtitle v-if="searchResults.length > 0" class="d-flex align-center">
        <span>{{ searchResults.length }} results found</span>
        <v-spacer />

        <v-btn-group density="comfortable" variant="outlined">
          <v-btn
            :disabled="currentSearchIndex <= 0"
            size="small"
            title="Previous result"
            @click="navigateSearchResult(-1)"
          >
            <v-icon>mdi-chevron-up</v-icon>
          </v-btn>

          <v-btn
            :disabled="currentSearchIndex >= searchResults.length - 1"
            size="small"
            title="Next result"
            @click="navigateSearchResult(1)"
          >
            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </v-btn-group>

        <span class="ml-2">{{ currentSearchIndex + 1 }} of {{ searchResults.length }}</span>
      </v-card-subtitle>

      <v-card-text>
        <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 200px">
          <v-progress-circular color="primary" indeterminate />
        </div>

        <div v-else-if="error" class="error-message pa-4 text-center">
          <v-icon class="mb-2" color="error" size="28">mdi-alert-circle</v-icon>
          <div>{{ error }}</div>
        </div>

        <div v-else-if="!xmlContent" class="no-content pa-4 text-center">No XML content available</div>

        <div v-else class="xml-container" :class="{ 'word-wrap-enabled': wordWrapEnabled }">
          <!-- Line numbers column -->
          <div v-if="showLineNumbers" ref="lineNumbersContainer" class="line-numbers">
            <div
              v-for="n in lineCount"
              :key="n"
              :class="{ 'highlighted-line': highlightedLineNumbers.includes(n) }"
            >
              {{ n }}
            </div>
          </div>
          <!-- XML content with highlighting -->
          <pre
            ref="xmlContainer"
            class="xml-content"
            :class="{ 'with-line-numbers': showLineNumbers }"
            @scroll="syncScroll"
          >
                        <code ref="codeElement" class="language-xml" v-html="formattedXml" />
                    </pre>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import Prism from 'prismjs'
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import 'prismjs/themes/prism.css'

  const props = defineProps({
    submodelElementData: {
      type: Object as () => any,
      default: () => ({}),
    },
  })

  const xmlContent = ref<string>('')
  const formattedXml = ref<string>('')
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const hasCopied = ref<boolean>(false)
  const xmlContainer = ref<HTMLElement | null>(null)
  const codeElement = ref<HTMLElement | null>(null)
  const wordWrapEnabled = ref<boolean>(true)
  const showLineNumbers = ref<boolean>(true)
  const searchQuery = ref<string>('')
  const searchResults = ref<number[]>([])
  const currentSearchIndex = ref<number>(0)
  const highlightedLineNumbers = ref<number[]>([])
  const lineNumbersContainer = ref<HTMLElement | null>(null)

  // Computed properties
  const lineCount = computed(() => {
    if (!formattedXml.value) return 0
    return formattedXml.value.split('\n').length
  })

  // Composables
  const { fetchAttachmentFile } = useSMRepositoryClient()

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.Prism = window.Prism || Prism
    }

    initialize()
  })

  // Watchers
  watch(
    () => props.submodelElementData,
    () => {
      initialize()
    },
  )

  // Apply highlighting whenever xmlContent changes
  watch(xmlContent, () => {
    highlightXml()
  })

  // Reset search when XML content changes
  watch(xmlContent, () => {
    searchQuery.value = ''
    searchResults.value = []
    highlightedLineNumbers.value = []
  })

  // Watch for search query changes
  watch(searchQuery, () => {
    if (searchQuery.value === '') {
      searchResults.value = []
      highlightedLineNumbers.value = []
    } else {
      searchInXml()
    }
  })

  function toggleWordWrap (): void {
    wordWrapEnabled.value = !wordWrapEnabled.value
  }

  function searchInXml (): void {
    searchResults.value = []
    highlightedLineNumbers.value = []
    currentSearchIndex.value = 0

    if (!searchQuery.value || !xmlContent.value) return

    const lines = xmlContent.value.split('\n')
    const query = searchQuery.value.toLowerCase()

    for (const [index, line] of lines.entries()) {
      if (line.toLowerCase().includes(query)) {
        searchResults.value.push(index + 1)
      }
    }

    if (searchResults.value.length > 0) {
      highlightedLineNumbers.value = [searchResults.value[0]]
      scrollToLine(searchResults.value[0])
    }
  }

  function navigateSearchResult (direction: number): void {
    if (searchResults.value.length === 0) return

    currentSearchIndex.value += direction

    if (currentSearchIndex.value < 0) {
      currentSearchIndex.value = 0
    } else if (currentSearchIndex.value >= searchResults.value.length) {
      currentSearchIndex.value = searchResults.value.length - 1
    }

    const lineNumber = searchResults.value[currentSearchIndex.value]
    highlightedLineNumbers.value = [lineNumber]
    scrollToLine(lineNumber)
  }

  function scrollToLine (lineNumber: number): void {
    nextTick(() => {
      if (!xmlContainer.value) return

      const lineHeight = 21
      const containerTop = xmlContainer.value.getBoundingClientRect().top
      const scrollTo = (lineNumber - 1) * lineHeight

      xmlContainer.value.scrollTop = scrollTo - containerTop - 100
    })
  }

  function formatXML (xml: string): string {
    try {
      if (!xml || typeof xml !== 'string') {
        return ''
      }

      const trimmedXml = xml.trim()

      if (!trimmedXml) {
        return ''
      }

      const hasXmlDeclaration = trimmedXml.startsWith('<?xml')

      let formatted = ''
      let indent = ''

      const xmlNodes = trimmedXml.split(/>\s*</)
      for (const [index, node] of xmlNodes.entries()) {
        if (index === 0 && node.includes('?xml') && !hasXmlDeclaration) {
          continue
        }

        if (/^\/\w/.test(node)) {
          indent = indent.slice(2)
        }

        formatted += index === 0 ? '<' + node + '>\n' : indent + '<' + node + '>\n'

        if (/^<?\w[^>]*[^/]$/.test(node) && !node.startsWith('?')) {
          indent += '  '
        }
      }

      return formatted.slice(1, -2)
    } catch (error_) {
      console.error('Error formatting XML:', error_)
      return xml
    }
  }

  function highlightXml (): void {
    if (!xmlContent.value) {
      formattedXml.value = ''
      return
    }

    try {
      const formatted = formatXML(xmlContent.value)

      // Apply syntax highlighting using Prism
      if (Prism && Prism.highlight) {
        formattedXml.value = Prism.highlight(formatted, Prism.languages.markup || {}, 'markup').trimStart()
      } else {
        formattedXml.value = formatted
        console.warn('Prism highlighting not available')
      }
    } catch (error_) {
      console.error('Error highlighting XML:', error_)
      formattedXml.value = xmlContent.value || ''
    }
  }

  async function copyToClipboard (): Promise<void> {
    if (xmlContent.value) {
      try {
        await navigator.clipboard.writeText(xmlContent.value)
        hasCopied.value = true
        setTimeout(() => {
          hasCopied.value = false
        }, 2000)
      } catch (error_) {
        console.error('Failed to copy XML to clipboard', error_)
      }
    }
  }

  function downloadXml (): void {
    if (xmlContent.value) {
      const blob = new Blob([xmlContent.value], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${props.submodelElementData.idShort || 'download'}.xml`
      document.body.append(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  }

  async function initialize (): Promise<void> {
    if (!props.submodelElementData || !props.submodelElementData.path) {
      xmlContent.value = ''
      error.value = 'No file path provided'
      return
    }

    loading.value = true
    error.value = null
    xmlContent.value = ''

    try {
      const fileBlob = await fetchAttachmentFile(props.submodelElementData.path)

      if (!fileBlob) {
        error.value = 'Failed to load XML file'
        return
      }

      // Convert blob to text
      if (fileBlob instanceof Blob) {
        // Read the blob as text
        const text = await fileBlob.text()
        xmlContent.value = text
      } else {
        console.error('Expected a Blob, but received:', fileBlob)
      }

      highlightXml()
    } catch (error_) {
      console.error('Error loading XML file:', error_)
      error.value = `Error loading XML file: ${error_ instanceof Error ? error_.message : 'Unknown error'}`
    } finally {
      loading.value = false
    }
  }

  function syncScroll (): void {
    if (showLineNumbers.value && lineNumbersContainer.value && xmlContainer.value) {
      lineNumbersContainer.value.scrollTop = xmlContainer.value.scrollTop
    }
  }
</script>

<style scoped>
    .xml-container {
        max-height: 600px;
        height: 600px;
        border-radius: 4px;
        background-color: #f5f5f5;
        display: flex;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
    }

    .line-numbers {
        padding: 16px 8px 16px 8px;
        text-align: right;
        background-color: #e0e0e0;
        border-right: 1px solid #ccc;
        color: #666;
        user-select: none;
        min-width: 40px;
        font-size: 14px;
        line-height: 1.5;
        overflow-x: hidden;
        overflow-y: hidden;
        max-height: 600px;
        height: 100%;
        box-sizing: border-box;
    }

    .line-numbers > div {
        height: 21px;
        line-height: 21px;
        padding: 0;
        margin: 0;
    }

    .highlighted-line {
        background-color: rgba(255, 213, 79, 0.3);
        font-weight: bold;
    }

    :deep(.token) {
        line-height: 21px;
    }

    :deep(code) {
        line-height: 21px;
    }

    .xml-content {
        margin: 0;
        padding: 0px 16px 0px 16px;
        white-space: pre;
        word-wrap: normal;
        font-size: 14px;
        line-height: 21px;
        flex-grow: 1;
        overflow: auto;
        height: 100%;
        max-height: 600px;
        box-sizing: border-box;
    }

    .word-wrap-enabled .xml-content {
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .xml-content code {
        display: block;
        height: 100%;
        box-sizing: border-box;
        margin-top: -6px;
        padding: 0;
        line-height: inherit;
    }

    .error-message {
        color: #f44336;
    }

    :deep(.token.tag) {
        color: #905;
    }

    :deep(.token.attr-name) {
        color: #690;
    }

    :deep(.token.attr-value) {
        color: #07a;
    }

    :deep(.token.string) {
        color: #07a;
    }

    :deep(.token.comment) {
        color: #999;
    }
</style>
