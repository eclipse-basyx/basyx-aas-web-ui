export const enValidationMessages = {
  schemaMoreIssues: '{count} additional schema diagnostics omitted',
  schemaEnum: 'Use one of these values: {values}',
  schemaPattern: 'Value does not match the format defined by the access-rule schema',
  schemaMinItems: 'Provide at least {count} items',
  schemaMaxItems: 'Provide no more than {count} items',
  schemaOneOf: 'Provide exactly one of the allowed alternatives',
  schemaAnyOf: 'Provide at least one of the allowed alternatives',
  schemaRequired: 'Required property is missing',
  schemaAdditional: 'Property is not allowed by the schema',
  schemaType: 'Expected type: {type}',
  schemaConstraint: 'Does not satisfy schema constraint: {keyword}',
}

export type SchemaValidationMessages = typeof enValidationMessages

export const deValidationMessages: SchemaValidationMessages = {
  schemaMoreIssues: '{count} weitere Schema-Diagnosen ausgeblendet',
  schemaEnum: 'Einen dieser Werte verwenden: {values}',
  schemaPattern: 'Wert entspricht nicht dem Format des Access-Rule-Schemas',
  schemaMinItems: 'Mindestens {count} Eintraege angeben',
  schemaMaxItems: 'Hoechstens {count} Eintraege angeben',
  schemaOneOf: 'Genau eine der erlaubten Alternativen angeben',
  schemaAnyOf: 'Mindestens eine der erlaubten Alternativen angeben',
  schemaRequired: 'Erforderliche Eigenschaft fehlt',
  schemaAdditional: 'Eigenschaft ist im Schema nicht erlaubt',
  schemaType: 'Erwarteter Typ: {type}',
  schemaConstraint: 'Schema-Bedingung nicht erfuellt: {keyword}',
}
