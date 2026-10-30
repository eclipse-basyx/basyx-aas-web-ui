# Access-rule schema differences and compatibility

This document compares the pinned IDTA schema with the backend implementation and
records the separate Query Language schema differences.

## Baselines and evidence limits

- Frontend: untouched IDTA 3.1 JSON snapshot at `aas-web-ui/src/schemas/access-rules/aas-queries-and-access-rules-3.1.schema.json`.
- Schema commit: [`5eb746834d9c5353af751c9fc9d62df9e9b41b05`](https://github.com/admin-shell-io/aas-specs-security/commit/5eb746834d9c5353af751c9fc9d62df9e9b41b05), commit date `2026-07-21`.
- Backend commit: `91d31432f198f3b46fa1fa1a25a969b088792928`, commit date `2026-10-06`.
- Schema and backend revisions are independent. Recheck the comparison when either changes.
- Findings come from schema constraints and backend source. They distinguish decoding, materialization, and endpoint behavior; they are not an executed end-to-end acceptance matrix.
- Frontend validation follows JSON Schema only. Backend extensions may produce frontend advisories; schema-valid input can still fail backend processing. Neither condition changes the submitted raw data.

## Query Language schema differences

`../../pages/modules/queryLanguage/query-language.schema.json` remains independent. It is not identical to this snapshot. The summary below describes the compared snapshot. Regenerate the exact comparison
against the current files when deciding how to align the schemas.

Compared Query Language file SHA-256: `86beb6610e57143b14d41cb1b80c4064c6432fbcbd0512c06f5cf16b8b5c57f4`.

- Root: Query Language selects Query or AllAccessPermissionRules using oneOf; upstream requires an AllAccessPermissionRules envelope.
- standardString: Query Language uses minLength without the upstream character pattern.
- Identifier/reference patterns and date/time patterns differ.
- equalityComparisonItems and orderedComparisonItems use anyOf locally versus oneOf upstream.
- stringItems alternatives differ.
- logicalExpression: Query Language has no `$boolCast` property or corresponding oneOf branch.
- ACL USEATTRIBUTES: Query Language retains an array of strings; upstream and the backend use one string.


## Confirmed differences

In the table, grammar paths are relative to `internal/common/model/grammar`; security paths are relative to `internal/common/security`. Examples describe individual values or fragments, not necessarily complete valid policies.

| Area / JSON Schema location | Pinned schema | Backend implementation and consequence |
| --- | --- | --- |
| `definitions.standardString` | Nonempty restricted character class, which includes `$` | `standard_string.go`, `StandardString.UnmarshalJSON`: `^([^$].*\|)$` accepts empty/non-ASCII strings but rejects leading `$`. Example: empty string is backend-only; `$value` is schema-only. Go `.` does not match newline by default, so this pattern does not accept arbitrary multiline strings. |
| `attributeItem` | CLAIM, GLOBAL, REFERENCE only | `attribute_item.go`, `AttributeItem.UnmarshalJSON` additionally accepts CLAIMPATH. It validates nonempty RFC 6901 pointers and escape sequences. `/roles` is a backend extension. |
| CLAIMPATH formula operands | No CLAIMPATH representation | `logical_expression.go`, `validateComparisonItems` and `validateStringItems`: direct CLAIMPATH is allowed in `$eq` paired with `$strVal`/`$strCast`, or as the first `$contains` operand with a scalar-string second operand. Other direct positions/operators are rejected. |
| `stringItems` | At least one operand is a non-field string value | `logical_expression.go`, `validateStringItems` accepts two string-value operands without imposing that field/non-field distinction, aside from CLAIMPATH restrictions. Two valid `$field` operands can decode even though the schema rejects that pairing for string matching. |
| `objectItem` values | Compact strings | `object_item.go`, `ObjectItem.UnmarshalJSON` also accepts structured Route/Identifiable/Referable/Fragment/Descriptor objects. These extensions are not added to frontend validation. |
| Compact identifier patterns | Fixed character classes and syntax | `object_item.go`, `reIdentifiable`, `reReferable`, `reDescriptor`: whitespace is tolerated and quoted instances accept any non-quote character. For example a percent sign in an instance differs from the schema's restricted class. |
| `objectItem.FRAGMENT` / `FragmentIdentifier` | FragmentIdentifier references FragmentFieldIdentifier | `object_item.go`, `parseFragment` uses a compact SME instance plus path and fragment strings. The published schema and backend describe different forms; the pinned upstream artifact remains unchanged. |
| `objectItem.ROUTE` | Any string, including empty/whitespace | `object_item.go`, `parseRoute` trims the string and rejects an empty result. Structured fallback is a separate decoding path and does not call this parser. |
| `ReferenceIdentifier` | Anchored pattern, no surrounding whitespace | `identifier_patterns.go`, `ValidateReferenceIdentifier` trims before checking. Surrounding whitespace can be backend-valid but schema-invalid. |
| `FieldIdentifier` | No `$bd` field family | `fieldidentifier_processing.go` supports `$bd#...` fields, including `createdAt` in the backend fixtures. This is a backend extension, not an upstream schema addition. |
| `DEFATTRIBUTES.items` | Exactly one of attributes/USEATTRIBUTES | `access_rule_model_schema_json_all_access_permission_rules_def_attributes_e_lem.go` requires at least one and permits both. In contrast DEFOBJECTS enforces exactly one, matching the pinned schema. |
| Definition names | String required, no nonblank/uniqueness rule | `abac_engine_materialization.go`, `buildDefinitionIndex` trims names, rejects empty names, and rejects duplicates within each kind. `a` and ` a ` collide. |
| Rule ACL/USEACL and FORMULA/USEFORMULA; filter CONDITION/USEFORMULA | Exclusivity uses property presence | `access_permission_rule.go` and `access_permission_rule_filter.go` treat whitespace-only reference strings as unset and nil pointers as absent. Presence and semantic availability are not equivalent. |
| ACL attributes | Schema requires ATTRIBUTES or USEATTRIBUTES | `acl.go` is a struct without that custom presence check. `abac_engine_materialization.go`, `materializeRule` gathers either source if present without requiring one. Attribute-free ACLs therefore pass this materialization step. |
| Missing/null collection fields | Schema enforces required keys and array types | Go slices/pointers can decode null as nil. For example `rules: null` passes the top-level decoder's key-presence check but fails JSON Schema. `OBJECTS`/`USEOBJECTS` presence is checked on the raw map; downstream meaning depends on materialization. Do not generalize null acceptance to every field or endpoint. |
| Empty comparison arrays | Exactly two operands | `logical_expression.go`, comparison/string validation helpers return early for zero-length slices. A single-member expression such as `{"$eq":[]}` can pass that decoding path. This is a decoding discrepancy; successful evaluation is not claimed. |
| `dateTimeLiteralPattern` | Allows timezone omission, extended/negative years, end-of-day `24:00:00`; checks day range but not month-specific calendar validity | `date_time_literal_pattern.go` uses `time.Parse(time.RFC3339Nano, ...)`. It requires a timezone and ordinary RFC3339 year/time shape, rejects hour 24 and impossible calendar dates. `2025-02-29T12:00:00Z` passes the schema pattern but fails Go parsing. |
| `timeLiteralPattern` | Timezone optional and hour 24 allowed in the specified zero form | `time_literal_pattern.go` uses the Go layout `15:04:05.999999999Z07:00`, requiring a zone and rejecting hour 24. |
| Expression complexity | No explicit depth/token budget | `query_complexity.go` enforces 64 JSON container levels and 8192 decoder tokens. These are backend implementation limits, not extra frontend schema conditions. |
| Policy references | Strings and structure only | `abac_engine_materialization.go` resolves references and rejects missing targets; recursive attribute/object resolution detects cycles along traversed paths. This is not a claim that every unused cyclic definition is eagerly rejected. |

### Parser boundaries requiring runtime verification

Comma fractions, single-digit hours, and timezone offsets outside the schema's
+/-14:00 bound depend on Go's time parser. Their acceptance has not been verified
against the project's Go toolchain and should not be treated as confirmed differences.

## Agreements and scope boundaries

- Rules require an ACL alternative, a formula alternative, and an object source. Rule OBJECTS and USEOBJECTS may coexist; ACL ATTRIBUTES and USEATTRIBUTES may coexist.
- DEFOBJECTS alternatives remain exclusive. Do not automatically generalize the DEFATTRIBUTES discrepancy to them.
- Backend expression decoding checks a single operator and imposes minimum sizes on non-nil `$and`, `$or`, and `$match` arrays. Equality/ordered comparison shape counting uses exactly one matching shape; it should not be replaced with a general permissive union.
- JSON Schema acceptance is not full specification conformance. Calendar semantics, reference resolution, and runtime authorization are separate concerns.

## PUT/PATCH behavior

`abacpolicy/draft_rules.go` (`ReplaceRule`, `PatchRule`, `mergeJSONObjects`) and
`abacpolicy/draft_definitions.go` (`ReplaceDefinition`, `PatchDefinition`, `mergeDefinitionPatch`)
remain separate operations. PUT supplies a complete replacement. PATCH preserves omitted
members, deletes explicit null members visited by the merge, and replaces arrays.
The merge only recurses when both old and new members are objects; an object inserted
where no old object exists is assigned as-is, including nested nulls. Therefore it
must not be described as an unrestricted implementation of every RFC merge-patch case.
Definition category is selected by the endpoint, not converted by the JSON payload.

## Frontend behavior

- Ajv uses draft-07 reference semantics (`ignoreKeywordsWithRef`): sibling keywords
  beside `$ref` are ignored without changing the pinned schema.
- Invalid JSON, non-object input, and missing, null, numeric, or blank definition
  names block submission. During updates, an explicitly supplied name must match
  the existing resource name; omitted names are reattached from that resource.
  Other schema errors remain advisory.
- Localized validation messages retain JSON paths. Monaco supplies editor diagnostic
  positions; ABAC does not calculate line numbers or add custom line highlights.
- Nested alternatives can produce many Ajv issues. Display is capped at 50 messages
  plus a localized omitted count. This limits presentation, not validation cost.
- Dialogs capture their error and schema-validation translations when creating the
  validation hooks. Compiled Ajv validators are reused independently of the message
  bundles. Changing locale while a dialog is mounted does not refresh those captured
  translations; this behavior is accepted by the frontend.
- Update detection selects PUT, PATCH, or no request. Regression cases cover omitted
  fields, null deletion, array replacement, recognized alternative switches,
  coexisting fields, and definition category preservation.
- Document types are generated by `json-schema-to-typescript`. Generation adapts
  required-property alternatives and draft-07 references in memory; runtime/editor
  schemas remain unchanged. See [generation instructions](README.md#generate-access-rules-typescript-types).

ABAC uses the pinned schema independently of the Query Language copy. The summarized
differences do not change ABAC validation.

## Sources

All backend paths above refer to [this pinned backend tree](https://github.com/eclipse-basyx/basyx-go-components/tree/91d31432f198f3b46fa1fa1a25a969b088792928/internal/common).
Schema provenance remains in the [shared schema README](README.md).
