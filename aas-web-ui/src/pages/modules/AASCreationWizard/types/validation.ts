export type ValidationIssue = {
  path: string
  idShort: string
  message: string
}

export type ValidationResult = {
  isValid: boolean
  issues: ValidationIssue[]
}
