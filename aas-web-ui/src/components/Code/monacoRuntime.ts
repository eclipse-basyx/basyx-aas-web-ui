import type { Uri } from 'monaco-editor'
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker?worker'
import {
  getWorker,
  type IJSONWorker,
  jsonDefaults,
} from 'monaco-editor/languages/features/json/register'
import { type CodeSchema, mergeCodeSchemas } from './codeSchema'
import 'monaco-editor/languages/definitions/xml/register'
// Monaco 0.56's JSON worker manager imports all editor features itself. Register
// them before creating an editor so their singleton services are available too.
// This stays inside the lazy runtime and does not load additional languages.
import 'monaco-editor/features/register.all'

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

export interface CodeDiagnostic {
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

export function configureJsonDiagnostics (schemas: readonly CodeSchema[] = []): void {
  const currentOptions = jsonDefaults.diagnosticsOptions
  const merged = mergeCodeSchemas(currentOptions.schemas || [], schemas)
  if (currentOptions.validate === true && currentOptions.allowComments === false
    && currentOptions.comments === 'error'
    && currentOptions.trailingCommas === 'error'
    && currentOptions.schemaRequest === 'error'
    && currentOptions.schemaValidation === 'error'
    && currentOptions.enableSchemaRequest === false
    && merged.length === currentOptions.schemas?.length
    && merged.every((schema, index) => schema === currentOptions.schemas?.[index])) {
    return
  }

  jsonDefaults.setDiagnosticsOptions({
    ...currentOptions,
    allowComments: false,
    comments: 'error',
    enableSchemaRequest: false,
    schemaRequest: 'error',
    schemaValidation: 'error',
    schemas: merged,
    trailingCommas: 'error',
    validate: true,
  })
}

export async function validateJsonDocument (modelUri: Uri): Promise<CodeDiagnostic[]> {
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

export * as monaco from 'monaco-editor/editor'
