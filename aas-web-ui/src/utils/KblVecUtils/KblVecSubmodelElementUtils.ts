import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
import { inferTypedValue, toSubmodelElementIdShort } from '@/utils/KblVecUtils/KblVecXmlConversionUtils';

export function ensureUniqueIdShortForCollection(
    collection: aasTypes.SubmodelElementCollection,
    preferredIdShort: string
): string {
    const normalizedPreferredIdShort = toSubmodelElementIdShort(preferredIdShort);
    const existing = new Set<string>((collection.value ?? []).map((item) => item.idShort ?? '').filter(Boolean));

    if (!existing.has(normalizedPreferredIdShort)) {
        return normalizedPreferredIdShort;
    }

    let suffix = 2;
    while (existing.has(`${normalizedPreferredIdShort}_${suffix}`)) {
        suffix++;
    }

    return `${normalizedPreferredIdShort}_${suffix}`;
}

export function addTypedPropertyToCollection(
    collection: aasTypes.SubmodelElementCollection,
    preferredIdShort: string,
    value: string
): void {
    const typed = inferTypedValue(value);
    const property = new aasTypes.Property(typed.valueType);
    property.idShort = ensureUniqueIdShortForCollection(collection, preferredIdShort);
    property.value = typed.normalizedValue;

    if (!collection.value) collection.value = [];
    collection.value.push(property);
}
