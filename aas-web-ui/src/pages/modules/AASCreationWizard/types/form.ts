//  This form.ts describes the UI form state
import type { LangString } from './template'

export type RangeFormValue = {
  min: string
  max: string
}

export type FormPrimitive = string | LangString[] | File | RangeFormValue | null
export type FormStateValue = FormPrimitive | FormStateObject | FormStateValue[]

export type FormStateObject = {
  [key: string]: FormStateValue
}
