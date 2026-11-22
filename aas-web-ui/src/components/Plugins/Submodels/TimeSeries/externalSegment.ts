import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils'

// IDTA 02008-1-1 names the data of an ExternalSegment File and Blob.
// Data is the idShort used by earlier BaSyx examples and stays supported.
const DATA_SEMANTIC_IDS = [
  'https://admin-shell.io/idta/TimeSeries/File/1/1',
  'https://admin-shell.io/idta/TimeSeries/Blob/1/1',
]
const DATA_ID_SHORTS = new Set(['File', 'Blob', 'Data'])

/**
 * Finds the File or Blob that holds the data of an ExternalSegment.
 * An element with a value is preferred, since the template defines both File and Blob.
 */
export function findExternalSegmentData (segment: any): any | undefined {
  const elements: any[] = Array.isArray(segment?.value) ? segment.value : []
  const candidates = elements.filter(element =>
    (element?.modelType === 'File' || element?.modelType === 'Blob')
    && (DATA_SEMANTIC_IDS.some(semanticId => checkSemanticId(element, semanticId))
      || DATA_ID_SHORTS.has(element.idShort)))
  return candidates.find(element => typeof element.value === 'string' && element.value.trim() !== '') ?? candidates[0]
}
