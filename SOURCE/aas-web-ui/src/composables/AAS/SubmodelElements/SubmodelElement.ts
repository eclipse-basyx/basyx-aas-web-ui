import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
import { useSMEProperty } from '@/composables/AAS/SubmodelElements/Property';
import {
    hasValue as mlpHasValue,
    valueToDisplay as mlpValueToDisplay,
} from '@/utils/AAS/SubmodelElements/MultiLanguagePropertyUtils';

export function useSME() {
    const { hasValue: fileHasValue, valueToDisplay: fileValueToDisplay } = useSMEFile();
    const { hasValue: propHasValue, valueToDisplay: propValueToDisplay } = useSMEProperty();

    /**
     * Checks if the given Submodel Element (SME) has a valid value based on its type.
     *
     * The function evaluates whether the provided SME object:
     * - Exists and is not empty
     * - Has a non-empty modelType property
     *
     * Depending on the `modelType`, it evaluates the value differently:
     * - For 'File' type, it delegates to the `fileHasValue` function.
     * - For 'MultiLanguageProperty' type, it delegates to the `mlpHasValue` function.
     * - For 'Property' type, it delegates to the `propHasValue` function.
     * - For 'SubmodelElementCollection' and 'SubmodelElementList',
     *   it checks if the `value` is an array and has at least one element.
     *
     * @param {any} sme - The Submodel Element object to check.
     * @returns {boolean} Returns true if the `sme` has a valid value, false otherwise.
     */
    function hasValue(sme: any): boolean {
        if (sme && Object.keys(sme).length > 0 && sme?.modelType.trim() !== '') {
            switch (sme.modelType) {
                // TODO SMEUtils.hasValue() case 'AnnotatedRelationshipElement':
                // TODO SMEUtils.hasValue() case 'BasicEventElement':
                // TODO SMEUtils.hasValue() case 'Blob':
                // TODO SMEUtils.hasValue() case 'Capability':
                // TODO SMEUtils.hasValue() case 'DataElement':
                // TODO SMEUtils.hasValue() case 'Entity':
                // TODO SMEUtils.hasValue() case 'EventElement':
                case 'File':
                    return fileHasValue(sme);
                case 'MultiLanguageProperty':
                    return mlpHasValue(sme);
                // TODO SMEUtils.hasValue() case 'Operation':
                case 'Property':
                    return propHasValue(sme);
                // TODO SMEUtils.hasValue() case 'Range':
                // TODO SMEUtils.hasValue() case 'ReferenceElement':
                // TODO SMEUtils.hasValue() case 'RelationshipElement':
                case 'SubmodelElementCollection':
                case 'SubmodelElementList':
                    return sme.value && Array.isArray(sme.value) && sme.value.length > 0;
                // TODO SMEUtils.hasValue() case 'Submodel Element Entities':
            }
        }
        return false;
    }

    /**
     * Retrieves the display value of a Submodel Element (SME) if it exists, otherwise returns a default value.
     *
     * @param {any} sme - The SME object to check.
     * @param {string} [defaultValueToDisplay=''] - The default value to return if the SME is invalid or has no value.
     * @returns {string} The display value of the SME or the default value.
     */
    function valueToDisplay(sme: any, language: string = 'en', defaultValueToDisplay: string = ''): string {
        if (sme && Object.keys(sme).length > 0 && sme?.modelType && sme.modelType.trim() !== '') {
            switch (sme.modelType) {
                // TODO SMEUtils.valueToDisplay() case 'AnnotatedRelationshipElement':
                // TODO SMEUtils.valueToDisplay() case 'BasicEventElement':
                // TODO SMEUtils.valueToDisplay() case 'Blob':
                // TODO SMEUtils.valueToDisplay() case 'Capability':
                // TODO SMEUtils.valueToDisplay() case 'DataElement':
                // TODO SMEUtils.valueToDisplay() case 'Entity':
                // TODO SMEUtils.valueToDisplay() case 'EventElement':
                case 'File':
                    return fileValueToDisplay(sme, defaultValueToDisplay);
                case 'MultiLanguageProperty':
                    return mlpValueToDisplay(sme, language, defaultValueToDisplay);
                // TODO SMEUtils.valueToDisplay() case 'Operation':
                case 'Property':
                    return propValueToDisplay(sme, defaultValueToDisplay);
                // TODO SMEUtils.valueToDisplay() case 'Range':
                // TODO SMEUtils.valueToDisplay() case 'ReferenceElement':
                // TODO SMEUtils.valueToDisplay() case 'RelationshipElement':
                // TODO SMEUtils.valueToDisplay() case 'SubmodelElementCollection':
                // TODO SMEUtils.valueToDisplay() case 'SubmodelElementList':
                // TODO SMEUtils.valueToDisplay() case 'Submodel Element Entities':
            }
        }
        return defaultValueToDisplay;
    }

    return { hasValue, valueToDisplay };
}
