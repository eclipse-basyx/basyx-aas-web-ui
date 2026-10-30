import type { DocumentEditorMode, FormLimitation, Representation } from '../../types/forms'
import type { JsonObject } from '../../types/json'
import { isObject } from '../../utils/object'

export interface DocumentEditorOptions {
  /** Checks lossless form support, not schema validity or backend acceptance. */
  checkFormSupport: (document: JsonObject) => Representation
  /** Resolves partial JSON updates against the latest complete form snapshot. */
  resolveJsonDocument?: (base: JsonObject, draft: JsonObject) => JsonObject
}

/**
 * Coordinates the form document and editable JSON text for a dialog.
 * Form changes update both values. JSON edits remain raw text until loading or
 * switching to form mode succeeds; formDocument is not a live JSON preview.
 * Unsupported content stays in JSON mode with a translatable reason. JSON edits
 * refresh that reason after a 300 ms pause without committing form state.
 * Documents are immutable snapshots: nested editors emit a replacement document
 * instead of mutating it, so large drafts do not need deep reactive proxies.
 */
export function useDocumentEditor ({ checkFormSupport, resolveJsonDocument }: DocumentEditorOptions) {
  const editorMode = ref<DocumentEditorMode>('form')
  const formDocument = shallowRef<JsonObject>()
  const jsonText = ref('')
  const formLimitation = ref<FormLimitation | null>(null)
  const mergeBaseDocument = shallowRef<JsonObject>()

  watch([jsonText, editorMode, mergeBaseDocument], ([, mode], _, onCleanup) => {
    if (mode !== 'json') {
      return
    }
    // Retain the current notice until its replacement is ready to avoid flicker.
    const timer = setTimeout(() => {
      formLimitation.value = inspectJsonDocument().limitation
    }, 300)
    onCleanup(() => clearTimeout(timer))
  })

  /**
   * Checks the effective JSON document without rewriting text or committing form state.
   * Live feedback and explicit switching use the same merge and support checks.
   */
  function inspectJsonDocument (): { document: JsonObject, limitation: null } | { document: null, limitation: FormLimitation } {
    let parsedDocument: unknown
    try {
      parsedDocument = JSON.parse(jsonText.value)
    } catch {
      return { document: null, limitation: 'malformed' }
    }
    if (!isObject(parsedDocument)) {
      return { document: null, limitation: 'notAnObject' }
    }
    const completeDocument = mergeBaseDocument.value && resolveJsonDocument
      ? resolveJsonDocument(mergeBaseDocument.value, parsedDocument)
      : parsedDocument
    const support = checkFormSupport(completeDocument)
    return support.ok
      ? { document: completeDocument, limitation: null }
      : { document: null, limitation: support.limitation }
  }

  /** Starts a fresh form draft with a private copy of the supplied template. */
  function initializeNewDocument (initialDocument: JsonObject): void {
    editorMode.value = 'form'
    formDocument.value = structuredClone(initialDocument)
    mergeBaseDocument.value = formDocument.value
    formLimitation.value = null
    jsonText.value = JSON.stringify(formDocument.value, null, 2)
  }

  /** Loads existing JSON, preserving its text even when form mode is unavailable. */
  function loadJsonDocument (sourceJson: string): void {
    mergeBaseDocument.value = undefined
    formLimitation.value = null
    jsonText.value = sourceJson
    let parsedDocument: unknown
    try {
      parsedDocument = JSON.parse(sourceJson)
    } catch {
      editorMode.value = 'json'
      formLimitation.value = 'malformed'
      formDocument.value = undefined
      return
    }
    if (!isObject(parsedDocument)) {
      editorMode.value = 'json'
      formLimitation.value = 'notAnObject'
      formDocument.value = undefined
      return
    }
    mergeBaseDocument.value = parsedDocument
    const formSupport = checkFormSupport(parsedDocument)
    if (formSupport.ok) {
      editorMode.value = 'form'
      formDocument.value = parsedDocument
    } else {
      editorMode.value = 'json'
      formLimitation.value = formSupport.limitation
      formDocument.value = undefined
    }
  }

  /** Leaves JSON text untouched when it cannot be represented faithfully by the form. */
  function switchToForm (): void {
    const { document, limitation } = inspectJsonDocument()
    formLimitation.value = limitation
    if (!document) {
      return
    }
    formDocument.value = document
    mergeBaseDocument.value = document
    jsonText.value = JSON.stringify(document, null, 2)
    editorMode.value = 'form'
  }

  function switchToJson (): void {
    if (!formDocument.value) {
      return
    }
    formLimitation.value = null
    jsonText.value = JSON.stringify(formDocument.value, null, 2)
    editorMode.value = 'json'
  }

  /** Keeps a form edit even if its new shape requires falling back to JSON mode. */
  function updateFormDocument (updatedDocument: JsonObject): void {
    formLimitation.value = null
    formDocument.value = updatedDocument
    mergeBaseDocument.value = updatedDocument
    jsonText.value = JSON.stringify(updatedDocument, null, 2)
    const formSupport = checkFormSupport(updatedDocument)
    if (!formSupport.ok) {
      formLimitation.value = formSupport.limitation
      editorMode.value = 'json'
    }
  }

  function switchEditorMode (requestedMode: DocumentEditorMode): void {
    if (editorMode.value === requestedMode) {
      return
    }
    if (requestedMode === 'form') {
      switchToForm()
    } else {
      switchToJson()
    }
  }

  return {
    editorMode,
    formDocument,
    mergeBaseDocument,
    jsonText,
    formLimitation,
    initializeNewDocument,
    loadJsonDocument,
    switchEditorMode,
    switchToForm,
    switchToJson,
    updateFormDocument,
  }
}
