export function normalizeForLookup(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function tokenizePath(path: string): string[] {
    return path
        .split(/[^a-zA-Z0-9]+/)
        .map((token) => normalizeForLookup(token))
        .filter((token) => token !== '');
}

export function getElementPath(element: Element): string {
    const parts: string[] = [];
    let current: Element | null = element;
    while (current) {
        parts.push(current.localName ?? current.tagName);
        current = current.parentElement;
    }
    return parts.reverse().join('.');
}

export function stringifyUnknown(value: unknown): string {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

export function splitIdAndSuffix(id: string): { idBase: string; nextSuffix: number } {
    const match = id.match(/^(.*)_(\d+)$/);
    if (!match) {
        return { idBase: id, nextSuffix: 2 };
    }

    return {
        idBase: match[1],
        nextSuffix: Number.parseInt(match[2], 10) + 1,
    };
}

export function extractBackendMessages(backendData: unknown): string[] {
    if (!backendData) return [];

    if (Array.isArray(backendData)) {
        return backendData
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    const text = (item as Record<string, unknown>).text;
                    const correlationId = (item as Record<string, unknown>).correlationId;
                    return [text, correlationId]
                        .filter((entry) => typeof entry === 'string' && entry.trim() !== '')
                        .join(' ')
                        .trim();
                }
                return '';
            })
            .filter((entry) => entry !== '');
    }

    if (typeof backendData === 'string') return [backendData];
    if (backendData && typeof backendData === 'object') {
        const obj = backendData as Record<string, unknown>;
        const text = typeof obj.text === 'string' ? obj.text : '';
        const correlationId = typeof obj.correlationId === 'string' ? obj.correlationId : '';
        return [text, correlationId].filter((entry) => entry !== '');
    }

    return [];
}

export function hasOfficeXmlIncompatibilityMessage(normalizedMessages: string[]): boolean {
    return normalizedMessages.some(
        (message) =>
            message.includes('notofficexmlfileexception') ||
            (message.includes('raw xml') && message.includes('office 2003 xml'))
    );
}

export function buildBackendSpecificHint(backendData: unknown): string {
    const messages = extractBackendMessages(backendData);
    const normalized = messages.map((message) => message.toLowerCase());

    if (hasOfficeXmlIncompatibilityMessage(normalized)) {
        return 'This backend does not accept raw XML from this source for KBL import. Please export a backend-compatible KBL/VEC file (for example the correct Office XML/container format from the source system) or convert the file to a compatible format before uploading.';
    }

    return '';
}
