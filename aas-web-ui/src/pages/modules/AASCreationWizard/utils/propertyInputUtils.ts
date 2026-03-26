import type { PropertyElement } from '../types/template';

export function getPropertyInputType(element: PropertyElement): string {
    const valueType = element.valueType?.toLowerCase();

    if (!valueType) {
        return 'text';
    }

    if (valueType.includes('date')) {
        return 'date';
    }

    if (valueType.includes('boolean')) {
        return 'checkbox';
    }

    if (
        valueType.includes('int') ||
        valueType.includes('integer') ||
        valueType.includes('decimal') ||
        valueType.includes('double') ||
        valueType.includes('float')
    ) {
        return 'number';
    }

    return 'text';
}
