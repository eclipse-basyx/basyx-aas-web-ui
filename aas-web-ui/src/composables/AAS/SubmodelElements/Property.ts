import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';

export function useSMEProperty() {
    // Composables
    const { unitSuffix } = useConceptDescriptionHandling();

    /**
     * Checks if the given property object is a valid Property model with respect to AAS metamodel specs.
     *
     * @param {any} property - The property object to check.
     * @returns {boolean} True if the object is a Property model, otherwise false.
     */
    function isProperty(property: any): boolean {
        if (
            property &&
            typeof property === 'object' &&
            Object.keys(property).length > 0 &&
            property.modelType &&
            typeof property.modelType === 'string' &&
            property.modelType.trim() === 'Property'
        ) {
            return true;
        }
        return false;
    }

    /**
     * Checks whether the given property object has a non-empty value.
     *
     * @param {any} property - The property object to check.
     * @returns {boolean} True if the property has a non-empty value, otherwise false.
     */
    function hasValue(property: any): boolean {
        if (isProperty(property) && property?.value && property.value.trim() !== '') {
            return true;
        }
        return false;
    }

    /**
     * Retrieves the display value of a property if it exists, otherwise returns a default value.
     *
     * @param {any} property - The property object to check.
     * @param {string} [defaultValueToDisplay=''] - The default value to return if the property is invalid or has no value.
     * @returns {string} The display value of the property or the default value.
     */
    function valueToDisplay(property: any, defaultValueToDisplay: string = ''): string {
        if (isProperty(property) && hasValue(property)) {
            const unit = unitSuffix(property).trim();
            return property.value + (unit !== '' ? ' ' + unit : '');
        }
        return defaultValueToDisplay;
    }
    return { hasValue, valueToDisplay };
}
