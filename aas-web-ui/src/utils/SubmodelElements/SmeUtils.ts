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
    //     'nameToDisplay()',
    //     'multiLanguageProperty:',
    //     multiLanguageProperty,
    //     'language::',
    //     language,
    //     'defaultValueToDisplay:',
    //     defaultdefaultValueToDisplayNameToDisplay,
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
