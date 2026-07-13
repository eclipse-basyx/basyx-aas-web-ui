import type { VerificationIssue } from '@/composables/MetamodelVerification'
import type { OperationNodeLocator, OperationPersistenceBoundary } from '@/types/OperationTree'
import type { JsonValue } from '@aas-core-works/aas-core3.1-typescript/jsonization'
import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
import { buildVerificationSummary, verifyForEditor } from '@/composables/MetamodelVerification'
import { useNavigationStore } from '@/store/NavigationStore'
import {
  canonicalTreeElementJson,
  resolveOperationLocator,
  stripTreeMetadata,
} from '@/utils/AAS/OperationTreeUtils'

type UnknownRecord = Record<string, any>

export interface OperationMutationContext {
  operation: UnknownRecord
  target: UnknownRecord
  locator: OperationNodeLocator
}

export interface OperationMutationResult {
  success: boolean
  conflict?: boolean
  issues?: VerificationIssue[]
}

export interface OperationMutationOptions {
  checkExpectedTarget?: boolean
  expectedTargetJson?: string
  failureTitle?: string
  targetSnapshot?: (target: UnknownRecord) => unknown
}

const mutationQueues = new Map<string, Promise<void>>()

export function useOperationTreeMutation () {
  const navigationStore = useNavigationStore()
  const {
    fetchSme,
    putSubmodelElement,
    consumeLastRequestFailureStatus,
    consumeLastRequestFailureDetails,
  } = useSMRepositoryClient()

  async function mutateOperation (
    boundary: OperationPersistenceBoundary,
    mutate: (context: OperationMutationContext) => boolean | void,
    options: OperationMutationOptions = {},
  ): Promise<OperationMutationResult> {
    const previousMutation = mutationQueues.get(boundary.operationPath) ?? Promise.resolve()
    const queuedMutation = previousMutation
      .catch(() => undefined)
      .then(() => performMutation(boundary, mutate, options))
    const queueTail = queuedMutation.then(() => undefined, () => undefined)
    mutationQueues.set(boundary.operationPath, queueTail)

    return queuedMutation.finally(() => {
      if (mutationQueues.get(boundary.operationPath) === queueTail) {
        mutationQueues.delete(boundary.operationPath)
      }
    })
  }

  async function performMutation (
    boundary: OperationPersistenceBoundary,
    mutation: (context: OperationMutationContext) => boolean | void,
    options: OperationMutationOptions,
  ): Promise<OperationMutationResult> {
    const latestJson = stripTreeMetadata(await fetchSme(boundary.operationPath))
    if (!latestJson || typeof latestJson !== 'object' || Array.isArray(latestJson)) {
      showError('Unable to load the owning Operation.', 'The Operation was not changed.')
      return { success: false }
    }

    const operationJson = structuredClone(latestJson) as UnknownRecord
    if (operationJson.modelType !== 'Operation') {
      showError('Unable to update Operation variable.', 'The persistence boundary is not an Operation.')
      return { success: false }
    }

    const target = resolveOperationLocator(operationJson, boundary.locator)
    if (!target) {
      showConflict()
      return { success: false, conflict: true }
    }

    const expectedTargetJson = options.expectedTargetJson ?? boundary.expectedJson
    const targetSnapshot = options.targetSnapshot ? options.targetSnapshot(target) : target
    if (
      options.checkExpectedTarget !== false
      && expectedTargetJson !== ''
      && canonicalTreeElementJson(targetSnapshot) !== expectedTargetJson
    ) {
      showConflict()
      return { success: false, conflict: true }
    }

    const shouldContinue = mutation({ operation: operationJson, target, locator: [...boundary.locator] })
    if (shouldContinue === false) {
      return { success: false }
    }

    normalizeOperationVariables(operationJson)

    const duplicateIdShorts = findDuplicateOperationVariableIdShorts(operationJson)
    if (duplicateIdShorts.length > 0) {
      showError(
        options.failureTitle ?? 'Operation validation failed.',
        `Variable idShorts must be unique across Input, In/Out, and Output: ${duplicateIdShorts.join(', ')}.`,
      )
      return { success: false }
    }

    const parsed = jsonization.operationFromJsonable(operationJson as JsonValue)
    if (parsed.error !== null) {
      showError(
        options.failureTitle ?? 'Operation validation failed.',
        parsed.error.message || String(parsed.error),
      )
      return { success: false }
    }

    const operation = parsed.mustValue()
    const verificationResult = verifyForEditor(operation, { maxErrors: 20 })
    if (!verificationResult.isValid) {
      const summary = buildVerificationSummary(verificationResult)
      const firstError = verificationResult.globalErrors[0]
        ?? verificationResult.fieldErrors.values().next().value
        ?? ''
      showError(
        options.failureTitle ?? 'Operation validation failed.',
        firstError ? `${summary} ${firstError}` : summary,
      )
      return { success: false, issues: verificationResult.issues }
    }

    const updated = await putSubmodelElement(operation, boundary.operationPath, true)
    if (!updated) {
      const status = consumeLastRequestFailureStatus()
      const details = consumeLastRequestFailureDetails()
      const statusText = status ? ` HTTP ${status}.` : ''
      showError(
        options.failureTitle ?? 'Failed to update Operation.',
        `${details || 'The repository rejected the complete Operation update.'}${statusText}`,
      )
      return { success: false }
    }

    return { success: true }
  }

  function showConflict (): void {
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 8000,
      color: 'warning',
      btnColor: 'buttonText',
      baseError: 'The Operation changed while it was being edited.',
      extendedError: 'Reload the tree and try the action again. No changes were written.',
    })
  }

  function showError (baseError: string, extendedError: string): void {
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 10_000,
      color: 'error',
      btnColor: 'buttonText',
      baseError,
      extendedError,
    })
  }

  return { mutateOperation }
}

function normalizeOperationVariables (value: unknown): void {
  if (!value || typeof value !== 'object') {
    return
  }
  const record = value as UnknownRecord

  if (record.modelType === 'Operation') {
    for (const direction of ['inputVariables', 'inoutputVariables', 'outputVariables']) {
      const variables = record[direction]
      if (Array.isArray(variables)) {
        for (const variable of variables) {
          normalizeOperationVariables(variable?.value)
        }
        if (variables.length > 0) {
          record[direction] = variables
        } else {
          delete record[direction]
        }
      } else if (variables === null) {
        delete record[direction]
      }
    }
  }

  for (const key of ['value', 'statements', 'annotations']) {
    if (Array.isArray(record[key])) {
      for (const child of record[key]) {
        normalizeOperationVariables(child)
      }
    }
  }
}

function findDuplicateOperationVariableIdShorts (operation: UnknownRecord): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const direction of ['inputVariables', 'inoutputVariables', 'outputVariables']) {
    const variables = operation[direction]
    if (!Array.isArray(variables)) {
      continue
    }
    for (const variable of variables) {
      const idShort = variable?.value?.idShort
      if (typeof idShort !== 'string' || idShort === '') {
        continue
      }
      if (seen.has(idShort)) {
        duplicates.add(idShort)
      }
      seen.add(idShort)
    }
  }
  return [...duplicates]
}
