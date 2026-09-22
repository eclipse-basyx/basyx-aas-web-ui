# AAS editor schema

`aas-3.1.schema.json` is an unmodified copy of the IDTA AAS metamodel v3.1.2 schema.

- Source: https://github.com/admin-shell-io/aas-specs-metamodel/blob/a93e41c07c4018e864cba6016b760b9c7e0d849f/schemas/json/aas.json
- Copyright: Industrial Digital Twin Association e.V. (IDTA).
- License: Creative Commons Attribution 4.0 International; see `LICENSE.txt`.

`aasEditorSchema.ts` derives editor roots for Submodel and SubmodelElement insertion. These adapters replace the Environment root and schema identifier; they do not change the vendored definitions. Schema diagnostics assist editing; the existing AAS Core deserialization and parent compatibility checks still govern saving.
