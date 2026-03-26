import type { FormStateValue } from '../types/form';
import type { LangString } from '../types/template';
import { ensurelangStrings } from './langStringFormUtils';

export function asString(value: FormStateValue): string {
    return typeof value === 'string' ? value : '';
}

export function asLangStrings(value: FormStateValue): LangString[] {
    return ensurelangStrings(value);
}

export function asFile(value: FormStateValue): File | null {
    return value instanceof File || value === null ? value : null;
}
export function formatLabel(idShort: string): string {
    return idShort.replace(/([a-z])([A-Z])/g, '$1 $2');
}
