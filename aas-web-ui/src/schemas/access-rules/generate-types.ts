import type { JSONSchema } from 'json-schema-to-typescript'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { compile } from 'json-schema-to-typescript'

const sourcePath = new URL('aas-queries-and-access-rules-3.2.schema.json', import.meta.url)
const outputPath = new URL('types/accessRules.generated.ts', import.meta.url)
const bytes = readFileSync(sourcePath)
const checksum = createHash('sha256').update(bytes).digest('hex')
const pinnedChecksum = 'cb8ac7c7eecc21e0c8e4d0655428c9a583faf49b4e50c86de5b7159026475030'

if (checksum !== pinnedChecksum) {
  throw new Error(`The upstream schema changed. Review the generation compatibility step and checksum before regenerating types.\nExpected SHA-256: ${pinnedChecksum}\nActual SHA-256: ${checksum}`)
}

/**
 * Recursively builds a generation-only schema copy for json-schema-to-typescript.
 * Generation only: the library does not inherit property schemas into required-only branches or enforce oneOf exclusivity.
 * Keep those constraints explicit in its input.
 * Runtime validation and Monaco continue consuming the untouched upstream file.
 *
 * @param node Schema node to adapt for type generation.
 * @param inherited Property schemas inherited by required-only alternative branches.
 * @returns Adapted schema node for type generation.
 */
function prepare (node: JSONSchema, inherited: Record<string, JSONSchema> = {}): JSONSchema {
  // Draft-07 ignores sibling keywords beside $ref; the library otherwise merges them.
  if (node.$ref) {
    return { $ref: node.$ref }
  }

  const properties = node.properties ?? inherited
  const result: JSONSchema = { ...node }
  if (node.properties) {
    result.properties = Object.fromEntries(Object.entries(node.properties).map(([key, value]) => [key, prepare(value)]))
  }
  if (node.definitions) {
    result.definitions = Object.fromEntries(Object.entries(node.definitions).map(([key, value]) => [key, prepare(value)]))
  }
  if (node.items) {
    result.items = Array.isArray(node.items) ? node.items.map(item => prepare(item)) : prepare(node.items)
  }
  for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
    const branches = node[keyword]
    if (!branches) {
      continue
    }
    const presenceOnly = branches.every(branch => Object.keys(branch).length === 1 && Array.isArray(branch.required))
    const names = [...new Set(branches.flatMap(branch => Array.isArray(branch.required) ? branch.required : []))]
    result[keyword] = branches.map(branch => {
      if (!presenceOnly) {
        return prepare(branch, properties)
      }

      const required = Array.isArray(branch.required) ? branch.required : []
      const branchProperties: Record<string, JSONSchema> = { ...properties }
      if (keyword === 'oneOf') {
        for (const name of names) {
          if (!required.includes(name)) {
            // tsType is the library's generation extension, not a validator keyword.
            branchProperties[name] = { tsType: 'never' }
          }
        }
      }

      return prepare({
        type: 'object',
        additionalProperties: false,
        properties: branchProperties,
        required,
      }, properties)
    })
  }
  return result
}

const source = prepare(JSON.parse(bytes.toString('utf8')) as JSONSchema)
source.title = 'AccessRulesPolicy'
const declarations = await compile(source, 'AccessRulesPolicy', {
  bannerComment: `/* eslint-disable -- Generated declarations use the library's formatting and are checked by vue-tsc. */
// Generated with json-schema-to-typescript by src/schemas/access-rules/generate-types.ts. Do not edit.
// Source: IDTA 3.2 working draft, commit 0171f14ceb32bc396653100b5a9a93cf2c984e79 (CC BY 4.0).
// SHA-256: ${checksum}
// Patterns and overlapping oneOf value alternatives remain Ajv runtime constraints.`,
  customName: (_schema, key) => key ? key.charAt(0).toUpperCase() + key.slice(1) : undefined,
  style: { semi: false, singleQuote: true, tabWidth: 2, trailingComma: 'none' },
})
writeFileSync(outputPath, declarations, 'utf8')
