<template>
    <v-container fluid class="pa-0">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-code-json</v-icon>
                JSON Preview
                <v-spacer></v-spacer>
                <!-- Search input -->
                <v-text-field
                    v-if="jsonContent"
                    v-model="searchQuery"
                    placeholder="Search in JSON"
                    density="compact"
                    hide-details
                    class="mx-2"
                    style="max-width: 200px"
                    prepend-inner-icon="mdi-magnify"
                    clearable
                    @update:model-value="searchInJson"></v-text-field>
                <!-- Line wrap toggle -->
                <v-btn
                    v-if="jsonContent"
                    icon
                    variant="text"
                    :title="wordWrapEnabled ? 'Disable word wrap' : 'Enable word wrap'"
                    @click="toggleWordWrap">
                    <v-icon>{{ wordWrapEnabled ? 'mdi-wrap-disabled' : 'mdi-wrap' }}</v-icon>
                </v-btn>
                <!-- Line numbers toggle -->
                <v-btn
                    v-if="jsonContent"
                    icon
                    variant="text"
                    :title="showLineNumbers ? 'Hide line numbers' : 'Show line numbers'"
                    @click="showLineNumbers = !showLineNumbers">
                    <v-icon>mdi-format-list-numbered</v-icon>
                </v-btn>
                <!-- Download button -->
                <v-btn v-if="jsonContent" icon variant="text" title="Download JSON" @click="downloadJson">
                    <v-icon>mdi-download</v-icon>
                </v-btn>
                <!-- Copy button -->
                <v-btn v-if="jsonContent" icon variant="text" title="Copy to clipboard" @click="copyToClipboard">
                    <v-icon>{{ hasCopied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <!-- Search results indicator -->
            <v-card-subtitle v-if="searchResults.length > 0" class="d-flex align-center">
                <span>{{ searchResults.length }} results found</span>
                <v-spacer></v-spacer>
                <v-btn-group density="comfortable" variant="outlined">
                    <v-btn
                        size="small"
                        :disabled="currentSearchIndex <= 0"
                        title="Previous result"
                        @click="navigateSearchResult(-1)">
                        <v-icon>mdi-chevron-up</v-icon>
                    </v-btn>
                    <v-btn
                        size="small"
                        :disabled="currentSearchIndex >= searchResults.length - 1"
                        title="Next result"
                        @click="navigateSearchResult(1)">
                        <v-icon>mdi-chevron-down</v-icon>
                    </v-btn>
                </v-btn-group>
                <span class="ml-2">{{ currentSearchIndex + 1 }} of {{ searchResults.length }}</span>
            </v-card-subtitle>
            <v-card-text>
                <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 200px">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
                <div v-else-if="error" class="error-message pa-4 text-center">
                    <v-icon color="error" size="large" class="mb-2">mdi-alert-circle</v-icon>
                    <div>{{ error }}</div>
                </div>
                <div v-else-if="!jsonContent" class="no-content pa-4 text-center">No JSON content available</div>
                <div v-else class="json-container" :class="{ 'word-wrap-enabled': wordWrapEnabled }">
                    <!-- Line numbers column -->
                    <div v-if="showLineNumbers" ref="lineNumbersContainer" class="line-numbers">
                        <div
                            v-for="n in lineCount"
                            :key="n"
                            :class="{ 'highlighted-line': highlightedLineNumbers.includes(n) }">
                            {{ n }}
                        </div>
                    </div>
                    <!-- JSON content with highlighting -->
                    <pre
                        ref="jsonContainer"
                        class="json-content"
                        :class="{ 'with-line-numbers': showLineNumbers }"
                        @scroll="syncScroll">
                        <code ref="codeElement" class="language-json" v-html="formattedJson"></code>
                    </pre>
                </div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    /* eslint-disable simple-import-sort/imports */
    import Prism from 'prismjs';
    import 'prismjs/themes/prism.css';
    import 'prismjs/components/prism-json';
    /* eslint-enable simple-import-sort/imports */
    import { computed, nextTick, onMounted, ref, watch } from 'vue';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';

    const props = defineProps({
        submodelElementData: {
            type: Object as () => any,
            default: () => ({}),
        },
    });

    const jsonContent = ref<string>('');
    const formattedJson = ref<string>('');
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const hasCopied = ref<boolean>(false);
    const jsonContainer = ref<HTMLElement | null>(null);
    const codeElement = ref<HTMLElement | null>(null);
    const wordWrapEnabled = ref<boolean>(true);
    const showLineNumbers = ref<boolean>(true);
    const searchQuery = ref<string>('');
    const searchResults = ref<number[]>([]);
    const currentSearchIndex = ref<number>(0);
    const highlightedLineNumbers = ref<number[]>([]);
    const lineNumbersContainer = ref<HTMLElement | null>(null);

    // Computed properties
    const lineCount = computed(() => {
        if (!formattedJson.value) return 0;
        return formattedJson.value.split('\n').length;
    });

    // Composables
    const { fetchAttachmentFile } = useSMRepositoryClient();

    onMounted(() => {
        if (typeof window !== 'undefined') {
            window.Prism = window.Prism || Prism;
        }

        initialize();
    });

    // Watchers
    watch(
        () => props.submodelElementData,
        () => {
            initialize();
        }
    );

    // Apply highlighting whenever jsonContent changes
    watch(jsonContent, () => {
        highlightJson();
    });

    // Reset search when JSON content changes
    watch(jsonContent, () => {
        searchQuery.value = '';
        searchResults.value = [];
        highlightedLineNumbers.value = [];
    });

    // Watch for search query changes
    watch(searchQuery, () => {
        if (searchQuery.value === '') {
            searchResults.value = [];
            highlightedLineNumbers.value = [];
        } else {
            searchInJson();
        }
    });

    function toggleWordWrap(): void {
        wordWrapEnabled.value = !wordWrapEnabled.value;
    }

    function searchInJson(): void {
        searchResults.value = [];
        highlightedLineNumbers.value = [];
        currentSearchIndex.value = 0;

        if (!searchQuery.value || !jsonContent.value) return;

        const lines = jsonContent.value.split('\n');
        const query = searchQuery.value.toLowerCase();

        lines.forEach((line: string, index: number) => {
            if (line.toLowerCase().includes(query)) {
                searchResults.value.push(index + 1);
            }
        });

        if (searchResults.value.length > 0) {
            highlightedLineNumbers.value = [searchResults.value[0]];
            scrollToLine(searchResults.value[0]);
        }
    }

    function navigateSearchResult(direction: number): void {
        if (searchResults.value.length === 0) return;

        currentSearchIndex.value += direction;

        if (currentSearchIndex.value < 0) {
            currentSearchIndex.value = 0;
        } else if (currentSearchIndex.value >= searchResults.value.length) {
            currentSearchIndex.value = searchResults.value.length - 1;
        }

        const lineNumber = searchResults.value[currentSearchIndex.value];
        highlightedLineNumbers.value = [lineNumber];
        scrollToLine(lineNumber);
    }

    function scrollToLine(lineNumber: number): void {
        nextTick(() => {
            if (!jsonContainer.value) return;

            const lineHeight = 21;
            const containerTop = jsonContainer.value.getBoundingClientRect().top;
            const scrollTo = (lineNumber - 1) * lineHeight;

            jsonContainer.value.scrollTop = scrollTo - containerTop - 100;
        });
    }

    function formatJSON(json: string): string {
        try {
            // Check if input is valid
            if (!json || typeof json !== 'string') {
                return '';
            }

            const trimmedJson = json.trim();
            if (!trimmedJson) {
                return '';
            }

            try {
                const obj = JSON.parse(trimmedJson);
                return JSON.stringify(obj, null, 2);
            } catch (parseError) {
                console.warn('JSON parsing warning:', parseError);
                return trimmedJson;
            }
        } catch (e) {
            console.error('Error formatting JSON:', e);
            return json;
        }
    }

    function highlightJson(): void {
        if (!jsonContent.value) {
            formattedJson.value = '';
            return;
        }

        try {
            const formatted = formatJSON(jsonContent.value);

            // Apply syntax highlighting using Prism
            if (Prism && Prism.highlight) {
                formattedJson.value = Prism.highlight(formatted, Prism.languages.json || {}, 'json');
            } else {
                formattedJson.value = formatted;
                console.warn('Prism highlighting not available');
            }
        } catch (e) {
            console.error('Error highlighting JSON:', e);
            formattedJson.value = jsonContent.value || '';
        }
    }

    async function copyToClipboard(): Promise<void> {
        if (jsonContent.value) {
            try {
                await navigator.clipboard.writeText(jsonContent.value);
                hasCopied.value = true;
                setTimeout(() => {
                    hasCopied.value = false;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy JSON to clipboard', err);
            }
        }
    }

    function downloadJson(): void {
        if (jsonContent.value) {
            const blob = new Blob([jsonContent.value], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${props.submodelElementData.idShort || 'download'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    async function initialize(): Promise<void> {
        if (!props.submodelElementData || !props.submodelElementData.path) {
            jsonContent.value = '';
            error.value = 'No file path provided';
            return;
        }

        loading.value = true;
        error.value = null;
        jsonContent.value = '';

        try {
            const fileBlob = await fetchAttachmentFile(props.submodelElementData.path);

            if (!fileBlob) {
                error.value = 'Failed to load JSON file';
                return;
            }

            if (fileBlob instanceof Blob) {
                const text = await fileBlob.text();
                jsonContent.value = text;
            } else {
                jsonContent.value = JSON.stringify(fileBlob, null, 2);
            }

            highlightJson();
        } catch (e) {
            console.error('Error loading JSON file:', e);
            error.value = `Error loading JSON file: ${e instanceof Error ? e.message : 'Unknown error'}`;
        } finally {
            loading.value = false;
        }
    }

    function syncScroll(): void {
        if (showLineNumbers.value && lineNumbersContainer.value && jsonContainer.value) {
            lineNumbersContainer.value.scrollTop = jsonContainer.value.scrollTop;
        }
    }
</script>

<style scoped>
    .json-container {
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

    .line-numbers div {
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

    .json-content {
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

    .word-wrap-enabled .json-content {
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .json-content code {
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

    :deep(.token.punctuation) {
        color: #999;
    }

    :deep(.token.property) {
        color: #905;
    }

    :deep(.token.string) {
        color: #690;
    }

    :deep(.token.number) {
        color: #07a;
    }

    :deep(.token.boolean) {
        color: #07a;
    }

    :deep(.token.null) {
        color: #999;
    }
</style>
