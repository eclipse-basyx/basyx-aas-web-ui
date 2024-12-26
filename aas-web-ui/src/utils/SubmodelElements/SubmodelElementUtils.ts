import { UUID } from '@/utils/IDUtils';
import { hasValue as fileHasValue, valueToDisplay as fileValueToDisplay } from '@/utils/SubmodelElements/FileUtils';
import {
    hasValue as mlpHasValue,
    valueToDisplay as mlpValueToDisplay,
} from '@/utils/SubmodelElements/MultiLanguagePropertyUtils';
import { hasValue as propHasValue, valueToDisplay as propValueToDisplay } from '@/utils/SubmodelElements/PropertyUtils';

export function hasValue(sme: any): boolean {
    // console.log(
    //     'hasValue()',
    //     'multiLanguageProperty:',
    //     multiLanguageProperty,
    // );

    if (sme && Object.keys(sme).length > 0 && sme?.modelType.trim() !== '') {
        switch (sme.modelType) {
            // TODO case 'AnnotatedRelationshipElement':
            // TODO case 'BasicEventElement':
            // TODO case 'Blob':
            // TODO case 'Capability':
            // TODO case 'DataElement':
            // TODO case 'Entity':
            // TODO case 'EventElement':
            case 'File':
                return fileHasValue(sme);
            case 'MultiLanguageProperty':
                return mlpHasValue(sme);
            // TODO case 'Operation':
            case 'Property':
                return propHasValue(sme);
            // TODO case 'Range':
            // TODO case 'ReferenceElement':
            // TODO case 'RelationshipElement':
            // TODO case 'SubmodelElementCollection':
            // TODO case 'SubmodelElementList':
            // TODO case 'Submodel Element Entities':
        }
    }
    return false;
}

export function valueToDisplay(sme: any, language = 'en', defaultValueToDisplay = ''): string {
    // console.log(
    //     'valueToDisplay()',
    //     'multiLanguageProperty:',
    //     multiLanguageProperty,
    //     'language::',
    //     language,
    //     'defaultValueToDisplay:',
    //     defaultdefaultValueToDisplayNameToDisplay,
    // );

    if (sme && Object.keys(sme).length > 0 && sme?.modelType && sme.modelType.trim() !== '') {
        switch (sme.modelType) {
            // TODO case 'AnnotatedRelationshipElement':
            // TODO case 'BasicEventElement':
            // TODO case 'Blob':
            // TODO case 'Capability':
            // TODO case 'DataElement':
            // TODO case 'Entity':
            // TODO case 'EventElement':
            case 'File':
                return fileValueToDisplay(sme, defaultValueToDisplay);
            case 'MultiLanguageProperty':
                return mlpValueToDisplay(sme, language, defaultValueToDisplay);
            // TODO case 'Operation':
            case 'Property':
                return propValueToDisplay(sme, defaultValueToDisplay);
            // TODO case 'Range':
            // TODO case 'ReferenceElement':
            // TODO case 'RelationshipElement':
            // TODO case 'SubmodelElementCollection':
            // TODO case 'SubmodelElementList':
            // TODO case 'Submodel Element Entities':
        }
    }
    return defaultValueToDisplay;
}

// Calculate pathes of the SubmodelElements in a provided Submodel/SubmodelElement
export async function calculateSubmodelElementPathes(parent: any, startPath: string): Promise<any> {
    // console.log('calculateSubmodelElementPathes()', 'parent:', parent, 'startPath:', startPath);

    if (!parent || Object.keys(parent).length === 0) return;

    parent.path = startPath;
    // Just set if it is not available (e.g. for a Submodel it is available!)
    if (!parent?.id) {
        parent.id = UUID();
    }

    if (Array.isArray(parent?.submodelElements) && parent?.submodelElements.length > 0) {
        // Submodel
        for (const element of parent.submodelElements) {
            await calculateSubmodelElementPathes(element, startPath + '/submodel-elements/' + element.idShort);
        }
    } else if (Array.isArray(parent?.value) && parent?.value.length > 0) {
        switch (parent.modelType) {
            // SubmodelElementCollection
            case 'SubmodelElementCollection':
                for (const element of parent.value) {
                    await calculateSubmodelElementPathes(element, startPath + '.' + element.idShort);
                }
                break;
            // SubmodelElementList
            case 'SubmodelElementList':
                for (const [index, element] of parent.value.entries()) {
                    await calculateSubmodelElementPathes(
                        element,
                        startPath + encodeURIComponent('[') + index + encodeURIComponent(']')
                    );
                }
                break;
        }
    } else if (Array.isArray(parent?.statements) && parent?.statements.length > 0 && parent.modelType == 'Entity') {
        // Entity
        for (const element of parent.value) {
            await calculateSubmodelElementPathes(element, startPath + '.' + element.idShort);
        }
    }

    return parent;
}
