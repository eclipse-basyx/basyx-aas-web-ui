<template>
    <v-container fluid class="pa-0">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-xml</v-icon>
                XML Preview
                <v-spacer></v-spacer>

                <v-text-field
                    v-if="xmlContent"
                    v-model="searchQuery"
                    placeholder="Search in XML"
                    density="compact"
                    hide-details
                    class="mx-2 "
                    style="max-width: 200px"
                    prepend-inner-icon="mdi-magnify"
                    clearable
                    @update:model-value="searchInXml" />

                <v-btn
                    v-if="xmlContent"
                    icon
                    variant="text"
                    :title="wordWrapEnabled ? 'Disable word wrap' : 'Enable word wrap'"
                    @click="toggleWordWrap">
                    <v-icon>{{ wordWrapEnabled ? 'mdi-wrap-disabled' : 'mdi-wrap' }}</v-icon>
                </v-btn>

                <v-btn
                    v-if="xmlContent"
                    icon
                    variant="text"
                    :title="showLineNumbers ? 'Hide line numbers' : 'Show line numbers'"
                    @click="showLineNumbers = !showLineNumbers">
                    <v-icon>mdi-format-list-numbered</v-icon>
                </v-btn>

                <v-btn v-if="xmlContent" icon variant="text" title="Download XML" @click="downloadXml">
                    <v-icon>mdi-download</v-icon>
                </v-btn>

                <v-btn v-if="xmlContent" icon variant="text" title="Copy to clipboard" @click="copyToClipboard">
                    <v-icon>{{ hasCopied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                </v-btn>
            </v-card-title>

            <v-divider></v-divider>

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

                <div v-else-if="!xmlContent" class="no-content pa-4 text-center">No XML content available</div>

                <div v-else class="xml-layout" :style="{ gridTemplateColumns: treePanelWidth + 'px minmax(0, 1fr)' }">
                    <div class="xml-tree-panel">
                        <div class="xml-panel-header">Table of Contents</div>

                        <div class="xml-tree-body light-scrollbar" :style="treeBodyStyle">
                            <v-treeview
                                v-model:opened="openedTreeNodes"
                                v-model:activated="activatedTreeNodes"
                                :items="treeItems"
                                item-title="title"
                                item-value="id"
                                item-children="children"
                                activatable
                                open-on-click
                                density="compact"
                                color="primary"
                                class="xml-treeview"
                                @update:activated="handleTreeActivation">
                                <template #title="{ item }">
                                    <span class="tree-item-title" :title="item.title">
                                        {{ item.title }}
                                    </span>
                                </template>
                            </v-treeview>
                        </div>
                        <div class="tree-resize-handle" @mousedown="startResize"></div>
                    </div>

                    <div class="xml-viewer-panel">
                        <div class="xml-panel-header">XML Content</div>

                        <div
                            ref="xmlContainerWrapper"
                            class="xml-container"
                            :class="{ 'word-wrap-enabled': wordWrapEnabled }">
                            <div
                                v-if="showLineNumbers"
                                ref="lineNumbersContainer"
                                class="line-numbers light-scrollbar"
                                :style="{ width: lineNumberColumnWidth }">
                                <div
                                    v-for="n in lineCount"
                                    :key="n"
                                    :class="{
                                        'highlighted-line': highlightedLineNumbers.includes(n),
                                        'selected-line': selectedLineNumber === n,
                                    }">
                                    {{ n }}
                                </div>
                            </div>

                            <pre
                                ref="xmlContainer"
                                class="xml-content light-scrollbar"
                                :class="{ 'with-line-numbers': showLineNumbers }"
                                @scroll="syncScroll"><code ref="codeElement" class="language-xml" v-html="formattedXml"></code></pre>
                        </div>
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    /* eslint-disable simple-import-sort/imports */
    import Prism from 'prismjs';
    import 'prismjs/themes/prism.css';
    import 'prismjs/components/prism-markup';
    /* eslint-enable simple-import-sort/imports */

    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';

    interface XmlTreeItem {
        id: string;
        title: string;
        lineNumber: number;
        children?: XmlTreeItem[];
    }

    const props = defineProps({
        submodelElementData: {
            type: Object as () => any,
            default: () => ({}),
        },
    });

    const xmlContent = ref<string>('');
    const formattedXml = ref<string>('');
    const formattedXmlText = ref<string>('');
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const hasCopied = ref<boolean>(false);

    const xmlContainer = ref<HTMLElement | null>(null);
    const xmlContainerWrapper = ref<HTMLElement | null>(null);
    const codeElement = ref<HTMLElement | null>(null);
    const lineNumbersContainer = ref<HTMLElement | null>(null);
    const treeBodyMaxHeight = ref<number | null>(null);
    let xmlContainerResizeObserver: ResizeObserver | null = null;

    const wordWrapEnabled = ref<boolean>(true);
    const showLineNumbers = ref<boolean>(true);

    const searchQuery = ref<string>('');
    const searchResults = ref<number[]>([]);
    const currentSearchIndex = ref<number>(0);
    const highlightedLineNumbers = ref<number[]>([]);
    const selectedLineNumber = ref<number | null>(null);

    const treeItems = ref<XmlTreeItem[]>([]);
    const treePanelWidth = ref<number>(320);

    function startResize(event: MouseEvent): void {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = treePanelWidth.value;

        function onMouseMove(e: MouseEvent): void {
            const delta = e.clientX - startX;
            treePanelWidth.value = Math.max(150, startWidth + delta);
        }

        function onMouseUp(): void {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
    const openedTreeNodes = ref<string[]>([]);
    const activatedTreeNodes = ref<string[]>([]);

    const { fetchAttachmentFile } = useSMRepositoryClient();

    const lineCount = computed(() => {
        if (!formattedXmlText.value) return 0;
        return formattedXmlText.value.split('\n').length;
    });

    const lineNumberDigits = computed(() => String(Math.max(lineCount.value, 1)).length);

    const lineNumberColumnWidth = computed(() => {
        const digits = Math.max(lineNumberDigits.value, 2);
        return `${digits + 2.5}ch`;
    });

    const treeBodyStyle = computed(() => {
        if (!treeBodyMaxHeight.value) {
            return undefined;
        }

        const height = `${treeBodyMaxHeight.value}px`;
        return {
            height,
            minHeight: height,
            maxHeight: height,
        };
    });

    function updateTreeBodyMaxHeight(): void {
        const height = xmlContainerWrapper.value?.getBoundingClientRect().height;
        treeBodyMaxHeight.value = height ? Math.round(height) : null;
    }

    function bindXmlContainerResizeObserver(): void {
        if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
            return;
        }

        xmlContainerResizeObserver?.disconnect();
        xmlContainerResizeObserver = null;

        if (!xmlContainerWrapper.value) {
            return;
        }

        xmlContainerResizeObserver = new ResizeObserver(() => {
            updateTreeBodyMaxHeight();
        });

        xmlContainerResizeObserver.observe(xmlContainerWrapper.value);
    }

    onMounted(() => {
        if (typeof window !== 'undefined') {
            window.Prism = window.Prism || Prism;
        }

        initialize();

        nextTick(() => {
            bindXmlContainerResizeObserver();
            updateTreeBodyMaxHeight();
        });
    });

    onBeforeUnmount(() => {
        xmlContainerResizeObserver?.disconnect();
        xmlContainerResizeObserver = null;
    });

    watch(
        () => props.submodelElementData,
        () => {
            initialize();
        }
    );

    watch(xmlContent, () => {
        buildXmlView();
        resetSearchState();

        nextTick(() => {
            bindXmlContainerResizeObserver();
            updateTreeBodyMaxHeight();
        });
    });

    watch(searchQuery, () => {
        if (searchQuery.value === '') {
            searchResults.value = [];
            highlightedLineNumbers.value = [];

            if (activatedTreeNodes.value.length > 0) {
                const activeNode = findTreeNodeById(treeItems.value, activatedTreeNodes.value[0]);
                selectedLineNumber.value = activeNode?.lineNumber ?? null;
            } else {
                selectedLineNumber.value = null;
            }
        } else {
            searchInXml();
        }
    });

    function toggleWordWrap(): void {
        wordWrapEnabled.value = !wordWrapEnabled.value;

        nextTick(() => {
            updateTreeBodyMaxHeight();
        });
    }

    function resetSearchState(): void {
        searchQuery.value = '';
        searchResults.value = [];
        currentSearchIndex.value = 0;
        highlightedLineNumbers.value = [];
    }

    function escapeXml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function getXmlDeclaration(xml: string): string | null {
        const match = xml.trim().match(/^<\?xml[\s\S]*?\?>/);
        return match ? match[0] : null;
    }

    function buildAttributesString(element: Element): string {
        if (!element.attributes || element.attributes.length === 0) {
            return '';
        }

        return Array.from(element.attributes)
            .map((attr) => ` ${attr.name}="${escapeXml(attr.value)}"`)
            .join('');
    }

    function getDisplayTitle(element: Element): string {
        const idValue = element.getAttribute('id') ?? '';
        if (!idValue) {
            return element.nodeName;
        }

        const idWithoutName = idValue.includes(element.nodeName)
            ? idValue.replace(element.nodeName, '')
            : idValue;

        const normalizedId = idWithoutName.startsWith('_') ? idWithoutName.slice(1) : idWithoutName;

        return normalizedId ? `${element.nodeName} (${normalizedId})` : element.nodeName;
    }

    function serializeTextNode(node: Text, lines: string[], level: number): void {
        const value = (node.nodeValue ?? '').trim();
        if (!value) return;

        const indent = '  '.repeat(level);
        lines.push(`${indent}${escapeXml(value)}`);
    }

    function serializeCommentNode(node: Comment, lines: string[], level: number): void {
        const indent = '  '.repeat(level);
        lines.push(`${indent}<!--${node.nodeValue ?? ''}-->`);
    }

    function serializeCdataNode(node: CDATASection, lines: string[], level: number): void {
        const indent = '  '.repeat(level);
        lines.push(`${indent}<![CDATA[${node.nodeValue ?? ''}]]>`);
    }

    function serializeElement(
        element: Element,
        lines: string[],
        level: number,
        idPath = 'node'
    ): XmlTreeItem {
        const lineNumber = lines.length + 1;
        const nodeId = `${idPath}-${lineNumber}-${element.nodeName}`;
        const indent = '  '.repeat(level);
        const openingTag = `<${element.nodeName}${buildAttributesString(element)}>`;
        const closingTag = `</${element.nodeName}>`;

        const meaningfulChildren = Array.from(element.childNodes).filter((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                return Boolean((child.nodeValue ?? '').trim());
            }

            return true;
        });

        const childTreeItems: XmlTreeItem[] = [];

        const treeNode: XmlTreeItem = {
            id: nodeId,
            title: getDisplayTitle(element),
            lineNumber,
        };

        if (meaningfulChildren.length === 0) {
            lines.push(`${indent}<${element.nodeName}${buildAttributesString(element)}></${element.nodeName}>`);
            return treeNode;
        }

        const hasOnlySingleTextNode =
            meaningfulChildren.length === 1 &&
            meaningfulChildren[0].nodeType === Node.TEXT_NODE &&
            Boolean((meaningfulChildren[0].nodeValue ?? '').trim());

        if (hasOnlySingleTextNode) {
            const textValue = escapeXml((meaningfulChildren[0].nodeValue ?? '').trim());
            lines.push(`${indent}${openingTag}${textValue}${closingTag}`);
            return treeNode;
        }

        lines.push(`${indent}${openingTag}`);

        meaningfulChildren.forEach((child, index) => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const childTreeNode = serializeElement(
                    child as Element,
                    lines,
                    level + 1,
                    `${nodeId}-${index + 1}`
                );
                childTreeItems.push(childTreeNode);
                return;
            }

            if (child.nodeType === Node.TEXT_NODE) {
                serializeTextNode(child as Text, lines, level + 1);
                return;
            }

            if (child.nodeType === Node.COMMENT_NODE) {
                serializeCommentNode(child as Comment, lines, level + 1);
                return;
            }

            if (child.nodeType === Node.CDATA_SECTION_NODE) {
                serializeCdataNode(child as CDATASection, lines, level + 1);
            }
        });

        lines.push(`${indent}${closingTag}`);

        if (childTreeItems.length > 0) {
            treeNode.children = childTreeItems;
        }

        return treeNode;
    }

    function fallbackFormatXml(xml: string): string {
        try {
            if (!xml || typeof xml !== 'string') {
                return '';
            }

            const trimmedXml = xml.trim();
            if (!trimmedXml) {
                return '';
            }

            let formatted = '';
            let indent = '';

            const xmlNodes = trimmedXml.split(/>\s*</);
            xmlNodes.forEach((node, index) => {
                if (node.match(/^\/[\w:-]/)) {
                    indent = indent.substring(2);
                }

                if (index === 0) {
                    formatted += `<${node}>\n`;
                } else {
                    formatted += `${indent}<${node}>\n`;
                }

                if (node.match(/^<?[\w:-][^>]*[^/]$/) && !node.startsWith('?') && !node.startsWith('!')) {
                    indent += '  ';
                }
            });

            return formatted.substring(0, formatted.length - 1);
        } catch (formatError) {
            console.error('Error formatting XML:', formatError);
            return xml;
        }
    }

    function buildXmlPresentation(xml: string): { text: string; tree: XmlTreeItem[] } {
        const trimmedXml = xml.trim();
        if (!trimmedXml) {
            return { text: '', tree: [] };
        }

        const parser = new DOMParser();
        const documentNode = parser.parseFromString(trimmedXml, 'application/xml');
        const parseError = documentNode.querySelector('parsererror');

        if (parseError || !documentNode.documentElement) {
            return {
                text: fallbackFormatXml(trimmedXml),
                tree: [],
            };
        }

        const lines: string[] = [];
        const xmlDeclaration = getXmlDeclaration(trimmedXml);

        if (xmlDeclaration) {
            lines.push(xmlDeclaration);
        }

        const rootTreeNode = serializeElement(documentNode.documentElement, lines, 0, 'root');

        return {
            text: lines.join('\n'),
            tree: [rootTreeNode],
        };
    }

    function buildXmlView(): void {
        if (!xmlContent.value) {
            formattedXml.value = '';
            formattedXmlText.value = '';
            treeItems.value = [];
            openedTreeNodes.value = [];
            activatedTreeNodes.value = [];
            selectedLineNumber.value = null;
            return;
        }

        try {
            const presentation = buildXmlPresentation(xmlContent.value);
            formattedXmlText.value = presentation.text;
            treeItems.value = presentation.tree;

            if (Prism && Prism.highlight) {
                const highlighted = Prism.highlight(
                    presentation.text,
                    Prism.languages.markup || {},
                    'markup'
                );

                const lines = highlighted.split('\n');

                formattedXml.value = lines
                    .map(
                        (line, index) =>
                            `<div class="xml-line" data-line-number="${index + 1}">${line || ' '}</div>`
                    )
                    .join('');
            } else {
                formattedXml.value = presentation.text;
            }

            openedTreeNodes.value = collectOpenNodeIds(treeItems.value);

            if (treeItems.value.length > 0) {
                activatedTreeNodes.value = [treeItems.value[0].id];
                selectedLineNumber.value = treeItems.value[0].lineNumber;
            }
        } catch (buildError) {
            console.error('Error building XML view:', buildError);
            formattedXmlText.value = xmlContent.value;
            formattedXml.value = xmlContent.value;
            treeItems.value = [];
            openedTreeNodes.value = [];
            activatedTreeNodes.value = [];
            selectedLineNumber.value = null;
        }
    }

    function collectOpenNodeIds(nodes: XmlTreeItem[], maxOpenDepth = 1): string[] {
        const ids: string[] = [];

        const walk = (node: XmlTreeItem, depth: number): void => {
            if (node.children && node.children.length > 0 && depth <= maxOpenDepth) {
                ids.push(node.id);
                node.children.forEach((child) => walk(child, depth + 1));
            }
        };

        nodes.forEach((node) => walk(node, 1));
        return ids;
    }

    function findTreeNodeById(nodes: XmlTreeItem[], id: string): XmlTreeItem | null {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }

            if (node.children) {
                const found = findTreeNodeById(node.children, id);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    function handleTreeActivation(value: string[]): void {
        activatedTreeNodes.value = value;

        if (!value.length) return;

        const activeNode = findTreeNodeById(treeItems.value, value[0]);
        if (!activeNode) return;

        selectedLineNumber.value = activeNode.lineNumber;
        highlightedLineNumbers.value = [activeNode.lineNumber];
        scrollToLine(activeNode.lineNumber);
    }

    function searchInXml(): void {
        searchResults.value = [];
        highlightedLineNumbers.value = [];
        currentSearchIndex.value = 0;

        if (!searchQuery.value || !formattedXmlText.value) return;

        const lines = formattedXmlText.value.split('\n');
        const query = searchQuery.value.toLowerCase();

        lines.forEach((line: string, index: number) => {
            if (line.toLowerCase().includes(query)) {
                searchResults.value.push(index + 1);
            }
        });

        if (searchResults.value.length > 0) {
            const firstLine = searchResults.value[0];
            highlightedLineNumbers.value = [firstLine];
            selectedLineNumber.value = firstLine;
            scrollToLine(firstLine);
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
        selectedLineNumber.value = lineNumber;
        scrollToLine(lineNumber);
    }

    function scrollToLine(lineNumber: number): void {
        nextTick(() => {
            if (!xmlContainer.value) return;

            const lineElement = xmlContainer.value.querySelector(
                `.xml-line[data-line-number="${lineNumber}"]`
            ) as HTMLElement | null;

            if (!lineElement) return;

            const container = xmlContainer.value;

            const offsetTop = lineElement.offsetTop;
            const containerHeight = container.clientHeight;

            container.scrollTop = offsetTop - containerHeight / 2;

            if (showLineNumbers.value && lineNumbersContainer.value) {
                lineNumbersContainer.value.scrollTop = container.scrollTop;
            }
        });
    }

    async function copyToClipboard(): Promise<void> {
        if (!xmlContent.value) return;

        try {
            await navigator.clipboard.writeText(xmlContent.value);
            hasCopied.value = true;

            setTimeout(() => {
                hasCopied.value = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy XML to clipboard', err);
        }
    }

    function downloadXml(): void {
        if (!xmlContent.value) return;

        const blob = new Blob([xmlContent.value], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `${props.submodelElementData.idShort || 'download'}.xml`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function initialize(): Promise<void> {
        if (!props.submodelElementData || !props.submodelElementData.path) {
            xmlContent.value = '';
            formattedXml.value = '';
            formattedXmlText.value = '';
            treeItems.value = [];
            error.value = 'No file path provided';
            return;
        }

        loading.value = true;
        error.value = null;
        xmlContent.value = '';
        formattedXml.value = '';
        formattedXmlText.value = '';
        treeItems.value = [];
        openedTreeNodes.value = [];
        activatedTreeNodes.value = [];
        selectedLineNumber.value = null;

        try {
            const fileBlob = await fetchAttachmentFile(props.submodelElementData.path);

            if (!fileBlob) {
                error.value = 'Failed to load XML file';
                return;
            }

            if (fileBlob instanceof Blob) {
                xmlContent.value = await fileBlob.text();
            } else {
                console.error('Expected a Blob, but received:', fileBlob);
                error.value = 'Loaded file is not a valid Blob';
            }
        } catch (e) {
            console.error('Error loading XML file:', e);
            error.value = `Error loading XML file: ${e instanceof Error ? e.message : 'Unknown error'}`;
        } finally {
            loading.value = false;
        }
    }

    function syncScroll(): void {
        if (showLineNumbers.value && lineNumbersContainer.value && xmlContainer.value) {
            lineNumbersContainer.value.scrollTop = xmlContainer.value.scrollTop;
        }
    }
</script>

<style scoped>
    .xml-layout {
        display: grid;
        gap: 16px;
        align-items: stretch;
    }

    .xml-tree-panel {
        --xml-panel-header-block-height: 29px;
        min-width: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
    }

    .xml-viewer-panel {
        min-width: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .tree-resize-handle {
        position: absolute;
        top: var(--xml-panel-header-block-height);
        right: -8px;
        width: 16px;
        height: calc(100% - var(--xml-panel-header-block-height));
        cursor: col-resize;
        z-index: 10;
    }

    .tree-resize-handle::after {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 3px;
        height: 100%;
        background: transparent;
        border-radius: 2px;
    }

    .xml-panel-header {
        font-size: 14px;
        line-height: 21px;
        font-weight: 600;
        margin-bottom: 8px;
    }

    .xml-tree-body {
        flex: 1;
        overflow-x: auto;
        overflow-y: auto;
        border: 1px solid #d6d6d6;
        border-radius: 4px;
        background: #ffffff;
        padding: 8px;
        box-sizing: border-box;
    }

    .xml-container {
        flex: 0 0 auto;
        height: calc(100vh - 330px);
        border-radius: 4px;
        background-color: #f5f5f5;
        border: 1px solid #d6d6d6;
        display: flex;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
    }

    .line-numbers {
        padding: 16px 8px;
        text-align: right;
        background-color: #e0e0e0;
        border-right: 1px solid #ccc;
        color: #666;
        user-select: none;
        font-size: 14px;
        line-height: 21px;
        overflow-x: hidden;
        overflow-y: hidden;
        max-height: 100%;
        height: 100%;
        box-sizing: border-box;
        flex: 0 0 auto;
        font-variant-numeric: tabular-nums;
        font-family: Consolas, Monaco, 'Courier New', monospace;
    }

    .line-numbers > div {
        height: 21px;
        line-height: 21px;
        padding: 0;
        margin: 0;
        white-space: nowrap;
    }

    .highlighted-line {
        background-color: rgba(255, 213, 79, 0.5);
        font-weight: bold;
    }

    .selected-line {
        background-color: rgba(255, 214, 79, 0.5);
        font-weight: bold;
    }

    .xml-content {
        margin: 0;
        padding: 16px;
        white-space: pre;
        word-wrap: normal;
        word-break: normal;
        overflow-wrap: normal;
        font-size: 14px;
        line-height: 21px;
        flex-grow: 0;
        overflow: auto;
        height: auto;
        max-height: none;
        box-sizing: border-box;
        background: #f5f5f5;
        font-family: Consolas, Monaco, 'Courier New', monospace;
        tab-size: 2;
    }

    .word-wrap-enabled .xml-content {
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: anywhere;
    }

    .xml-content code {
        display: block;
        min-width: max-content;
        width: fit-content;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        line-height: inherit;
        font-family: inherit;
        white-space: inherit;
        word-break: inherit;
        overflow-wrap: inherit;
    }

    .error-message {
        color: #f44336;
    }

    :deep(.token) {
        line-height: 21px;
    }

    :deep(code) {
        line-height: 21px;
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

    :deep(.xml-search-field .v-field) {
        background: #fff;
    }

    :deep(.xml-treeview) {
        background: transparent;
        color: black;
        --v-treeview-indent-size: 12px;
    }

    :deep(.xml-treeview .v-list-group__items) {
        --indent-padding: 12px;
    }

    :deep(.xml-treeview .v-treeview-item__root) {
        min-height: 28px;
    }

    :deep(.xml-treeview .v-treeview-item__content) {
        overflow: visible;
    }

    :deep(.xml-treeview .v-treeview-item__title) {
        font-size: 14px;
    }

    .tree-item-title {
        display: block;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :deep(.xml-treeview .v-list) {
        background: transparent;
    }

    :deep(.xml-treeview .v-list-item) {
        min-height: 28px;
        padding-inline: 4px;
        border-radius: 4px;
    }

    :deep(.xml-treeview .v-list-item--active) {
        background: rgba(25, 118, 210, 0.12);
    }

    .light-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #bdbdbd #efefef;
    }

    .light-scrollbar::-webkit-scrollbar {
        width: 12px;
        height: 12px;
    }

    .light-scrollbar::-webkit-scrollbar-track {
        background: #efefef;
        border-radius: 8px;
    }

    .light-scrollbar::-webkit-scrollbar-thumb {
        background: #bdbdbd;
        border-radius: 8px;
        border: 2px solid #efefef;
    }

    .light-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }

    .light-scrollbar::-webkit-scrollbar-corner {
        background: #efefef;
    }
    .xml-line {
        height: 21px;
        line-height: 21px;
        white-space: inherit;
    }

    @media (max-width: 1100px) {
        .xml-layout {
            grid-template-columns: 1fr;
        }
    }
</style>
