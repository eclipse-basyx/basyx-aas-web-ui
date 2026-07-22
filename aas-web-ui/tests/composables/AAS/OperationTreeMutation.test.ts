import { jsonization, types } from '@aas-core-works/aas-core3.1-typescript'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOperationPersistenceBoundary } from '@/utils/AAS/OperationTreeUtils'

const mocks = vi.hoisted(() => ({
  fetchSme: vi.fn(),
  putSubmodelElement: vi.fn(),
  snackbar: vi.fn(),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    fetchSme: mocks.fetchSme,
    putSubmodelElement: mocks.putSubmodelElement,
    consumeLastRequestFailureStatus: vi.fn(),
    consumeLastRequestFailureDetails: vi.fn(),
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ dispatchSnackbar: mocks.snackbar }),
}))

function operationJson () {
  const property = new types.Property(types.DataTypeDefXsd.String)
  property.idShort = 'input'
  property.value = 'before'
  const operation = new types.Operation()
  operation.idShort = 'operation'
  operation.inputVariables = [new types.OperationVariable(property)]
  return jsonization.toJsonable(operation)
}

describe('OperationTreeMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchSme.mockResolvedValue(operationJson())
    mocks.putSubmodelElement.mockResolvedValue(true)
  })

  it('fetches and PUTs only the repository-backed owning Operation endpoint', async () => {
    const source = operationJson() as any
    const boundary = createOperationPersistenceBoundary(
      '/submodels/sm/submodel-elements/operation',
      ['inputVariables', 0, 'value'],
      source.inputVariables[0].value,
    )
    const { useOperationTreeMutation } = await import('@/composables/AAS/OperationTreeMutation')

    const result = await useOperationTreeMutation().mutateOperation(boundary, ({ target }) => {
      target.value = 'after'
    })

    expect(result.success).toBe(true)
    expect(mocks.fetchSme).toHaveBeenCalledOnce()
    expect(mocks.fetchSme).toHaveBeenCalledWith('/submodels/sm/submodel-elements/operation')
    expect(mocks.putSubmodelElement).toHaveBeenCalledOnce()
    expect(mocks.putSubmodelElement).toHaveBeenCalledWith(
      expect.objectContaining({ inputVariables: expect.any(Array) }),
      '/submodels/sm/submodel-elements/operation',
      true,
    )
    expect(mocks.putSubmodelElement.mock.calls[0][0].inputVariables[0].value.value).toBe('after')
  })

  it('aborts without a PUT when the target changed concurrently', async () => {
    const source = operationJson() as any
    const boundary = createOperationPersistenceBoundary(
      '/submodels/sm/submodel-elements/operation',
      ['inputVariables', 0, 'value'],
      source.inputVariables[0].value,
    )
    const changed = operationJson() as any
    changed.inputVariables[0].value.value = 'changed-on-server'
    mocks.fetchSme.mockResolvedValue(changed)
    const { useOperationTreeMutation } = await import('@/composables/AAS/OperationTreeMutation')

    const result = await useOperationTreeMutation().mutateOperation(boundary, ({ target }) => {
      target.value = 'local-change'
    })

    expect(result).toEqual({ success: false, conflict: true })
    expect(mocks.putSubmodelElement).not.toHaveBeenCalled()
  })

  it('serializes overlapping mutations for the same owning Operation', async () => {
    let releaseFirstPut: (() => void) | undefined
    mocks.putSubmodelElement
      .mockImplementationOnce(() => new Promise<boolean>(resolve => {
        releaseFirstPut = () => resolve(true)
      }))
      .mockResolvedValueOnce(true)

    const source = operationJson() as any
    const boundary = createOperationPersistenceBoundary(
      '/submodels/sm/submodel-elements/operation',
      ['inputVariables', 0, 'value'],
      source.inputVariables[0].value,
    )
    const { useOperationTreeMutation } = await import('@/composables/AAS/OperationTreeMutation')
    const mutation = useOperationTreeMutation()

    const first = mutation.mutateOperation(boundary, ({ target }) => {
      target.value = 'first'
    })
    await vi.waitFor(() => expect(mocks.putSubmodelElement).toHaveBeenCalledTimes(1))

    const second = mutation.mutateOperation(boundary, ({ target }) => {
      target.value = 'second'
    })
    await Promise.resolve()

    expect(mocks.fetchSme).toHaveBeenCalledTimes(1)
    releaseFirstPut?.()
    await first
    await second

    expect(mocks.fetchSme).toHaveBeenCalledTimes(2)
    expect(mocks.putSubmodelElement).toHaveBeenCalledTimes(2)
  })

  it('normalizes an emptied variable direction on the typed Operation before PUT', async () => {
    const source = operationJson() as any
    const boundary = createOperationPersistenceBoundary(
      '/submodels/sm/submodel-elements/operation',
      [],
      source,
    )
    const { useOperationTreeMutation } = await import('@/composables/AAS/OperationTreeMutation')

    const result = await useOperationTreeMutation().mutateOperation(boundary, ({ target }) => {
      target.inputVariables = []
    })

    expect(result.success).toBe(true)
    expect(mocks.putSubmodelElement.mock.calls[0][0].inputVariables).toBeNull()
  })
})
