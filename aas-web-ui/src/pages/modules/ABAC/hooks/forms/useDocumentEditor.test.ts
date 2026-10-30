import type { DocumentEditorOptions } from './useDocumentEditor'
import { describe, expect, it, vi } from 'vitest'
import { applyDefinitionState, definitionFormState, representDefinition } from '../../utils/forms/definitions'
import { applyPolicyDraft, policyDraftState, representPolicyDraft } from '../../utils/forms/policy'
import { detectRuleUpdate, resolveUpdateDocument } from '../../utils/update'
import { useDocumentEditor } from './useDocumentEditor'

describe('guided editor transitions', () => {
  it('updates nested policy edits through replacement snapshots while retaining previous drafts', () => {
    const editor = useDocumentEditor({ checkFormSupport: representPolicyDraft })
    editor.loadJsonDocument(JSON.stringify({ AllAccessPermissionRules: {
      DEFATTRIBUTES: [{ name: 'claims', attributes: [{ CLAIM: 'role' }] }],
      rules: [{ USEACL: 'first', USEFORMULA: 'formula', OBJECTS: [] }],
    } }))
    const previousDocument = editor.formDocument.value!
    const observed = computed(() => JSON.stringify(editor.formDocument.value))
    expect(JSON.parse(observed.value)).toEqual(previousDocument)
    const draft = policyDraftState(previousDocument)!
    editor.updateFormDocument(applyPolicyDraft(previousDocument, {
      ...draft,
      rules: [{ ...draft.rules[0], USEACL: 'second' }],
    }))
    expect(JSON.parse(observed.value).AllAccessPermissionRules.rules[0].USEACL).toBe('second')
    expect(JSON.parse(editor.jsonText.value)).toEqual(editor.formDocument.value)
    expect(previousDocument).toMatchObject({ AllAccessPermissionRules: { rules: [{ USEACL: 'first' }] } })
    editor.switchToJson()
    editor.switchToForm()
    expect(editor.editorMode.value).toBe('form')
    expect(editor.formDocument.value).toEqual(JSON.parse(observed.value))
  })

  it('round-trips a JSON alternative switch without resurrecting the old alternative', () => {
    const original = { USEACL: 'old', FORMULA: { $boolean: true }, OBJECTS: [{ ROUTE: '/shells' }], extra: true }
    const acl = { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ GLOBAL: 'ANONYMOUS' }] }
    const editor = useDocumentEditor({
      checkFormSupport: () => ({ ok: true }),
      resolveJsonDocument: (base, draft) => resolveUpdateDocument(base, detectRuleUpdate(base, draft)),
    })
    editor.loadJsonDocument(JSON.stringify(original))
    editor.switchToJson()
    editor.jsonText.value = JSON.stringify({ ACL: acl })
    editor.switchToForm()
    expect(editor.editorMode.value).toBe('form')
    const expected = { ACL: acl, FORMULA: original.FORMULA, OBJECTS: original.OBJECTS, extra: true }
    expect(editor.formDocument.value).toEqual(expected)
    expect(JSON.parse(editor.jsonText.value)).toEqual(expected)
    editor.switchToJson()
    expect(JSON.parse(editor.jsonText.value)).toEqual(expected)
    expect(original.USEACL).toBe('old')
  })

  it('keeps form deletions across a partial JSON edit and switching back to the form', () => {
    const editor = useDocumentEditor({
      checkFormSupport: () => ({ ok: true }),
      resolveJsonDocument: (base, draft) => {
        const update = detectRuleUpdate(base, draft)
        return resolveUpdateDocument(base, update)
      },
    })
    editor.loadJsonDocument('{"ACL":{"ACCESS":"ALLOW","USEATTRIBUTES":"old"},"extra":true}')
    editor.updateFormDocument({ ACL: { ACCESS: 'ALLOW' }, extra: true })
    editor.switchToJson()
    editor.jsonText.value = '{"extra":false}'
    editor.switchToForm()
    expect(editor.formDocument.value).toEqual({ ACL: { ACCESS: 'ALLOW' }, extra: false })
    expect(editor.mergeBaseDocument.value).toEqual(editor.formDocument.value)
    expect(editor.editorMode.value).toBe('form')
  })

  it('owns a fresh template copy and resets a previous fallback when starting a new draft', () => {
    const initialDocument = { attributes: [{ CLAIM: 'role' }] }
    const editor = useDocumentEditor({ checkFormSupport: () => ({ ok: true }) })
    editor.loadJsonDocument('{')
    editor.initializeNewDocument(initialDocument)
    const formDocument = editor.formDocument.value as typeof initialDocument
    formDocument.attributes[0]!.CLAIM = 'changed'
    expect(initialDocument.attributes[0]!.CLAIM).toBe('role')
    expect(editor.editorMode.value).toBe('form')
    expect(editor.formLimitation.value).toBeNull()
    editor.initializeNewDocument(initialDocument)
    expect(editor.formDocument.value).toEqual(initialDocument)
    expect(editor.jsonText.value).toBe(JSON.stringify(initialDocument, null, 2))
  })

  it('checks form support synchronously on load and attempted switching', () => {
    const checkFormSupport = vi.fn<DocumentEditorOptions['checkFormSupport']>(() => ({ ok: false, limitation: 'structure' }))
    const editor = useDocumentEditor({ checkFormSupport })
    editor.loadJsonDocument('{"future":true}')
    expect(checkFormSupport).toHaveBeenCalledTimes(1)
    expect(checkFormSupport).toHaveBeenCalledWith({ future: true })
    editor.switchEditorMode('form')
    expect(checkFormSupport).toHaveBeenCalledTimes(2)
    expect(editor.formLimitation.value).toBe('structure')
    expect(editor.jsonText.value).toBe('{"future":true}')
  })

  it.each(['{', 'null', '[]', '42'])('does not call the form support checker for invalid document JSON: %s', jsonText => {
    const checkFormSupport = vi.fn<DocumentEditorOptions['checkFormSupport']>(() => ({ ok: true }))
    const editor = useDocumentEditor({ checkFormSupport })
    editor.loadJsonDocument(jsonText)
    expect(checkFormSupport).not.toHaveBeenCalled()
    expect(editor.editorMode.value).toBe('json')
    expect(editor.formDocument.value).toBeUndefined()
    expect(editor.jsonText.value).toBe(jsonText)
  })

  it('preserves a form edit when the result requires JSON mode', () => {
    const checkFormSupport = vi.fn<DocumentEditorOptions['checkFormSupport']>(() => ({ ok: false, limitation: 'expression' }))
    const editor = useDocumentEditor({ checkFormSupport })
    editor.initializeNewDocument({})
    const updatedDocument = { formula: { $future: true } }
    editor.updateFormDocument(updatedDocument)
    expect(editor.formDocument.value).toEqual(updatedDocument)
    expect(JSON.parse(editor.jsonText.value)).toEqual(updatedDocument)
    expect(editor.editorMode.value).toBe('json')
    expect(editor.formLimitation.value).toBe('expression')
    expect(checkFormSupport).toHaveBeenCalledTimes(1)
  })

  it('preserves unsupported JSON and leaves malformed text editable', () => {
    const editor = useDocumentEditor({ checkFormSupport: value => representDefinition('objects', value) })
    const json = '{"objects":[{"ROUTE":{"path":"/test"}}],"extra":false}'
    editor.loadJsonDocument(json)
    editor.switchEditorMode('form')
    expect(editor.editorMode.value).toBe('json')
    expect(editor.jsonText.value).toBe(json)
    editor.jsonText.value = '{'
    editor.switchEditorMode('form')
    expect(editor.formLimitation.value).toBe('malformed')
    expect(editor.jsonText.value).toBe('{')
  })

  it('keeps combined object sources through form and JSON switching', () => {
    const editor = useDocumentEditor({ checkFormSupport: value => representDefinition('objects', value) })
    editor.loadJsonDocument('{"USEOBJECTS":["target"],"extra":0}')
    const state = definitionFormState('objects', editor.formDocument.value)!
    if (state.kind !== 'objects') {
      throw new Error('Expected object state')
    }
    state.objects.entries = [{ kind: 'ROUTE', value: '/shells' }]
    editor.updateFormDocument(applyDefinitionState(editor.formDocument.value, state))
    expect(editor.editorMode.value).toBe('form')
    editor.switchEditorMode('json')
    editor.switchEditorMode('form')
    expect(editor.formDocument.value).toEqual({ objects: [{ ROUTE: '/shells' }], USEOBJECTS: ['target'], extra: 0 })
    expect(editor.editorMode.value).toBe('form')
  })
})

describe('live JSON form availability', () => {
  it('debounces feedback, retains notices while typing, clears fixes, and cancels on disposal', async () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const checkFormSupport = vi.fn<DocumentEditorOptions['checkFormSupport']>(document => document.future
      ? { ok: false, limitation: 'structure' }
      : { ok: true })
    const editor = scope.run(() => useDocumentEditor({ checkFormSupport }))!
    try {
      editor.initializeNewDocument({ current: true })
      const formSnapshot = editor.formDocument.value
      editor.switchToJson()
      editor.jsonText.value = '{'
      await nextTick()
      await vi.advanceTimersByTimeAsync(300)
      expect(editor.formLimitation.value).toBe('malformed')
      editor.jsonText.value = '[]'
      await nextTick()
      expect(editor.formLimitation.value).toBe('malformed')
      await vi.advanceTimersByTimeAsync(300)
      expect(editor.formLimitation.value).toBe('notAnObject')
      editor.jsonText.value = '{"future":true}'
      await nextTick()
      await vi.advanceTimersByTimeAsync(300)
      expect(editor.formLimitation.value).toBe('structure')
      checkFormSupport.mockClear()
      editor.jsonText.value = '{"current":false}'
      await nextTick()
      await vi.advanceTimersByTimeAsync(100)
      const corrected = '{ "current": true }'
      editor.jsonText.value = corrected
      await nextTick()
      await vi.advanceTimersByTimeAsync(299)
      expect(editor.formLimitation.value).toBe('structure')
      await vi.advanceTimersByTimeAsync(1)
      expect(editor.formLimitation.value).toBeNull()
      expect(checkFormSupport).toHaveBeenCalledTimes(1)
      expect(editor.editorMode.value).toBe('json')
      expect(editor.jsonText.value).toBe(corrected)
      expect(editor.formDocument.value).toBe(formSnapshot)
      editor.jsonText.value = '{"future":true}'
      await nextTick()
      scope.stop()
      await vi.advanceTimersByTimeAsync(300)
      expect(checkFormSupport).toHaveBeenCalledTimes(1)
    } finally {
      scope.stop()
      vi.useRealTimers()
    }
  })

  it('checks partial JSON against the same effective document as switching, without changing its base', async () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const editor = scope.run(() => useDocumentEditor({
      checkFormSupport: document => document.USEACL ? { ok: true } : { ok: false, limitation: 'structure' },
      resolveJsonDocument: (base, draft) => resolveUpdateDocument(base, detectRuleUpdate(base, draft)),
    }))!
    try {
      editor.loadJsonDocument('{"USEACL":"shared","OBJECTS":[]}')
      const base = editor.mergeBaseDocument.value
      editor.switchToJson()
      const draft = '{"extra":true}'
      editor.jsonText.value = draft
      await nextTick()
      await vi.advanceTimersByTimeAsync(300)
      expect(editor.formLimitation.value).toBeNull()
      expect(editor.mergeBaseDocument.value).toBe(base)
      expect(editor.jsonText.value).toBe(draft)
      editor.switchToForm()
      expect(editor.editorMode.value).toBe('form')
      expect(editor.formDocument.value).toEqual({ USEACL: 'shared', OBJECTS: [], extra: true })
    } finally {
      scope.stop()
      vi.useRealTimers()
    }
  })
})
