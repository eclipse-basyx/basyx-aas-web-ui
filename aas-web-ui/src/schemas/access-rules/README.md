## Access rules schema

- Source: [5eb746834d9c5353af751c9fc9d62df9e9b41b05](https://raw.githubusercontent.com/admin-shell-io/aas-specs-security/5eb746834d9c5353af751c9fc9d62df9e9b41b05/documentation/IDTA-01004/modules/ROOT/partials/json/aas-queries-and-access-rules-schema.json)
- Repository: admin-shell-io/aas-specs-security (IDTA).
- Copyright: Industrial Digital Twin Association e.V. (IDTA).
- License: CC BY 4.0; see [LICENSE.txt](LICENSE.txt).

## Access rules validation

The ABAC module uses this pinned schema for Monaco editor roots, advisory Ajv
validation, and generated TypeScript document types.

[Schema differences and compatibility review](compatibility-differences.md) contains
the backend comparison and a summary of Query Language schema differences.

## Schema-derived code

- [accessRules.generated.ts](types/accessRules.generated.ts): generated schema declarations.
- [definitions.ts](types/definitions.ts) and [expression.ts](types/expression.ts): category mappings,
  item types, and expression types. Formula operator keys are derived in
  [ABAC/constants/formula.ts](../../pages/modules/ABAC/constants/formula.ts).
- [accessRulesValidation.ts](validation/accessRulesValidation.ts): cached advisory Ajv validation.
- [formatSchemaIssues.ts](validation/formatSchemaIssues.ts): JSON-path formatting and
  bounded diagnostic messages, covered by
  [formatSchemaIssues.test.ts](validation/formatSchemaIssues.test.ts).
- [validationMessages.ts](validation/validationMessages.ts): localized schema diagnostics;
  the ABAC locale bundle includes these messages.
- [accessRulesEditorSchema.ts](validation/accessRulesEditorSchema.ts): editor roots and update adaptations,
  covered by [accessRulesEditorSchema.test.ts](validation/accessRulesEditorSchema.test.ts).

The ABAC module retains its UI components, validation hooks, API types, editor
templates, and backend-aware update detection.

## Generate access rules TypeScript types

Run from the `aas-web-ui` directory with Node 24:

```powershell
node src/schemas/access-rules/generate-types.ts
```

The script uses `json-schema-to-typescript` and writes
`src/schemas/access-rules/types/accessRules.generated.ts`. It checks
the pinned schema checksum and prepares generation-only compatibility adaptations
in memory; the upstream JSON schema remains unchanged.

Regeneration stops if the schema differs from the pinned checksum, reporting the
expected and actual SHA-256 values. Review the schema changes and generation
compatibility adaptations before updating the pinned checksum.

Generated declarations include an ESLint-disable header and remain checked by
`pnpm type-check`. After regenerating,
run `pnpm type-check` and `pnpm test:run src/pages/modules/ABAC src/schemas/access-rules`.

## Validation behavior

- [accessRulesEditorSchema.ts](validation/accessRulesEditorSchema.ts) derives editor roots. Create/view retain upstream definitions;
  update roots allow omissions and null deletions while preserving complete array items.
  Definition update editors omit `name` from editable properties because identity
  comes from the API path.
- [accessRulesValidation.ts](validation/accessRulesValidation.ts) validates complete documents, including the effective merged
  result for updates. It never coerces values, applies defaults, or removes properties.
  It observes draft-07 reference semantics: sibling keywords beside `$ref` are ignored.
- [formatSchemaIssues.ts](validation/formatSchemaIssues.ts) formats localized advisory errors with JSON paths. Schema-invalid objects remain submittable.
  Invalid JSON, non-object input, and missing/invalid definition identity remain hard
  failures. Displayed messages are capped at 50 plus a localized omitted count.
  Monaco handles editor diagnostic positions; no custom line highlights are applied.

There is no ABAC Zod generator or parallel handwritten validation schema.
TypeScript document types are generated from the pinned schema in
[accessRules.generated.ts](types/accessRules.generated.ts); schema aliases
in that folder select its roots.
`DEFINITION_SCHEMA_PROPERTIES` in [definitions.ts](types/definitions.ts) connects definition
category names to upstream schema properties. Generated item types and Ajv/Monaco
definition roots use this shared mapping.
See [generation instructions](#generate-access-rules-typescript-types)
for the Node 24 command to regenerate them.
`json-schema-to-typescript` generates the declarations. The wrapper checks the pinned
checksum and prepares an in-memory copy for generation: required-only branches inherit
their property schemas, exclusive property alternatives receive `never` siblings, and
draft-07 `$ref` siblings are ignored. These compatibility steps do not modify the source
file or runtime/editor schemas. Review them when changing the upstream snapshot.
Patterns, overlapping value alternatives, and exact unknown-property rejection remain
runtime Ajv checks; TypeScript structural typing cannot express all schema constraints.
Management API metadata remains handwritten. Backend documents and advisory submissions
use raw JSON types because they have not passed upstream validation.

## Update flow

Rules and definitions expose one Update action. `useUpdateRule` and
`useUpdateDefinition` select the existing backend PUT or PATCH operation.

The detectors in [utils/update.ts](../../pages/modules/ABAC/utils/update.ts) resolve recognized alternative
switches and build the replacement or patch payload. Their alternative groups are
selected explicitly to account for backend-supported coexistence.

- Omitted fields preserve existing values; explicit null deletes a field; arrays
  replace in full. Nested objects merge only when both old and new values are objects,
  matching the backend's merge implementation.
- Recognized exclusive-alternative switches remove an omitted old alternative while
  preserving other fields. Coexisting properties remain intact.
- Complete edited documents and inferred alternative switches use PUT with the
  effective merged document. Other changes use PATCH with a minimal change payload.
- An unchanged effective document sends no request, but the dialog still shows the
  normal update success message. Failed requests never fall back to the other method.
- Definition name and category remain fixed during updates; changing either requires
  a separate resource operation. An explicitly supplied name that differs from the
  existing name blocks submission with an identity error; omitting the name or
  supplying the existing name remains allowed.

Ajv validates the effective merged document while the dialogs retain the submitted
JSON object for the update hooks. Schema failures remain advisory; backend rejection
details appear beneath the editor with a localized failure snackbar.

See [schema differences](compatibility-differences.md)
for backend acceptance differences and merge semantics.

## When updating the pinned schema

Review the following dependencies even for a minor schema update; edits depend on
which schema properties or constraints changed:

- [accessRulesEditorSchema.ts](validation/accessRulesEditorSchema.ts) and [accessRulesValidation.ts](validation/accessRulesValidation.ts):
  editor roots, update adaptations, and complete-document validation.
- [definitions.ts](types/definitions.ts) and
  [expression.ts](types/expression.ts):
  definition category mapping and expression types. Also review
  [constants/formula.ts](../../pages/modules/ABAC/constants/formula.ts): operator keys
  are derived automatically, but schema changes may affect their consumers.
- [utils/update.ts](../../pages/modules/ABAC/utils/update.ts): expression keys, selected exclusive alternatives,
  and recognized nested contexts. Compare these with backend merge behavior before
  changing them; they intentionally preserve some combinations rejected by the schema.
- [constants/json.ts](../../pages/modules/ABAC/constants/json.ts): default editor templates
  may need changes when required fields or allowed values change.
- [generate-types.ts](generate-types.ts): pinned checksum
  and generation adaptations. Regenerate [accessRules.generated.ts](types/accessRules.generated.ts)
  after reviewing the source changes.
- ABAC's [type re-exports](../../pages/modules/ABAC/types/definitions.ts) usually remain
  unchanged. Its validation hooks should need edits only when the validation interface
  or update behavior changes, rather than for every schema revision.
- [formatSchemaIssues.ts](validation/formatSchemaIssues.ts): path formatting and
  diagnostic display limits. Review [validationMessages.ts](validation/validationMessages.ts)
  if newly supported schema constraints need additional localized messages.
- Regression coverage in [accessRulesValidation.test.ts](validation/accessRulesValidation.test.ts),
  [accessRulesEditorSchema.test.ts](validation/accessRulesEditorSchema.test.ts),
  [formatSchemaIssues.test.ts](validation/formatSchemaIssues.test.ts),
  [hooks/validation.test.ts](../../pages/modules/ABAC/hooks/validation.test.ts), and
  [utils/update.test.ts](../../pages/modules/ABAC/utils/update.test.ts), plus the
  [compatibility notes](compatibility-differences.md).
