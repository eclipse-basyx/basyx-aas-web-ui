import type { LangString } from '../types/template';

export function createDefaultLangString(): LangString {
    return {
        language: 'en',
        text: '',
    };
}

export function ensurelangStrings(value: unknown): LangString[] {
    if (
        Array.isArray(value) &&
        value.every((entry) => typeof entry === 'object' && entry !== null && 'text' in entry)
    ) {
        return value as LangString[];
    }
    return [createDefaultLangString()];
}
export function addLangStringRow(entries: LangString[]): LangString[] {
    return [...entries, createDefaultLangString()];
}

export function removeLangStringRow(entries: LangString[], index: number): LangString[] {
    const updated = [...entries];
    updated.splice(index, 1);

    return updated.length > 0 ? updated : [createDefaultLangString()];
}

export function updateLangStringLanguage(entries: LangString[], index: number, language: string): LangString[] {
    const updated = [...entries];
    updated[index] = {
        ...updated[index],
        language,
    };
    return updated;
}

export function updateLangStringText(entries: LangString[], index: number, text: string): LangString[] {
    const updated = [...entries];
    updated[index] = {
        ...updated[index],
        text,
    };
    return updated;
}
