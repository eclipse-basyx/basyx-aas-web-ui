import { useIDUtils } from '@/composables/IDUtils';
import { hasValue as fileHasValue, valueToDisplay as fileValueToDisplay } from '@/utils/SubmodelElements/FileUtils';
import {
    hasValue as mlpHasValue,
    valueToDisplay as mlpValueToDisplay,
} from '@/utils/SubmodelElements/MultiLanguagePropertyUtils';
import { hasValue as propHasValue, valueToDisplay as propValueToDisplay } from '@/utils/SubmodelElements/PropertyUtils';

// Composables
const { generateUUID } = useIDUtils();

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
export function hasValue(sme: any): boolean {
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
export function valueToDisplay(sme: any, language: string = 'en', defaultValueToDisplay: string = ''): string {
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

/**
 * Recursively calculates and sets the paths of SubmodelElements in a provided Submodel (SM) or SubmodelElement (SME).
 * The paths are constructed based on the specified starting path and the structure of the Submodel.
 *
 * This function modifies the `parent` object by:
 * - Setting the `path` property to the constructed string based on the starting path and `idShort`.
 * - Assigning a unique `id` if it does not have one.
 *
 * It handles different types of parent structures:
 * - For **SubmodelElements**, it iterates over `submodelElements`.
 * - For **SubmodelElementCollection**, it iterates over the `value` array.
 * - For **SubmodelElementList**, it uses array index notation (`[index]`).
 * - For **Entity**, it processes `statements`.
 *
 * @param {any} parent - The parent Submodel or SubmodelElement object to process.
 * @param {string} startPath - The starting path for the calculation, which will be updated recursively.
 * @returns {Promise<any>} A promise that resolves with the modified parent object, including calculated paths.
 */
export async function calculateSubmodelElementPaths(parent: any, startPath: string): Promise<any> {
    if (!parent || Object.keys(parent).length === 0) return;

    parent.path = startPath;
    // Just set if it is not available (e.g. for a Submodel it is available!)
    if (!parent?.id) {
        parent.id = generateUUID();
    }

    if (Array.isArray(parent?.submodelElements) && parent?.submodelElements.length > 0) {
        // Submodel
        for (const element of parent.submodelElements) {
            await calculateSubmodelElementPaths(element, startPath + '/submodel-elements/' + element.idShort);
        }
    } else if (Array.isArray(parent?.value) && parent?.value.length > 0) {
        switch (parent.modelType) {
            // SubmodelElementCollection
            case 'SubmodelElementCollection':
                for (const element of parent.value) {
                    await calculateSubmodelElementPaths(element, startPath + '.' + element.idShort);
                }
                break;
            // SubmodelElementList
            case 'SubmodelElementList':
                for (const [index, element] of parent.value.entries()) {
                    await calculateSubmodelElementPaths(
                        element,
                        startPath + encodeURIComponent('[') + index + encodeURIComponent(']')
                    );
                }
                break;
        }
    } else if (Array.isArray(parent?.statements) && parent?.statements.length > 0 && parent.modelType == 'Entity') {
        // Entity
        for (const element of parent.statements) {
            await calculateSubmodelElementPaths(element, startPath + '.' + element.idShort);
        }
    }

    return parent;
}
