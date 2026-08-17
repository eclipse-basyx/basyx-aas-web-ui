/**
 * ABAC Formula Expression Types
 */

export interface AttributeValue {
  $attribute: { CLAIM: string } | { GLOBAL: 'LOCALNOW' | 'UTCNOW' | 'CLIENTNOW' | 'ANONYMOUS' } | { REFERENCE: string }
}

export interface FieldValue { $field: string }

export interface StrVal { $strVal: string }
export interface NumVal { $numVal: number }
export interface HexVal { $hexVal: string }
export interface DateTimeVal { $dateTimeVal: string }
export interface TimeVal { $timeVal: string }
export interface StrCast { $strCast: ValueExpression }
export interface NumCast { $numCast: ValueExpression }
export interface HexCast { $hexCast: ValueExpression }
export interface BoolCast { $boolCast: ValueExpression }
export interface DateTimeCast { $dateTimeCast: ValueExpression }
export interface TimeCast { $timeCast: ValueExpression }
export interface DayOfWeek { $dayOfWeek: ValueExpression }
export interface DayOfMonth { $dayOfMonth: ValueExpression }
export interface Month { $month: ValueExpression }
export interface Year { $year: ValueExpression }
export interface BoolValue { $boolean: boolean }

export type ValueExpression
  = | AttributeValue
    | FieldValue
    | BoolValue
    | StrVal
    | NumVal
    | HexVal
    | DateTimeVal
    | TimeVal
    | StrCast
    | NumCast
    | HexCast
    | BoolCast
    | DateTimeCast
    | TimeCast
    | DayOfWeek
    | DayOfMonth
    | Month
    | Year

export type StringValueExpression
  = | AttributeValue
    | FieldValue
    | StrCast
    | StrVal

export interface BoolExpression { $boolean: boolean }
export interface EqExpression { $eq: [ValueExpression, ValueExpression] }
export interface NeExpression { $ne: [ValueExpression, ValueExpression] }
export interface GtExpression { $gt: [ValueExpression, ValueExpression] }
export interface GeExpression { $ge: [ValueExpression, ValueExpression] }
export interface LtExpression { $lt: [ValueExpression, ValueExpression] }
export interface LeExpression { $le: [ValueExpression, ValueExpression] }

export type ComparisonExpression
  = | EqExpression
    | NeExpression
    | GtExpression
    | GeExpression
    | LtExpression
    | LeExpression

export interface AndExpression { $and: FormulaExpression[] }
export interface OrExpression { $or: FormulaExpression[] }
export interface NotExpression { $not: FormulaExpression }

export type LogicalExpression = AndExpression | OrExpression | NotExpression

export interface RegexExpression { $regex: [StringValueExpression, StringValueExpression] }
export interface ContainsExpression { $contains: [StringValueExpression, StringValueExpression] }
export interface StartsWithExpression { '$starts-with': [StringValueExpression, StringValueExpression] }
export interface EndsWithExpression { '$ends-with': [StringValueExpression, StringValueExpression] }

export type StringMatchExpression
  = | RegexExpression
    | ContainsExpression
    | StartsWithExpression
    | EndsWithExpression

export interface MatchEqExpression { $eq: [ValueExpression, ValueExpression] }
export interface MatchNeExpression { $ne: [ValueExpression, ValueExpression] }
export interface MatchGtExpression { $gt: [ValueExpression, ValueExpression] }
export interface MatchGeExpression { $ge: [ValueExpression, ValueExpression] }
export interface MatchLtExpression { $lt: [ValueExpression, ValueExpression] }
export interface MatchLeExpression { $le: [ValueExpression, ValueExpression] }
export interface MatchRegexExpression { $regex: [StringValueExpression, StringValueExpression] }
export interface MatchContainsExpression { $contains: [StringValueExpression, StringValueExpression] }
export interface MatchStartsWithExpression { '$starts-with': [StringValueExpression, StringValueExpression] }
export interface MatchEndsWithExpression { '$ends-with': [StringValueExpression, StringValueExpression] }
export interface MatchNestedExpression { $match: MatchExpression[] }

export type MatchExpression
  = | MatchEqExpression
    | MatchNeExpression
    | MatchGtExpression
    | MatchGeExpression
    | MatchLtExpression
    | MatchLeExpression
    | MatchRegexExpression
    | MatchContainsExpression
    | MatchStartsWithExpression
    | MatchEndsWithExpression
    | MatchNestedExpression

export interface MatchClause { $match: MatchExpression[] }

export type FormulaExpression
  = | BoolExpression
    | BoolCast
    | EqExpression
    | NeExpression
    | GtExpression
    | GeExpression
    | LtExpression
    | LeExpression
    | AndExpression
    | OrExpression
    | NotExpression
    | RegexExpression
    | ContainsExpression
    | StartsWithExpression
    | EndsWithExpression
    | MatchClause

export const FORMULA_OPERATORS = [
  '$boolean',
  '$boolCast',
  '$eq', '$ne', '$gt', '$ge', '$lt', '$le',
  '$and', '$or', '$not',
  '$regex', '$contains', '$starts-with', '$ends-with',
  '$match',
] as const

export type FormulaOperator = (typeof FORMULA_OPERATORS)[number]
