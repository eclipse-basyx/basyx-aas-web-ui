import type { Uri } from 'monaco-editor'
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker?worker'
import {
  getWorker,
  type IJSONWorker,
  jsonDefaults,
} from 'monaco-editor/languages/features/json/register'
import {
  hasQueryLanguageSchemaRegistration,
  mergeQueryLanguageSchemaRegistration,
} from '@/pages/modules/queryLanguage/queryLanguageDiagnostics'
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching'
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard'
import 'monaco-editor/editor/contrib/codeAction/browser/codeActionContributions'
import 'monaco-editor/editor/contrib/contextmenu/browser/contextmenu'
import 'monaco-editor/editor/contrib/find/browser/findController'
import 'monaco-editor/editor/contrib/folding/browser/folding'
import 'monaco-editor/editor/contrib/format/browser/formatActions'
import 'monaco-editor/editor/contrib/gotoError/browser/gotoError'
import 'monaco-editor/editor/contrib/hover/browser/hoverContribution'
import 'monaco-editor/editor/contrib/linesOperations/browser/linesOperations'
import 'monaco-editor/editor/contrib/snippet/browser/snippetController2'
import 'monaco-editor/editor/contrib/suggest/browser/suggestController'
import 'monaco-editor/editor/contrib/wordOperations/browser/wordOperations'

interface MonacoWorkerEnvironment {
  MonacoEnvironment?: {
    getWorker: (_moduleId: string, label: string) => Worker
  }
}

interface JSONDiagnostic {
  message: string
  range: {
    start: {
      character: number
      line: number
    }
  }
  severity?: number
}

interface JSONValidationWorker extends IJSONWorker {
  doValidation: (uri: string) => Promise<JSONDiagnostic[]>
}

export interface QueryLanguageError {
  column: number
  line: number
  message: string
}

const DIAGNOSTIC_SEVERITY_ERROR = 1

const workerEnvironment = globalThis as typeof globalThis & MonacoWorkerEnvironment
workerEnvironment.MonacoEnvironment ??= {
  getWorker (_moduleId: string, label: string): Worker {
    return label === 'json' ? new jsonWorker() : new editorWorker()
  },
}

export function configureQueryLanguageDiagnostics (): void {
  const currentOptions = jsonDefaults.diagnosticsOptions
  if (
    currentOptions.allowComments === false
    && currentOptions.comments === 'error'
    && currentOptions.enableSchemaRequest === false
    && currentOptions.schemaRequest === 'error'
    && currentOptions.schemaValidation === 'error'
    && currentOptions.trailingCommas === 'error'
    && currentOptions.validate === true
    && hasQueryLanguageSchemaRegistration(currentOptions.schemas)
  ) {
    return
  }

  jsonDefaults.setDiagnosticsOptions({
    ...currentOptions,
    allowComments: false,
    comments: 'error',
    enableSchemaRequest: false,
    schemaRequest: 'error',
    schemaValidation: 'error',
    schemas: mergeQueryLanguageSchemaRegistration(currentOptions.schemas),
    trailingCommas: 'error',
    validate: true,
  })
}

export async function validateQueryLanguageDocument (modelUri: Uri): Promise<QueryLanguageError[]> {
  const getJsonWorker = await getWorker()
  const worker = await getJsonWorker(modelUri) as JSONValidationWorker
  const diagnostics = await worker.doValidation(modelUri.toString())

  return diagnostics
    .filter(diagnostic => diagnostic.severity === DIAGNOSTIC_SEVERITY_ERROR)
    .map(diagnostic => ({
      column: diagnostic.range.start.character + 1,
      line: diagnostic.range.start.line + 1,
      message: diagnostic.message,
    }))
}

export * as monaco from 'monaco-editor/editor/editor.api'
