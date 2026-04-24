import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
import {
    collectTopLevelSelectedNodes,
    resolveExportPropertyLabel,
    type DataPointTreeNode,
} from '@/utils/KblVecUtils/KblVecDataPointTreeUtils';
import { normalizeForLookup } from '@/utils/KblVecUtils/KblVecUploadUtils';
import { addTypedPropertyToCollection, ensureUniqueIdShortForCollection } from '@/utils/KblVecUtils/KblVecSubmodelElementUtils';

export function buildSubmodelsFromSelection(
    aasId: string,
    sourceFile: File,
    dataPointTree: DataPointTreeNode[],
    selectedDataPointKeys: Set<string>,
    isVecFormat: boolean,
    determineContentType: (file: File, defaultContentType: string) => string
): { submodels: aasTypes.Submodel[]; dataPointCount: number } {
    const technicalDataSubmodel = new aasTypes.Submodel(`${aasId}/submodels/technicaldata`);
    technicalDataSubmodel.idShort = 'TechnicalData';
    technicalDataSubmodel.displayName = [new aasTypes.LangStringNameType('en', 'TechnicalData')];
    technicalDataSubmodel.semanticId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
        new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2'),
    ]);

    const technicalDataRootCollection = new aasTypes.SubmodelElementCollection();
    technicalDataRootCollection.idShort = 'Data';
    technicalDataRootCollection.value = [];

    const groupCollections = new Map<string, aasTypes.SubmodelElementCollection>();
    let dataPointCount = 0;

    for (const groupNode of dataPointTree) {
        const selectedNodes = collectTopLevelSelectedNodes(groupNode, selectedDataPointKeys);
        if (selectedNodes.length === 0) continue;

        for (let index = 0; index < selectedNodes.length; index++) {
            const selectedNode = selectedNodes[index];
            const nodeCollection = new aasTypes.SubmodelElementCollection();
            nodeCollection.idShort = selectedNode.exportIdShort.trim() || `${groupNode.label}_${index + 1}`;
            nodeCollection.value = [];
            let nodePointCount = 0;

            for (let pointIndex = 0; pointIndex < selectedNode.exportPoints.length; pointIndex++) {
                const exportPoint = selectedNode.exportPoints[pointIndex];
                const propertyLabel = resolveExportPropertyLabel(selectedNode, exportPoint, pointIndex);
                addTypedPropertyToCollection(nodeCollection, propertyLabel, exportPoint.value);
                nodePointCount++;
            }

            if ((nodeCollection.value?.length ?? 0) === 0) {
                continue;
            }

            const normalizedGroupKey = normalizeForLookup(groupNode.label);
            let groupCollection = groupCollections.get(normalizedGroupKey);
            if (!groupCollection) {
                groupCollection = new aasTypes.SubmodelElementCollection();
                groupCollection.idShort = ensureUniqueIdShortForCollection(technicalDataRootCollection, groupNode.label);
                groupCollection.value = [];
                groupCollections.set(normalizedGroupKey, groupCollection);
                technicalDataRootCollection.value?.push(groupCollection);
            }

            nodeCollection.idShort = ensureUniqueIdShortForCollection(groupCollection, nodeCollection.idShort ?? 'Node');
            groupCollection.value?.push(nodeCollection);
            dataPointCount += nodePointCount;
        }
    }

    if ((technicalDataRootCollection.value?.length ?? 0) > 0) {
        technicalDataSubmodel.submodelElements = technicalDataRootCollection.value;
    }

    const handoverSubmodel = buildHandoverDocumentationSubmodel(aasId, sourceFile, isVecFormat, determineContentType);
    const submodels: aasTypes.Submodel[] = [handoverSubmodel];

    if ((technicalDataSubmodel.submodelElements?.length ?? 0) > 0) {
        submodels.unshift(technicalDataSubmodel);
    }

    return {
        submodels,
        dataPointCount,
    };
}

export function buildHandoverDocumentationSubmodel(
    aasId: string,
    sourceFile: File,
    isVecFormat: boolean,
    determineContentType: (file: File, defaultContentType: string) => string
): aasTypes.Submodel {
    const handoverSubmodel = new aasTypes.Submodel(`${aasId}/submodels/handoverdocumentation`);
    handoverSubmodel.idShort = 'HandoverDocumentation';
    handoverSubmodel.displayName = [new aasTypes.LangStringNameType('en', 'HandoverDocumentation')];
    handoverSubmodel.semanticId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
        new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, '0173-1#01-AHF578#001'),
    ]);

    const metadataCollection = new aasTypes.SubmodelElementCollection();
    metadataCollection.idShort = 'Metadata';
    metadataCollection.value = [];

    const sourceFileName = sourceFile.name?.trim() ?? '';
    const sourceFileExtension = sourceFileName.includes('.') ? sourceFileName.split('.').pop()?.toLowerCase() ?? '' : '';
    const sourceFileContentType = determineContentType(sourceFile, 'application/xml');
    const sourceFileLastModifiedIso = new Date(sourceFile.lastModified).toISOString();

    addTypedPropertyToCollection(metadataCollection, 'OriginalFileName', sourceFileName);
    addTypedPropertyToCollection(metadataCollection, 'OriginalFileExtension', sourceFileExtension);
    addTypedPropertyToCollection(metadataCollection, 'OriginalFileFormat', isVecFormat ? 'VEC' : 'KBL');
    addTypedPropertyToCollection(metadataCollection, 'OriginalFileContentType', sourceFileContentType);
    addTypedPropertyToCollection(metadataCollection, 'OriginalFileSizeBytes', String(sourceFile.size));
    addTypedPropertyToCollection(metadataCollection, 'OriginalFileLastModifiedIso', sourceFileLastModifiedIso);

    handoverSubmodel.submodelElements = [metadataCollection];
    return handoverSubmodel;
}
