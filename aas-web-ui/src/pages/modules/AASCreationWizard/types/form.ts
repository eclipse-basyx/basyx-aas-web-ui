import type { LangString } from './template'

export type FormPrimitive = string | LangString[] | File | null

export type FormStateValue = FormPrimitive | FormStateObject | FormStateValue[]

export type FormStateObject = {
  [key: string]: FormStateValue
}
