# ABAC Policy Editor

The ABAC module manages attribute-based access-control policies for connected
BaSyx services. Policies define who can perform which actions on which resources,
and the conditions under which access is granted. The module requires an
authenticated session and a service that provides the ABAC management API.

## Capabilities

- Browse policy versions and their active or staged status.
- Import a complete policy, clone a version, and copy or download policy JSON.
- Validate, activate, or discard staged policies.
- Create, update, duplicate, reorder, enable/disable, and delete rules.
- Create, update, and delete reusable attribute, ACL, object, and formula definitions.
- See where definitions are used. Definitions still referenced by rules or other
  definitions are protected from deletion.
- Inspect configured and materialized rule JSON, and view definition JSON.
- Edit policies, rules, and definitions using guided forms or JSON.
- Use English or German labels and contextual help linked to the specification.

Definition names and categories are fixed during updates. Rule order can be
changed through the rule actions or by reordering rules within a policy form.

## Form and JSON editing

Guided forms cover common policy structures. The JSON editor remains available
for constructs the forms do not support.

Switching to Form is allowed only when the form can preserve the document without
changing its content. Unsupported JSON stays available for editing, with an
explanation of why Form mode is unavailable. If a form edit produces unsupported
content, the draft is retained and the editor switches to JSON. While editing JSON,
the explanation updates after a short typing pause and clears when the form can
represent the document again. This check does not switch modes or rewrite input.

Switching modes within a dialog preserves the draft and each mode's scroll
position. Previously opened form rows retain their nested state when collapsed
and reopened. Opening a different editing session starts with fresh view state.

During policy import, reference suggestions and definition-usage checks include
unsaved definitions and rules in that policy.

### Supported form content

| Area | Supported content |
| --- | --- |
| Attributes | Token claims, global values, referenced sources, and reusable attribute collections |
| Access control | Inline or referenced ACLs, access decisions, rights, and attribute constraints |
| Resources | Identifiable/referable elements, fragments, descriptors, route patterns, and reusable object collections; object definitions can combine inline entries and collection references |
| Comparisons | Equals, not equals, greater/less than, inclusive comparisons, contains, starts with, ends with, and pattern matching |
| Operands | Attribute and field sources; text, numeric, hex, date/time, time, and boolean literals |
| Combined conditions | AND, OR, negation, nested Match groups, and TRUE/FALSE constants |
| Fragment filters | Multiple ordered filters, each with an inline condition or a reusable formula |
| Complete policies | Reusable definitions and ordered rules using the same form controls |

Object entries offer compact identifier formats with separate identifier/path
inputs and free-text route patterns. Object fragments and filter fragments share
a target selector and editable, target-specific path suggestions. Submodel Element
fragments also accept an optional indexed idShort path or the whole element.
Field-path suggestions use standard property names, not discovered resource data.
Custom selectors remain available; schema validation still applies to typed values.
The rights menu includes Toggle all to select or clear the concrete rights; the `ALL` wildcard
remains a separate choice and is preserved when editing existing policies.

Fragment filters appear as a collapsible list under Advanced. Add filter opens
only the new entry; existing rows retain their expansion state. Untouched `FILTER`
and `FILTERLIST` fields keep their original representation, including when another
rule field is edited. The first filter change writes `FILTERLIST` and removes the
legacy `FILTER`; a single remaining entry stays in the list. Removing the final
filter removes both fields. When both are supplied, list entries precede the single
filter, matching backend order. Filters for the same fragment within one rule must
all pass. Unsupported filter expressions or extra properties remain JSON-only.

Operand menus follow the pinned schema when offering new type combinations.
Boolean operands are limited to equality comparisons; string operators accept
text-compatible sources with at least one non-field operand. The other operand
determines compatible literal types and global attributes. Existing values remain
visible when changing the operator makes them incompatible, so they can be corrected without losing their contents.
Existing backend extensions remain preserved and can receive schema advisories.

The Operator and Negated controls represent negation together. Existing `$ne`
and nested `$not` expressions retain their meaning. Editing a condition may normalize
these expressions to an equivalent representation. Within Match groups, the
form offers comparisons and nested Match groups; only Equals can be negated.
Delete controls preserve the required group sizes: two conditions for AND/OR and
one for Match.

Policy imports require nonblank string names for definitions, matching the
standalone definition dialog. Invalid definition identity blocks import; schema
constraints remain advisory.

Policies without `rules` and object definitions without `objects`/`USEOBJECTS`
open with empty form controls. Missing properties remain absent until a rule,
object entry, or collection reference is added. Schema advisories still report
required content. Clearing the last object reference returns to an empty inline
object list.

The optional Source reference import field is currently hidden. Its retained API
support records audit metadata; it does not select a policy source.

### Form limitations

- **Value transformations:** casts (`$strCast`, `$numCast`, `$hexCast`,
  `$dateTimeCast`, `$timeCast`, `$boolCast`) and date extraction (`$dayOfWeek`,
  `$dayOfMonth`, `$month`, `$year`) require JSON editing.
- **Operand shapes:** scalar literals are supported. Nested transformations and
  unsupported object, array, or null operand values remain JSON-only.
- **Conflicting alternatives:** rule `ACL` with `USEACL`, rule `FORMULA` with
  `USEFORMULA` remain JSON-only.
  The form does not choose which alternative to discard.
- **Additional properties:** properties outside the fields edited by the form are
  preserved. Unsupported structures inside those fields can prevent Form mode.
- **Whole-policy editing:** if any contained definition or rule cannot be
  represented, the complete policy remains in JSON mode.
- **Detail views:** read-only details use JSON; there is no guided-form detail view.
- **Small screens:** deeply nested conditions can become cramped and field labels
  may truncate.

Being editable in a form does not mean a draft satisfies every schema constraint.
For example, the forms preserve combinations supported by the backend, including
rule `OBJECTS` with `USEOBJECTS`, ACL `ATTRIBUTES` with `USEATTRIBUTES`, and
attribute-definition `attributes` with `USEATTRIBUTES`. The pinned schema rejects
that last combination, so it produces an advisory even though it remains editable.

## Validation and saving

Local validation runs after a short pause while editing and checks the latest
draft again on submission.

- **Schema advisories** appear in amber and do not block saving. The server
  decides whether to accept the document. Technical details show the relevant
  JSON paths.
- **Blocking input errors**, such as invalid JSON, a non-object document, or a
  missing definition name, must be resolved before submission.
- **Backend failures** appear separately below advisories. Fields and sections
  are highlighted when the failure can be located reliably. Errors without a
  reliable location remain in the summary.

Root-level definition advisories highlight the definition's content section.
Clearing optional collection references, such as definition `USEATTRIBUTES` or
rule `USEOBJECTS`, removes the property from the form submission rather than
leaving an empty reference list. Explicit empty arrays
already present in JSON are preserved when opening the form without changing them.

For rule and definition updates, form edits describe the complete desired
document, including cleared fields. JSON updates allow partial input: omitted fields keep their current
values, `null` removes a field, and arrays replace the existing array in full.
Switching between forms and JSON preserves changes already made in the draft.

## Schema reference

The module uses the pinned IDTA access-rules schema. See the
[access-rules README](../../../schemas/access-rules/README.md) for the schema
source, generated types, and schema-update checklist, and the
[compatibility notes](../../../schemas/access-rules/compatibility-differences.md)
for differences between schema constraints and backend behavior.
