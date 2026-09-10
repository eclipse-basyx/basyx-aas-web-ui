import type { DefinitionDialogProps } from '../components/definition/DefinitionDialog.vue'
import type { RuleDialogProps } from '../components/rule/RuleDialog.vue'
import type { InjectionKey } from 'vue'

export const RULE_DIALOG_KEY: InjectionKey<(props: RuleDialogProps) => void> = Symbol('RULE_DIALOG')
export const DEFINITION_DIALOG_KEY: InjectionKey<(props: DefinitionDialogProps) => void> = Symbol('DEFINITION_DIALOG')
