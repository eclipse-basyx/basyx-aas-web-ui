import { toSubmodelElementIdShort } from '@/utils/KblVecUtils/KblVecXmlConversionUtils';
import { normalizeForLookup } from '@/utils/KblVecUtils/KblVecUploadUtils';

export type ExtractedDataPoint = {
    key: string;
    label: string;
    value: string;
};

export type DataPointTreeNode = {
    key: string;
    label: string;
    displayLabel: string;
    exportIdShort: string;
    kindLabel: string;
    value: string;
    leafCount: number;
    depth: number;
    selectable: boolean;
    hasChildren: boolean;
    icon: string;
    expanded: boolean;
    children: DataPointTreeNode[];
    exportPoints: ExtractedDataPoint[];
};

export function buildDataPointTree(root: Element): DataPointTreeNode[] {
    const groupedChildren = new Map<string, Element[]>();

    for (const child of Array.from(root.children)) {
        const tagName = child.localName ?? child.tagName;
        const existing = groupedChildren.get(tagName) ?? [];
        existing.push(child);
        groupedChildren.set(tagName, existing);
    }

    const nodes: DataPointTreeNode[] = [];
    let sequence = 0;

    for (const [tagName, elements] of groupedChildren.entries()) {
        const children: DataPointTreeNode[] = [];
        const exportPoints: ExtractedDataPoint[] = [];

        for (let index = 0; index < elements.length; index++) {
            const result = buildDataPointTreeNode(elements[index], tagName, 1, ++sequence, index + 1);
            children.push(result.node);
            exportPoints.push(...result.exportPoints);
        }

        nodes.push({
            key: `group:${tagName}`,
            label: tagName,
            displayLabel: tagName,
            exportIdShort: toSubmodelElementIdShort(tagName),
            kindLabel: 'Tag folder',
            value: '',
            leafCount: exportPoints.length,
            depth: 0,
            selectable: false,
            hasChildren: children.length > 0,
            icon: 'mdi-folder-outline',
            expanded: true,
            children,
            exportPoints,
        });
    }

    return nodes;
}

function buildDataPointTreeNode(
    element: Element,
    parentPath: string,
    depth: number,
    sequence: number,
    siblingIndex: number
): { node: DataPointTreeNode; exportPoints: ExtractedDataPoint[] } {
    const tagName = element.localName ?? element.tagName;
    const elementId = element.getAttribute('id')?.trim() ?? '';
    const displayLabel = elementId !== '' ? `${tagName} (${elementId})` : siblingIndex > 1 ? `${tagName} [${siblingIndex}]` : tagName;
    const exportIdShort = elementId !== '' ? toSubmodelElementIdShort(elementId) : toSubmodelElementIdShort(`${tagName}_${siblingIndex}`);
    const path = `${parentPath}.${tagName}`;
    const childElements = Array.from(element.children);
    const children: DataPointTreeNode[] = [];
    const exportPoints: ExtractedDataPoint[] = [];

    for (let index = 0; index < childElements.length; index++) {
        const child = childElements[index];
        const childResult = buildDataPointTreeNode(child, path, depth + 1, sequence * 1000 + index + 1, index + 1);
        children.push(childResult.node);
        exportPoints.push(...childResult.exportPoints);
    }

    if (childElements.length === 0) {
        const textValue = getElementTextValue(element);
        if (textValue !== '') {
            exportPoints.push({ key: `leaf:${path}:${sequence}`, label: path, value: textValue });
        }
    }

    const selectable = childElements.length > 0 || elementId !== '';
    const node: DataPointTreeNode = {
        key: `node:${path}:${sequence}`,
        label: tagName,
        displayLabel,
        exportIdShort,
        kindLabel: selectable ? 'Selectable element' : 'Value element',
        value: childElements.length === 0 ? getElementTextValue(element) : '',
        leafCount: exportPoints.length,
        depth,
        selectable,
        hasChildren: children.length > 0,
        icon: selectable ? 'mdi-layers-triple' : 'mdi-rhombus-medium-outline',
        expanded: false,
        children,
        exportPoints,
    };

    return { node, exportPoints };
}

function getElementTextValue(element: Element): string {
    let textValue = '';
    for (const childNode of Array.from(element.childNodes)) {
        if (childNode.nodeType === Node.TEXT_NODE || childNode.nodeType === Node.CDATA_SECTION_NODE) {
            textValue += childNode.textContent ?? '';
        }
    }

    return textValue.trim();
}

export function appendVisibleTreeRows(
    rows: DataPointTreeNode[],
    node: DataPointTreeNode,
    depth: number,
    query: string,
    expandedRowKeys: Set<string>
): boolean {
    const subtreeMatches = query === '' ? true : nodeMatchesQuery(node, query);
    if (!subtreeMatches) return false;

    rows.push({ ...node, depth });

    const shouldExpand = query !== '' || expandedRowKeys.has(node.key);
    if (shouldExpand) {
        for (const child of node.children) {
            appendVisibleTreeRows(rows, child, depth + 1, query, expandedRowKeys);
        }
    }

    return true;
}

function nodeMatchesQuery(node: DataPointTreeNode, query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery === '') return true;

    if (
        node.displayLabel.toLowerCase().includes(normalizedQuery) ||
        node.label.toLowerCase().includes(normalizedQuery) ||
        node.value.toLowerCase().includes(normalizedQuery)
    ) {
        return true;
    }

    return node.children.some((child) => nodeMatchesQuery(child, normalizedQuery));
}

export function collectSelectableNodeKeys(nodes: DataPointTreeNode[]): string[] {
    const keys: string[] = [];

    for (const node of nodes) {
        collectSelectableNodeKeysFromNode(node, keys);
    }

    return keys;
}

function collectSelectableNodeKeysFromNode(node: DataPointTreeNode, keys: string[]): void {
    if (node.selectable) {
        keys.push(node.key);
    }

    for (const child of node.children) {
        collectSelectableNodeKeysFromNode(child, keys);
    }
}

export function collectExportPointsFromSelectedNodes(
    node: DataPointTreeNode,
    selectedKeys: Set<string>,
    target: Map<string, { path: string; value: string }>
): void {
    if (selectedKeys.has(node.key)) {
        for (const point of node.exportPoints) {
            target.set(point.key, { path: point.label, value: point.value });
        }
    }

    for (const child of node.children) {
        collectExportPointsFromSelectedNodes(child, selectedKeys, target);
    }
}

export function getSelectableKeysForRow(row: DataPointTreeNode): string[] {
    const keys: string[] = [];
    collectSelectableNodeKeysFromNode(row, keys);
    return keys;
}

export function countSelectableNodes(nodes: DataPointTreeNode[]): number {
    let count = 0;
    for (const node of nodes) {
        if (node.selectable) count++;
        count += countSelectableNodes(node.children);
    }

    return count;
}

export function collectTopLevelSelectedNodes(node: DataPointTreeNode, selectedKeys: Set<string>): DataPointTreeNode[] {
    const isSelected = node.selectable && selectedKeys.has(node.key);
    if (isSelected) {
        return [node];
    }

    const results: DataPointTreeNode[] = [];
    for (const child of node.children) {
        results.push(...collectTopLevelSelectedNodes(child, selectedKeys));
    }

    return results;
}

export function resolveExportPropertyLabel(
    selectedNode: DataPointTreeNode,
    exportPoint: ExtractedDataPoint,
    pointIndex: number
): string {
    const pathSegments = exportPoint.label
        .split('.')
        .map((segment) => segment.trim())
        .filter((segment) => segment !== '');

    const selectedNodeLabel = selectedNode.label.trim();
    const selectedNodeIndex = pathSegments.lastIndexOf(selectedNodeLabel);

    let relativeSegments = selectedNodeIndex >= 0 ? pathSegments.slice(selectedNodeIndex + 1) : pathSegments.slice(-2);

    if (relativeSegments.length === 0) {
        relativeSegments = [pathSegments[pathSegments.length - 1] ?? 'Value'];
    }

    const sanitizeSegment = (segment: string): string => {
        if (segment.startsWith('@')) {
            return `Attr_${segment.slice(1)}`;
        }
        return segment;
    };

    const rawLabel = relativeSegments.map(sanitizeSegment).join('_') || 'Value';

    const isCartesianPoint = normalizeForLookup(selectedNode.label) === 'cartesianpoint';
    const isCoordinate = normalizeForLookup(rawLabel) === 'coordinates';
    if (isCartesianPoint && isCoordinate) {
        const axes = ['x', 'y', 'z'];
        return axes[pointIndex] || `coordinate_${pointIndex + 1}`;
    }

    return rawLabel;
}
