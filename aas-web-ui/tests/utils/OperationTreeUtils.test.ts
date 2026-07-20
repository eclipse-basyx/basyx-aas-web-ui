import { describe, expect, it } from 'vitest'
import {
  createOperationPersistenceBoundary,
  decorateResolvedOperationNode,
  parseOperationLocator,
  resolveOperationLocator,
  serializeOperationLocator,
  stripTreeMetadata,
  synchronizeOperationOwnedTreeNode,
  verificationPathToOperationLocator,
} from '@/utils/AAS/OperationTreeUtils'

const operation = {
  modelType: 'Operation',
  inputVariables: [{
    value: {
      modelType: 'SubmodelElementCollection',
      idShort: 'input',
      value: [{
        modelType: 'Operation',
        idShort: 'nested',
        outputVariables: [{ value: { modelType: 'Property', valueType: 'xs:string', value: 'ok' } }],
      }],
    },
  }],
  inoutputVariables: null,
  outputVariables: null,
}

describe('OperationTreeUtils', () => {
  it('round-trips strict operation locators', () => {
    const locator = ['inputVariables', 0, 'value', 'value', 0, 'outputVariables', 0, 'value'] as const
    const fragment = serializeOperationLocator([...locator])

    expect(fragment).toBe('/inputVariables/0/value/value/0/outputVariables/0/value')
    expect(parseOperationLocator(fragment)).toEqual(locator)
  })

  it.each([
    'inputVariables/0/value',
    '/inputVariables/01/value',
    '/inputVariables/-1/value',
    '/inputVariables/0/idShort',
    '/constructor/0/value',
  ])('rejects malformed or unsupported locator %s', fragment => {
    expect(parseOperationLocator(fragment)).toBeNull()
  })

  it('resolves nested containers and nested Operations through allowed transitions', () => {
    const locator = parseOperationLocator('/inputVariables/0/value/value/0/outputVariables/0/value')!
    expect(resolveOperationLocator(operation, locator)).toMatchObject({
      modelType: 'Property',
      value: 'ok',
    })
  })

  it('rejects transitions that do not match the current model type', () => {
    const locator = parseOperationLocator('/inputVariables/0/value/statements/0')!
    expect(resolveOperationLocator(operation, locator)).toBeNull()
  })

  it('decorates direct variables with selection and persistence metadata', () => {
    const value = operation.inputVariables[0].value
    const locator = parseOperationLocator('/inputVariables/0/value')!
    const node = decorateResolvedOperationNode(value, '/operations/op', locator)

    expect(node.selectionKey).toBe('/operations/op#/inputVariables/0/value')
    expect(node.persistence.operationPath).toBe('/operations/op')
    expect(node.operationVariableDirection).toBe('inputVariables')
    expect(node.operationVariableIndex).toBe(0)
    expect(node.isDirectOperationVariable).toBe(true)
  })

  it('strips every synthetic tree field before copying or persistence', () => {
    const boundary = createOperationPersistenceBoundary('/operations/op', ['inputVariables', 0, 'value'], {})
    const cleaned = stripTreeMetadata({
      modelType: 'Property',
      valueType: 'xs:string',
      value: 'ok',
      children: [],
      parent: operation,
      path: 'synthetic',
      selectionKey: 'synthetic',
      persistence: boundary,
      operationVariableDirection: 'inputVariables',
      operationVariableIndex: 0,
      isDirectOperationVariable: true,
      validationError: 'Duplicate idShort',
    })

    expect(cleaned).toEqual({ modelType: 'Property', valueType: 'xs:string', value: 'ok' })
  })

  it('maps a structured Core validation path to its owning tree node', () => {
    const locator = verificationPathToOperationLocator(
      operation,
      '.inputVariables[0].value.value[0].outputVariables[0].value.value',
    )

    expect(locator).toEqual([
      'inputVariables', 0, 'value', 'value', 0, 'outputVariables', 0, 'value',
    ])
  })

  it('updates one Operation-owned tree node without rebuilding the tree', () => {
    const locator = parseOperationLocator('/inputVariables/0/value')!
    const existing = decorateResolvedOperationNode(
      { modelType: 'Property', idShort: 'input', valueType: 'xs:boolean', value: 'false' },
      '/operations/op',
      locator,
    )
    const sibling = { selectionKey: '/operations/other', value: 'unchanged' }
    const tree: any[] = [{
      selectionKey: '/operations/op',
      children: [existing, sibling],
    }]
    const updated = decorateResolvedOperationNode(
      { modelType: 'Property', idShort: 'input', valueType: 'xs:boolean', value: 'true' },
      '/operations/op',
      locator,
    )
    const treeIdentity = tree[0]
    const nodeIdentity = existing

    expect(synchronizeOperationOwnedTreeNode(tree, updated)).toBe(true)
    expect(tree[0]).toBe(treeIdentity)
    const [updatedTreeNode, updatedSibling] = tree[0].children
    expect(updatedTreeNode).toBe(nodeIdentity)
    expect(updatedTreeNode.value).toBe('true')
    expect(updatedTreeNode.persistence).toEqual(updated.persistence)
    expect(updatedSibling).toBe(sibling)
  })
})
