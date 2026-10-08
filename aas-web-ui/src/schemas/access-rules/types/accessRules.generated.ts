/* eslint-disable -- Generated declarations use the library's formatting and are checked by vue-tsc. */
// Generated with json-schema-to-typescript by src/schemas/access-rules/generate-types.ts. Do not edit.
// Source: IDTA 3.1, commit 5eb746834d9c5353af751c9fc9d62df9e9b41b05 (CC BY 4.0).
// SHA-256: 12a298f893dd137b0d0d92c76db32d938ff6006a89411f146537b05f460e83fb
// Patterns and overlapping oneOf value alternatives remain Ajv runtime constraints.

export type AttributeItem = {
  CLAIM?: string
  GLOBAL?: 'LOCALNOW' | 'UTCNOW' | 'CLIENTNOW' | 'ANONYMOUS'
  REFERENCE?: ReferenceIdentifier
} & AttributeItem1
export type ReferenceIdentifier = string
export type AttributeItem1 =
  | {
      CLAIM: string
      GLOBAL?: never
      REFERENCE?: never
    }
  | {
      CLAIM?: never
      GLOBAL: 'LOCALNOW' | 'UTCNOW' | 'CLIENTNOW' | 'ANONYMOUS'
      REFERENCE?: never
    }
  | {
      CLAIM?: never
      GLOBAL?: never
      REFERENCE: ReferenceIdentifier
    }
export type ACL = ACL1 & {
  ATTRIBUTES?: AttributeItem[]
  USEATTRIBUTES?: string
  RIGHTS: RightsEnum[]
  ACCESS: 'ALLOW' | 'DISABLED'
}
export type ACL1 =
  | {
      ATTRIBUTES: AttributeItem[]
      USEATTRIBUTES?: string
      RIGHTS?: RightsEnum[]
      ACCESS?: 'ALLOW' | 'DISABLED'
    }
  | {
      ATTRIBUTES?: AttributeItem[]
      USEATTRIBUTES: string
      RIGHTS?: RightsEnum[]
      ACCESS?: 'ALLOW' | 'DISABLED'
    }
export type RightsEnum = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'VIEW' | 'ALL'
export type ObjectItem = {
  ROUTE?: string
  IDENTIFIABLE?: IdentifiableIdentifier
  REFERABLE?: ReferableIdentifier
  FRAGMENT?: FragmentIdentifier
  DESCRIPTOR?: DescriptorIdentifier
} & ObjectItem1
export type IdentifiableIdentifier = string
export type ReferableIdentifier = string
export type FragmentIdentifier = string
export type DescriptorIdentifier = string
export type ObjectItem1 =
  | {
      ROUTE: string
      IDENTIFIABLE?: never
      REFERABLE?: never
      FRAGMENT?: never
      DESCRIPTOR?: never
    }
  | {
      ROUTE?: never
      IDENTIFIABLE: IdentifiableIdentifier
      REFERABLE?: never
      FRAGMENT?: never
      DESCRIPTOR?: never
    }
  | {
      ROUTE?: never
      IDENTIFIABLE?: never
      REFERABLE: ReferableIdentifier
      FRAGMENT?: never
      DESCRIPTOR?: never
    }
  | {
      ROUTE?: never
      IDENTIFIABLE?: never
      REFERABLE?: never
      FRAGMENT: FragmentIdentifier
      DESCRIPTOR?: never
    }
  | {
      ROUTE?: never
      IDENTIFIABLE?: never
      REFERABLE?: never
      FRAGMENT?: never
      DESCRIPTOR: DescriptorIdentifier
    }
export type LogicalExpression = {
  /**
   * @minItems 2
   */
  $and?: [LogicalExpression, LogicalExpression, ...LogicalExpression[]]
  /**
   * @minItems 1
   */
  $match?: [MatchExpression, ...MatchExpression[]]
  /**
   * @minItems 2
   */
  $or?: [LogicalExpression, LogicalExpression, ...LogicalExpression[]]
  $not?: LogicalExpression
  $eq?: ComparisonItems
  $ne?: ComparisonItems
  $gt?: OrderedComparisonItems
  $ge?: OrderedComparisonItems
  $lt?: OrderedComparisonItems
  $le?: OrderedComparisonItems
  $contains?: StringItems
  '$starts-with'?: StringItems
  '$ends-with'?: StringItems
  $regex?: StringItems
  $boolean?: boolean
  $boolCast?: Value
} & LogicalExpression1
export type MatchExpression = {
  /**
   * @minItems 1
   */
  $match?: [MatchExpression, ...MatchExpression[]]
  $eq?: ComparisonItems
  $ne?: ComparisonItems
  $gt?: OrderedComparisonItems
  $ge?: OrderedComparisonItems
  $lt?: OrderedComparisonItems
  $le?: OrderedComparisonItems
  $contains?: StringItems
  '$starts-with'?: StringItems
  '$ends-with'?: StringItems
  $regex?: StringItems
} & {
  /**
   * @minItems 1
   */
  $match?: [MatchExpression, ...MatchExpression[]]
  $eq?: ComparisonItems
  $ne?: ComparisonItems
  $gt?: OrderedComparisonItems
  $ge?: OrderedComparisonItems
  $lt?: OrderedComparisonItems
  $le?: OrderedComparisonItems
  $contains?: StringItems
  '$starts-with'?: StringItems
  '$ends-with'?: StringItems
  $regex?: StringItems
} & MatchExpression1 & {
    /**
     * @minItems 1
     */
    $match?: [MatchExpression, ...MatchExpression[]]
    $eq?: ComparisonItems
    $ne?: ComparisonItems
    $gt?: OrderedComparisonItems
    $ge?: OrderedComparisonItems
    $lt?: OrderedComparisonItems
    $le?: OrderedComparisonItems
    $contains?: StringItems
    '$starts-with'?: StringItems
    '$ends-with'?: StringItems
    $regex?: StringItems
  } & MatchExpression1 &
  MatchExpression1 & {
    /**
     * @minItems 1
     */
    $match?: [MatchExpression, ...MatchExpression[]]
    $eq?: ComparisonItems
    $ne?: ComparisonItems
    $gt?: OrderedComparisonItems
    $ge?: OrderedComparisonItems
    $lt?: OrderedComparisonItems
    $le?: OrderedComparisonItems
    $contains?: StringItems
    '$starts-with'?: StringItems
    '$ends-with'?: StringItems
    $regex?: StringItems
  } & MatchExpression1 & {
    /**
     * @minItems 1
     */
    $match?: [MatchExpression, ...MatchExpression[]]
    $eq?: ComparisonItems
    $ne?: ComparisonItems
    $gt?: OrderedComparisonItems
    $ge?: OrderedComparisonItems
    $lt?: OrderedComparisonItems
    $le?: OrderedComparisonItems
    $contains?: StringItems
    '$starts-with'?: StringItems
    '$ends-with'?: StringItems
    $regex?: StringItems
  } & MatchExpression1 & {
    /**
     * @minItems 1
     */
    $match?: [MatchExpression, ...MatchExpression[]]
    $eq?: ComparisonItems
    $ne?: ComparisonItems
    $gt?: OrderedComparisonItems
    $ge?: OrderedComparisonItems
    $lt?: OrderedComparisonItems
    $le?: OrderedComparisonItems
    $contains?: StringItems
    '$starts-with'?: StringItems
    '$ends-with'?: StringItems
    $regex?: StringItems
  } & MatchExpression1 & {
    /**
     * @minItems 1
     */
    $match?: [MatchExpression, ...MatchExpression[]]
    $eq?: ComparisonItems
    $ne?: ComparisonItems
    $gt?: OrderedComparisonItems
    $ge?: OrderedComparisonItems
    $lt?: OrderedComparisonItems
    $le?: OrderedComparisonItems
    $contains?: StringItems
    '$starts-with'?: StringItems
    '$ends-with'?: StringItems
    $regex?: StringItems
  } & MatchExpression1 & {
    /**
     * @minItems 1
     */
    $match?: [MatchExpression, ...MatchExpression[]]
    $eq?: ComparisonItems
    $ne?: ComparisonItems
    $gt?: OrderedComparisonItems
    $ge?: OrderedComparisonItems
    $lt?: OrderedComparisonItems
    $le?: OrderedComparisonItems
    $contains?: StringItems
    '$starts-with'?: StringItems
    '$ends-with'?: StringItems
    $regex?: StringItems
  } & MatchExpression1
export type ComparisonItems = OrderedComparisonItems | BoolComparisonItems
export type OrderedComparisonItems =
  StringItems | NumericalComparisonItems | HexComparisonItems | DateTimeComparisonItems | TimeComparisonItems
export type StringItems = [StringValue, StringNonFieldValue] | [StringNonFieldValue, StringValue]
export type StringValue = {
  $field?: FieldIdentifier
  $strVal?: StandardString
  $strCast?: Value
  $attribute?: AttributeItem
} & StringValue1
export type FieldIdentifier = string
export type StandardString = string
export type Value = {
  $field?: FieldIdentifier
  $strVal?: StandardString
  $attribute?: AttributeItem
  $numVal?: number
  $hexVal?: HexLiteralPattern
  $dateTimeVal?: DateTimeLiteralPattern
  $timeVal?: TimeLiteralPattern
  $boolean?: boolean
  $strCast?: Value
  $numCast?: Value
  $hexCast?: Value
  $boolCast?: Value
  $dateTimeCast?: StringValue
  $timeCast?: StringValue | DateTimeOperand
  $dayOfWeek?: DateTimeOperand
  $dayOfMonth?: DateTimeOperand
  $month?: DateTimeOperand
  $year?: DateTimeOperand
} & Value1
export type HexLiteralPattern = string
export type DateTimeLiteralPattern = string
export type TimeLiteralPattern = string
export type DateTimeOperand = {
  $dateTimeVal?: DateTimeLiteralPattern
  $dateTimeCast?: StringValue
  $attribute?: DateTimeAttributeItem
} & DateTimeOperand1
export type DateTimeOperand1 =
  | {
      $dateTimeVal: DateTimeLiteralPattern
      $dateTimeCast?: never
      $attribute?: never
    }
  | {
      $dateTimeVal?: never
      $dateTimeCast: StringValue
      $attribute?: never
    }
  | {
      $dateTimeVal?: never
      $dateTimeCast?: never
      $attribute: DateTimeAttributeItem
    }
export type Value1 =
  | {
      $field: FieldIdentifier
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal: StandardString
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute: AttributeItem
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal: number
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal: HexLiteralPattern
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal: DateTimeLiteralPattern
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal: TimeLiteralPattern
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean: boolean
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast: Value
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast: Value
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast: Value
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast: Value
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast: StringValue
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast: StringValue | DateTimeOperand
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek: DateTimeOperand
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth: DateTimeOperand
      $month?: never
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month: DateTimeOperand
      $year?: never
    }
  | {
      $field?: never
      $strVal?: never
      $attribute?: never
      $numVal?: never
      $hexVal?: never
      $dateTimeVal?: never
      $timeVal?: never
      $boolean?: never
      $strCast?: never
      $numCast?: never
      $hexCast?: never
      $boolCast?: never
      $dateTimeCast?: never
      $timeCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year: DateTimeOperand
    }
export type StringValue1 =
  | {
      $field: FieldIdentifier
      $strVal?: never
      $strCast?: never
      $attribute?: never
    }
  | {
      $field?: never
      $strVal: StandardString
      $strCast?: never
      $attribute?: never
    }
  | {
      $field?: never
      $strVal?: never
      $strCast: Value
      $attribute?: never
    }
  | {
      $field?: never
      $strVal?: never
      $strCast?: never
      $attribute: AttributeItem
    }
export type StringNonFieldValue = {
  $strVal?: StandardString
  $strCast?: Value
  $attribute?: AttributeItem
} & StringNonFieldValue1 & {
    $strVal?: StandardString
    $strCast?: Value
    $attribute?: AttributeItem
  } & StringNonFieldValue1
export type StringNonFieldValue1 =
  | {
      $strVal: StandardString
      $strCast?: never
      $attribute?: never
    }
  | {
      $strVal?: never
      $strCast: Value
      $attribute?: never
    }
  | {
      $strVal?: never
      $strCast?: never
      $attribute: AttributeItem
    }
export type NumericalComparisonItems =
  [NumericalOperand, NumericalOperand] | [NumericalOperand, FieldOperand] | [FieldOperand, NumericalOperand]
export type NumericalOperand = {
  $numVal?: number
  $numCast?: Value
  $dayOfWeek?: DateTimeOperand
  $dayOfMonth?: DateTimeOperand
  $month?: DateTimeOperand
  $year?: DateTimeOperand
} & NumericalOperand1 & {
    $numVal?: number
    $numCast?: Value
    $dayOfWeek?: DateTimeOperand
    $dayOfMonth?: DateTimeOperand
    $month?: DateTimeOperand
    $year?: DateTimeOperand
  } & NumericalOperand1 & {
    $numVal?: number
    $numCast?: Value
    $dayOfWeek?: DateTimeOperand
    $dayOfMonth?: DateTimeOperand
    $month?: DateTimeOperand
    $year?: DateTimeOperand
  } & NumericalOperand1 & {
    $numVal?: number
    $numCast?: Value
    $dayOfWeek?: DateTimeOperand
    $dayOfMonth?: DateTimeOperand
    $month?: DateTimeOperand
    $year?: DateTimeOperand
  } & NumericalOperand1
export type NumericalOperand1 =
  | {
      $numVal: number
      $numCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $numVal?: never
      $numCast: Value
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $numVal?: never
      $numCast?: never
      $dayOfWeek: DateTimeOperand
      $dayOfMonth?: never
      $month?: never
      $year?: never
    }
  | {
      $numVal?: never
      $numCast?: never
      $dayOfWeek?: never
      $dayOfMonth: DateTimeOperand
      $month?: never
      $year?: never
    }
  | {
      $numVal?: never
      $numCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month: DateTimeOperand
      $year?: never
    }
  | {
      $numVal?: never
      $numCast?: never
      $dayOfWeek?: never
      $dayOfMonth?: never
      $month?: never
      $year: DateTimeOperand
    }
export type HexComparisonItems = [HexOperand, HexOperand] | [HexOperand, FieldOperand] | [FieldOperand, HexOperand]
export type HexOperand = {
  $hexVal?: HexLiteralPattern
  $hexCast?: Value
} & HexOperand1 & {
    $hexVal?: HexLiteralPattern
    $hexCast?: Value
  } & HexOperand1 & {
    $hexVal?: HexLiteralPattern
    $hexCast?: Value
  } & HexOperand1 & {
    $hexVal?: HexLiteralPattern
    $hexCast?: Value
  } & HexOperand1
export type HexOperand1 =
  | {
      $hexVal: HexLiteralPattern
      $hexCast?: never
    }
  | {
      $hexVal?: never
      $hexCast: Value
    }
export type DateTimeComparisonItems =
  [DateTimeOperand, DateTimeOperand] | [DateTimeOperand, FieldOperand] | [FieldOperand, DateTimeOperand]
export type TimeComparisonItems = [TimeOperand, TimeOperand] | [TimeOperand, FieldOperand] | [FieldOperand, TimeOperand]
export type TimeOperand = {
  $timeVal?: TimeLiteralPattern
  $timeCast?: StringValue | DateTimeOperand
} & TimeOperand1 & {
    $timeVal?: TimeLiteralPattern
    $timeCast?: StringValue | DateTimeOperand
  } & TimeOperand1 & {
    $timeVal?: TimeLiteralPattern
    $timeCast?: StringValue | DateTimeOperand
  } & TimeOperand1 & {
    $timeVal?: TimeLiteralPattern
    $timeCast?: StringValue | DateTimeOperand
  } & TimeOperand1
export type TimeOperand1 =
  | {
      $timeVal: TimeLiteralPattern
      $timeCast?: never
    }
  | {
      $timeVal?: never
      $timeCast: StringValue | DateTimeOperand
    }
export type BoolComparisonItems = [BoolOperand, BoolOperand] | [BoolOperand, FieldOperand] | [FieldOperand, BoolOperand]
export type BoolOperand = {
  $boolean?: boolean
  $boolCast?: Value
} & BoolOperand1 & {
    $boolean?: boolean
    $boolCast?: Value
  } & BoolOperand1 & {
    $boolean?: boolean
    $boolCast?: Value
  } & BoolOperand1 & {
    $boolean?: boolean
    $boolCast?: Value
  } & BoolOperand1
export type BoolOperand1 =
  | {
      $boolean: boolean
      $boolCast?: never
    }
  | {
      $boolean?: never
      $boolCast: Value
    }
export type MatchExpression1 =
  | {
      $match?: never
      $eq: ComparisonItems
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne: ComparisonItems
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne?: never
      $gt: OrderedComparisonItems
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge: OrderedComparisonItems
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt: OrderedComparisonItems
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le: OrderedComparisonItems
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains: StringItems
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with': StringItems
      '$ends-with'?: never
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with': StringItems
      $regex?: never
    }
  | {
      $match?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex: StringItems
    }
  | {
      /**
       * @minItems 1
       */
      $match: [MatchExpression, ...MatchExpression[]]
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
    }
export type LogicalExpression1 =
  | {
      /**
       * @minItems 2
       */
      $and: [LogicalExpression, LogicalExpression, ...LogicalExpression[]]
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      /**
       * @minItems 2
       */
      $or: [LogicalExpression, LogicalExpression, ...LogicalExpression[]]
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not: LogicalExpression
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq: ComparisonItems
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne: ComparisonItems
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt: OrderedComparisonItems
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge: OrderedComparisonItems
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt: OrderedComparisonItems
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le: OrderedComparisonItems
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains: StringItems
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with': StringItems
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with': StringItems
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex: StringItems
      $boolean?: never
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean: boolean
      $boolCast?: never
    }
  | {
      $and?: never
      $match?: never
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast: Value
    }
  | {
      $and?: never
      /**
       * @minItems 1
       */
      $match: [MatchExpression, ...MatchExpression[]]
      $or?: never
      $not?: never
      $eq?: never
      $ne?: never
      $gt?: never
      $ge?: never
      $lt?: never
      $le?: never
      $contains?: never
      '$starts-with'?: never
      '$ends-with'?: never
      $regex?: never
      $boolean?: never
      $boolCast?: never
    }
export type AccessPermissionRule = (
  | {
      ACL: ACL
      USEACL?: never
      OBJECTS?: ObjectItem[]
      USEOBJECTS?: string[]
      FORMULA?: LogicalExpression
      USEFORMULA?: string
      FILTER?: SecurityQueryFilter
      FILTERLIST?: SecurityQueryFilter[]
    }
  | {
      ACL?: never
      USEACL: string
      OBJECTS?: ObjectItem[]
      USEOBJECTS?: string[]
      FORMULA?: LogicalExpression
      USEFORMULA?: string
      FILTER?: SecurityQueryFilter
      FILTERLIST?: SecurityQueryFilter[]
    }
) &
  (
    | {
        ACL?: ACL
        USEACL?: string
        OBJECTS: ObjectItem[]
        USEOBJECTS?: string[]
        FORMULA?: LogicalExpression
        USEFORMULA?: string
        FILTER?: SecurityQueryFilter
        FILTERLIST?: SecurityQueryFilter[]
      }
    | {
        ACL?: ACL
        USEACL?: string
        OBJECTS?: ObjectItem[]
        USEOBJECTS: string[]
        FORMULA?: LogicalExpression
        USEFORMULA?: string
        FILTER?: SecurityQueryFilter
        FILTERLIST?: SecurityQueryFilter[]
      }
  ) &
  (
    | {
        ACL?: ACL
        USEACL?: string
        OBJECTS?: ObjectItem[]
        USEOBJECTS?: string[]
        FORMULA: LogicalExpression
        USEFORMULA?: never
        FILTER?: SecurityQueryFilter
        FILTERLIST?: SecurityQueryFilter[]
      }
    | {
        ACL?: ACL
        USEACL?: string
        OBJECTS?: ObjectItem[]
        USEOBJECTS?: string[]
        FORMULA?: never
        USEFORMULA: string
        FILTER?: SecurityQueryFilter
        FILTERLIST?: SecurityQueryFilter[]
      }
  ) & {
    ACL?: ACL
    USEACL?: string
    OBJECTS?: ObjectItem[]
    USEOBJECTS?: string[]
    FORMULA?: LogicalExpression
    USEFORMULA?: string
    FILTER?: SecurityQueryFilter
    FILTERLIST?: SecurityQueryFilter[]
  }
export type SecurityQueryFilter = {
  FRAGMENT: FragmentIdentifier
  CONDITION?: LogicalExpression
  USEFORMULA?: string
} & SecurityQueryFilter1
export type SecurityQueryFilter1 =
  | {
      FRAGMENT?: FragmentIdentifier
      CONDITION: LogicalExpression
      USEFORMULA?: never
    }
  | {
      FRAGMENT?: FragmentIdentifier
      CONDITION?: never
      USEFORMULA: string
    }

/**
 * This schema contains the AAS Access Rule Language.
 */
export interface AccessRulesPolicy {
  AllAccessPermissionRules: AllAccessPermissionRules
}
export interface AllAccessPermissionRules {
  DEFATTRIBUTES?: ((
    | {
        name?: string
        attributes: AttributeItem[]
        USEATTRIBUTES?: never
      }
    | {
        name?: string
        attributes?: never
        USEATTRIBUTES: string[]
      }
  ) & {
    name: string
    attributes?: AttributeItem[]
    USEATTRIBUTES?: string[]
  })[]
  DEFACLS?: {
    name: string
    acl: ACL
  }[]
  DEFOBJECTS?: ((
    | {
        name?: string
        objects: ObjectItem[]
        USEOBJECTS?: never
      }
    | {
        name?: string
        objects?: never
        USEOBJECTS: string[]
      }
  ) & {
    name: string
    objects?: ObjectItem[]
    USEOBJECTS?: string[]
  })[]
  DEFFORMULAS?: {
    name: string
    formula: LogicalExpression
  }[]
  rules: AccessPermissionRule[]
}
export interface DateTimeAttributeItem {
  GLOBAL: 'LOCALNOW' | 'UTCNOW' | 'CLIENTNOW'
}
export interface FieldOperand {
  $field: FieldIdentifier
}
