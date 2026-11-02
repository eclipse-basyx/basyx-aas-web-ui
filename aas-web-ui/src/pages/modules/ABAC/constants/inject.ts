import type { DefinitionDialogProps } from '../types/definitions'
import type { JsonErrorMessage } from '../types/json'
import type { PolicyFormContext } from '../types/policy'
import type { RuleDialogProps } from '../types/rules'
import type { ComputedRef, InjectionKey } from 'vue'

export const RULE_DIALOG_KEY: InjectionKey<(props: RuleDialogProps) => void> = Symbol('RULE_DIALOG')
export const DEFINITION_DIALOG_KEY: InjectionKey<(props: DefinitionDialogProps) => void> = Symbol('DEFINITION_DIALOG')
export const POLICY_FORM_CONTEXT_KEY: InjectionKey<PolicyFormContext> = Symbol('POLICY_FORM_CONTEXT')

export const FORM_DIAGNOSTICS_KEY: InjectionKey<ComputedRef<{ error?: JsonErrorMessage | null, advisory?: JsonErrorMessage | null }>> = Symbol('FORM_DIAGNOSTICS')
