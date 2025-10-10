/**
 * @constant {Array<Object>} keyTypes
 * @description Enumeration of Key Types as specified in IDTA 01001-3-0-1, page 82.
 * Each key type has a name and an abbreviation according to different IDTA SMT specifications (see appendix).
 *
 * @property {string} name - The name of the key type.
 * @property {string} abbreviation - The abbreviation of the key type.
 *
 * @example
 * // Example of a key type
 * const aasKeyType = keyTypes[1]; // { name: 'AssetAdministrationShell', abbreviation: 'AAS' }
 */
export const keyTypes = [
    { name: 'AnnotationRelationshipElement', abbreviation: 'RelA' },
    { name: 'AssetAdministrationShell', abbreviation: 'AAS' },
    { name: 'BasicEventElement', abbreviation: '' },
    { name: 'Blob', abbreviation: 'Blob' },
    { name: 'Capability', abbreviation: 'Cap' },
    { name: 'ConceptDescription', abbreviation: 'CD' },
    { name: 'DataElement', abbreviation: '' },
    { name: 'Entity', abbreviation: 'Ent' },
    { name: 'EventElement', abbreviation: 'Evt' },
    { name: 'File', abbreviation: 'File' },
    { name: 'FragmentReference', abbreviation: '' },
    { name: 'GlobalReference', abbreviation: 'GlobalRef' },
    { name: 'Identifiable', abbreviation: '' },
    { name: 'MultiLanguageProperty', abbreviation: 'MLP' },
    { name: 'Operation', abbreviation: 'Opr' },
    { name: 'Property', abbreviation: 'Prop' },
    { name: 'Range', abbreviation: 'Range' },
    { name: 'Referable', abbreviation: '' },
    { name: 'ReferenceElement', abbreviation: 'Ref' },
    { name: 'RelationshipElement', abbreviation: 'Rel' },
    { name: 'Submodel', abbreviation: 'SM' },
    { name: 'SubmodelElement', abbreviation: 'SME' },
    { name: 'SubmodelElementCollection', abbreviation: 'SMC' },
    { name: 'SubmodelElementList', abbreviation: 'SML' },
];

/**
 * Retrieves the abbreviation for a given Key Type name.
 *
 * @param {string} keyTypeName - The name of the key type to look up.
 * @returns {string} The abbreviation for the specified key type name, or an empty string if not found or if the input is invalid.
 */
export function getKeyTypeAbbreviation(keyTypeName: string): string {
    const failResponse = '';

    if (!keyTypeName || keyTypeName.trim() === '') return failResponse;

    const foundKeyType = keyTypes.find((keyType) => keyType.name === keyTypeName);

    if (foundKeyType && foundKeyType?.abbreviation && foundKeyType.abbreviation.trim() !== '')
        return foundKeyType.abbreviation;

    return failResponse;
}
