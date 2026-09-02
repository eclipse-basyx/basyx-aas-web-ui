import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker?worker'
import { jsonDefaults } from 'monaco-editor/languages/features/json/register'
import {
  QUERY_LANGUAGE_SCHEMA_URI,
  queryLanguageSchema,
} from '@/pages/modules/queryLanguage/queryLanguageSchema'
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

const workerEnvironment = globalThis as typeof globalThis & MonacoWorkerEnvironment
workerEnvironment.MonacoEnvironment ??= {
  getWorker (_moduleId: string, label: string): Worker {
    return label === 'json' ? new jsonWorker() : new editorWorker()
  },
}

export function configureQueryLanguageDiagnostics (modelUri: string): void {
  jsonDefaults.setDiagnosticsOptions({
    allowComments: false,
    comments: 'error',
    enableSchemaRequest: false,
    schemaRequest: 'error',
    schemaValidation: 'error',
    schemas: [
      {
        fileMatch: [modelUri],
        schema: queryLanguageSchema,
        uri: QUERY_LANGUAGE_SCHEMA_URI,
      },
    ],
    trailingCommas: 'error',
    validate: true,
  })
}

export * as monaco from 'monaco-editor/editor/editor.api'
