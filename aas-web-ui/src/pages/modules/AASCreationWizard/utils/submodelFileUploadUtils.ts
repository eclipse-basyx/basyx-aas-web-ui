import type { FormStateObject } from '../types/form'
import type {
  AnnotatedRelationshipElementElement,
  EntityElement,
  SubmodelElementCollectionElement,
  SubmodelElementListElement,
  TemplateElement,
} from '../types/template'
import { asFile, asFormStateObject, asFormStateObjectArray } from './formFieldUtils'
import { getListItemRendererElements } from './subModelListUtils'

export type SubmodelFileUploadTask = {
  file: File
  path: string
}

function joinPath (parentPath: string, idShort: string): string {
  return parentPath ? `${parentPath}.${idShort}` : idShort
}

function joinListIndexPath (listPath: string, index: number): string {
  return `${listPath}%5B${index}%5D`
}

function createSmePath (
  submodelEndpoint: string,
  idShortPath: string,
): string {
  return `${submodelEndpoint}/submodel-elements/${idShortPath}`
}

function collectFileUploadTasksFromElements (
  elements: TemplateElement[],
  formState: FormStateObject,
  parentIdShortPath: string,
  submodelEndpoint: string,
): SubmodelFileUploadTask[] {
  const tasks: SubmodelFileUploadTask[] = []

  for (const element of elements) {
    const value = formState[element.idShort]

    if (element.modelType === 'File') {
      const file = asFile(value)

      if (file) {
        const idShortPath = joinPath(parentIdShortPath, element.idShort)

        tasks.push({
          file,
          path: createSmePath(submodelEndpoint, idShortPath),
        })
      }

      continue
    }

    if (element.modelType === 'SubmodelElementCollection') {
      const nestedState = asFormStateObject(value)
      const collection = element as SubmodelElementCollectionElement
      const collectionPath = joinPath(parentIdShortPath, collection.idShort)

      tasks.push(
        ...collectFileUploadTasksFromElements(
          collection.value,
          nestedState,
          collectionPath,
          submodelEndpoint,
        ),
      )

      continue
    }

    if (element.modelType === 'SubmodelElementList') {
      const list = element as SubmodelElementListElement
      const items = asFormStateObjectArray(value)
      const listPath = joinPath(parentIdShortPath, list.idShort)
      const itemRendererElements = getListItemRendererElements(list)

      const isSingleFileItemList
        = itemRendererElements.length === 1
          && itemRendererElements[0].modelType === 'File'

      for (const [index, item] of items.entries()) {
        const itemPath = joinListIndexPath(listPath, index)

        if (isSingleFileItemList) {
          const fileElement = itemRendererElements[0]
          const file = asFile(item[fileElement.idShort])

          if (file) {
            tasks.push({
              file,
              path: createSmePath(submodelEndpoint, itemPath),
            })
          }

          continue
        }

        tasks.push(
          ...collectFileUploadTasksFromElements(
            itemRendererElements,
            item,
            itemPath,
            submodelEndpoint,
          ),
        )
      }
    }
    if (element.modelType === 'AnnotatedRelationshipElement') {
      const nestedState = asFormStateObject(value)
      const annotatedRelationship = element as AnnotatedRelationshipElementElement
      const collectionPath = joinPath(parentIdShortPath, annotatedRelationship.idShort)

      if (Array.isArray(annotatedRelationship.annotations)) {
        tasks.push(
          ...collectFileUploadTasksFromElements(
            annotatedRelationship.annotations,
            nestedState,
            collectionPath,
            submodelEndpoint,
          ),
        )
      }
      continue
    }
    if (element.modelType === 'Entity') {
      const nestedState = asFormStateObject(value)
      const entity = element as EntityElement
      const collectionPath = joinPath(parentIdShortPath, entity.idShort)

      if (Array.isArray(entity.statements)) {
        tasks.push(
          ...collectFileUploadTasksFromElements(
            entity.statements,
            nestedState,
            collectionPath,
            submodelEndpoint,
          ),
        )
      }
      continue
    }
  }

  return tasks
}

export function collectSubmodelFileUploadTasks (
  submodelId: string,
  elements: TemplateElement[],
  formState: FormStateObject | null,
  getSmEndpointById: (submodelId: string) => string,
): SubmodelFileUploadTask[] {
  if (!formState) {
    return []
  }

  const submodelEndpoint = getSmEndpointById(submodelId)

  if (!submodelEndpoint) {
    return []
  }

  return collectFileUploadTasksFromElements(
    elements,
    formState,
    '',
    submodelEndpoint,
  )
}
