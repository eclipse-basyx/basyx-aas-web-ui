import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { getSemanticIdValue } from '@/utils/AAS/SemanticIdUtils';
import { base64Decode } from '@/utils/EncodeDecodeUtils';

export function useHierarchicalStructure_v1_xUtils() {
    /**
     * Find the RelationshipElement that connects the parent to a specific child entity.
     * Returns the relationship label if found, empty string otherwise.
     */
    function findRelationshipLabelForChild(
        parentNode: Record<string, unknown>,
        childNode: Record<string, unknown>
    ): string {
        const statements = parentNode.statements as Record<string, unknown>[] | undefined;
        if (!statements) return '';

        const childIdShort = childNode.idShort as string;

        // Find a RelationshipElement whose 'second' reference points to the child
        const relationship = statements.find((stmt) => {
            if (stmt.modelType !== 'RelationshipElement') return false;

            const second = stmt.second as { keys?: Array<{ type: string; value: string }> } | undefined;
            if (!second?.keys || second.keys.length === 0) return false;

            // Check if any key in the second reference matches the child's idShort
            return second.keys.some((key) => key.type === 'Entity' && key.value === childIdShort);
        });

        if (relationship) {
            const semanticId = getSemanticIdValue(relationship);
            return getRelationshipLabel(semanticId);
        }

        return '';
    }

    function getRelationshipLabel(semanticId: string | undefined): string {
        const labelMap: Record<string, string> = {
            'https://admin-shell.io/idta/HierarchicalStructures/HasPart/1/0': 'HasPart',
            'https://admin-shell.io/idta/HierarchicalStructures/IsPartOf/1/0': 'IsPartOf',
            'https://admin-shell.io/idta/HierarchicalStructures/SameAs/1/0': 'SameAs',
        };

        return semanticId ? (labelMap[semanticId] ?? '') : '';
    }

    /**
     * Build a ModelReference to an Entity based on its path.
     * The path format is: .../submodels/{base64SubmodelId}/submodel-elements/{idShortPath}
     * We need to create a reference with keys for Submodel and each Entity in the path.
     */
    function buildEntityReference(entityElement: Record<string, unknown>): aasTypes.Reference {
        const entityPath = entityElement.path as string;

        // Extract the submodel ID and idShortPath from the path
        const splitted = entityPath.split('/submodel-elements/');
        const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
        const idShortPath = splitted[1]; // e.g., "CompositeMachine.ElectricalEnclosure.PLC"

        // Build keys array starting with Submodel
        const keys: aasTypes.Key[] = [new aasTypes.Key(aasTypes.KeyTypes.Submodel, submodelId)];

        // Split the idShortPath by '.' to get each entity in the hierarchy
        const entityIdShorts = idShortPath.split('.');

        // Add a key for each entity in the path
        entityIdShorts.forEach((idShort) => {
            keys.push(new aasTypes.Key(aasTypes.KeyTypes.Entity, idShort));
        });

        return new aasTypes.Reference(aasTypes.ReferenceTypes.ModelReference, keys);
    }

    function findEntryNode(bomData: Record<string, unknown>): Record<string, unknown> | undefined {
        const submodelElements = bomData.submodelElements as Record<string, unknown>[] | undefined;
        return submodelElements?.find(isEntryNode);
    }

    function isEntryNode(element: Record<string, unknown>): boolean {
        const semanticId = getSemanticIdValue(element);
        return semanticId === 'https://admin-shell.io/idta/HierarchicalStructures/EntryNode/1/0';
    }

    function extractChildEntities(node: Record<string, unknown>): Record<string, unknown>[] {
        const statements = node.statements as Record<string, unknown>[] | undefined;
        return statements?.filter((element) => element.modelType === 'Entity') ?? [];
    }

    function extractRelationshipSemanticIds(node: Record<string, unknown>): (string | undefined)[] {
        const statements = node.statements as Record<string, unknown>[] | undefined;
        return (
            statements
                ?.filter((element) => element.modelType === 'RelationshipElement')
                .map((element) => getSemanticIdValue(element)) ?? []
        );
    }

    /**
     * Find the parent entity of a given entity in the BOM data structure.
     * Traverses the hierarchy to find which entity contains the target entity in its statements.
     */
    function findParentEntity(
        bomData: Record<string, unknown>,
        targetEntity: Record<string, unknown>
    ): Record<string, unknown> | null {
        const targetIdShort = targetEntity.idShort as string;

        // Search through all entities starting from the entry node
        const entryNodeElement = findEntryNode(bomData);
        if (!entryNodeElement) return null;

        return findParentInTree(entryNodeElement, targetIdShort);
    }

    /**
     * Recursively search through the entity tree to find the parent of the target entity.
     */
    function findParentInTree(
        currentEntity: Record<string, unknown>,
        targetIdShort: string
    ): Record<string, unknown> | null {
        const statements = currentEntity.statements as Record<string, unknown>[] | undefined;
        if (!statements) return null;

        // Check if any direct child entity matches the target
        const childEntities = statements.filter((stmt) => stmt.modelType === 'Entity');
        for (const child of childEntities) {
            if ((child.idShort as string) === targetIdShort) {
                return currentEntity;
            }
        }

        // Recursively search in child entities
        for (const child of childEntities) {
            const found = findParentInTree(child, targetIdShort);
            if (found) return found;
        }

        return null;
    }

    /**
     * Find the RelationshipElement in the parent entity that references the target entity.
     * This relationship becomes orphaned when the target entity is deleted.
     */
    function findRelationshipToEntity(
        parentEntity: Record<string, unknown>,
        targetEntity: Record<string, unknown>
    ): Record<string, unknown> | null {
        const statements = parentEntity.statements as Record<string, unknown>[] | undefined;
        if (!statements) return null;

        const targetIdShort = targetEntity.idShort as string;
        const targetGlobalAssetId = targetEntity.globalAssetId as string | undefined;

        // Find a RelationshipElement whose 'second' reference points to the target entity
        const relationship = statements.find((stmt) => {
            if (stmt.modelType !== 'RelationshipElement') return false;

            const second = stmt.second as { keys?: Array<{ type: string; value: string }> } | undefined;
            if (!second?.keys || second.keys.length === 0) return false;

            // Check all keys in the second reference for a match
            return second.keys.some((key) => {
                // Match by Entity idShort (for ModelReference to Entity)
                if (key.type === 'Entity' && key.value === targetIdShort) return true;
                // Match by globalAssetId (for reference to AAS)
                if (
                    targetGlobalAssetId &&
                    (key.type === 'AssetAdministrationShell' || key.type === 'GlobalReference') &&
                    key.value === targetGlobalAssetId
                )
                    return true;
                return false;
            });
        });

        return relationship as Record<string, unknown> | null;
    }

    return {
        findRelationshipLabelForChild,
        getRelationshipLabel,
        buildEntityReference,
        isEntryNode,
        findEntryNode,
        extractChildEntities,
        extractRelationshipSemanticIds,
        findParentEntity,
        findParentInTree,
        findRelationshipToEntity,
    };
}
