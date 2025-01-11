// Enumeration of KeyTypes, cp. IDTA 01001-3-0-1, page 82
// abbreviations according to different IDTA SMT specs (see appendix)
const keyTypes = [
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

export function getKeyTypeAbbreviation(keyTypeName: string): string {
    const failResponse = '';

    if (!keyTypeName || keyTypeName.trim() === '') return failResponse;

    const foundKeyType = keyTypes.find((keyType) => keyType.name === keyTypeName);

    if (foundKeyType && foundKeyType?.abbreviation && foundKeyType.abbreviation.trim() !== '')
        return foundKeyType.abbreviation;

    return failResponse;
}
