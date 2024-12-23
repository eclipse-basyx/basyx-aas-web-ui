import { UUID } from './IDUtils';

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
