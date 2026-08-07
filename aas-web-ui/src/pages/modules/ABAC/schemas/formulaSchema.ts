/**
 * Zod schemas for ABAC formula expressions.
 *
 * Provides runtime validation matching the BE ABAC grammar (from Go source).
 */

import type { AbacValidationMessages } from '../i18n/locales'
import type {
  FormulaExpression,
  MatchExpression,
  StringValueExpression,
  ValueExpression,
} from '@/composables/Client/ABAC/types/formula'
import { z } from 'zod'
import { DATE_TIME_VAL_PATTERN, FIELD_PATTERN, HEX_VAL_PATTERN, TIME_VAL_PATTERN } from './pattern'

// Kind inference

type Kind = 'string' | 'number' | 'bool' | 'dateTime' | 'time' | 'hex' | 'unknown'

const KIND_BY_KEY: Record<string, Kind> = {
  // literals
  $strVal: 'string',
  $numVal: 'number',
  $boolean: 'bool',
  $dateTimeVal: 'dateTime',
  $timeVal: 'time',
  $hexVal: 'hex',
  // casts — the cast target defines the resulting kind
  $strCast: 'string',
  $numCast: 'number',
  $boolCast: 'bool',
  $dateTimeCast: 'dateTime',
  $timeCast: 'time',
  $hexCast: 'hex',
  // date parts always yield numbers
  $dayOfWeek: 'number',
  $dayOfMonth: 'number',
  $month: 'number',
  $year: 'number',
  // resolved at evaluation time
  $field: 'unknown',
  $attribute: 'unknown',
}

const DATE_PART_KEYS = new Set(['$dayOfWeek', '$dayOfMonth', '$month', '$year'])
const EQUALITY_OPS = new Set(['$eq', '$ne'])
const ORDERED_OPS = new Set(['$gt', '$ge', '$lt', '$le'])
const DATETIME_GLOBALS = new Set(['LOCALNOW', 'UTCNOW', 'CLIENTNOW'])

function inferKind (node: unknown): Kind {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    return 'unknown'
  }

  const keys = Object.keys(node as object)
  if (keys.length !== 1) {
    return 'unknown'
  }

  const key = keys[0]

  if (key === '$attribute') {
    const inner = (node as Record<string, unknown>).$attribute
    if (typeof inner === 'object' && inner !== null) {
      const global = (inner as Record<string, unknown>).GLOBAL
      if (typeof global === 'string') {
        return DATETIME_GLOBALS.has(global) ? 'dateTime' : 'string'
      }
    }
    return 'unknown'
  }

  return KIND_BY_KEY[key] ?? 'unknown'
}

function kindsCompatible (a: Kind, b: Kind): boolean {
  return a === 'unknown' || b === 'unknown' || a === b
}

export function createFormulaSchema (messages: AbacValidationMessages) {
  const lazyFormula: z.ZodType<FormulaExpression> = z.lazy(
    () => baseFormulaExpressionSchema,
  )

  const lazyValue: z.ZodType<ValueExpression> = z.lazy(
    () => valueExpressionSchema,
  )

  // Leaf schemas

  const boolSchema = z.strictObject({
    $boolean: z.boolean({ error: messages.booleanRequired }),
  })

  const boolCastSchema = z.strictObject({
    $boolCast: lazyValue,
  })

  // Value / operand types

  const attributeSchema = z.strictObject({
    $attribute: z.union([
      z.strictObject({ CLAIM: z.string() }),
      z.strictObject({ GLOBAL: z.enum(['LOCALNOW', 'UTCNOW', 'CLIENTNOW', 'ANONYMOUS']) }),
      z.strictObject({ REFERENCE: z.string() }),
    ]),
  })

  const fieldSchema = z.strictObject({
    $field: z.string().regex(FIELD_PATTERN, { error: messages.invalidFieldValue }),
  })

  const literalValueSchemas = {
    $strVal: z.strictObject({ $strVal: z.string() }),
    $numVal: z.strictObject({ $numVal: z.number() }),
    $hexVal: z.strictObject({
      $hexVal: z.string().regex(HEX_VAL_PATTERN, { error: messages.invalidHexValue }),
    }),
    $dateTimeVal: z.strictObject({
      $dateTimeVal: z.string().regex(DATE_TIME_VAL_PATTERN, { error: messages.invalidDateTimeValue }),
    }),
    $timeVal: z.strictObject({
      $timeVal: z.string().regex(TIME_VAL_PATTERN, { error: messages.invalidTimeValue }),
    }),
  }
  const castSchemas = {
    $strCast: z.strictObject({ $strCast: lazyValue }),
    $numCast: z.strictObject({ $numCast: lazyValue }),
    $hexCast: z.strictObject({ $hexCast: lazyValue }),
    $boolCast: z.strictObject({ $boolCast: lazyValue }),
    $dateTimeCast: z.strictObject({ $dateTimeCast: lazyValue }),
    $timeCast: z.strictObject({ $timeCast: lazyValue }),
  }

  const datePartSchemas = {
    $dayOfWeek: z.strictObject({ $dayOfWeek: lazyValue }),
    $dayOfMonth: z.strictObject({ $dayOfMonth: lazyValue }),
    $month: z.strictObject({ $month: lazyValue }),
    $year: z.strictObject({ $year: lazyValue }),
  }

  const valueExpressionSchema = z.union(
    [
      attributeSchema,
      fieldSchema,
      boolSchema,
      ...Object.values(literalValueSchemas),
      ...Object.values(castSchemas),
      ...Object.values(datePartSchemas),
    ],
    { error: messages.invalidValueOperand },
  )

  const orderedCastSchemas = {
    $strCast: z.strictObject({ $strCast: lazyValue }),
    $numCast: z.strictObject({ $numCast: lazyValue }),
    $hexCast: z.strictObject({ $hexCast: lazyValue }),
    $dateTimeCast: z.strictObject({ $dateTimeCast: lazyValue }),
    $timeCast: z.strictObject({ $timeCast: lazyValue }),
  }

  const orderedValueExpressionSchema = z.union(
    [
      attributeSchema,
      fieldSchema,
      ...Object.values(literalValueSchemas),
      ...Object.values(orderedCastSchemas),
      ...Object.values(datePartSchemas),
    ],
    { error: messages.invalidValueOperand },
  )

  const lazyStringValue: z.ZodType<StringValueExpression> = z.lazy(
    () => stringValueExpressionSchema,
  )

  const stringValueExpressionSchema = z.union(
    [
      attributeSchema,
      fieldSchema,
      z.strictObject({ $strCast: lazyValue }),
      z.strictObject({ $strVal: z.string() }),
    ],
    { error: messages.invalidStringValueOperand },
  )

  // Comparison operators

  const comparisonSchemas = {
    $eq: z.strictObject({
      $eq: z.tuple([lazyValue, lazyValue], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $ne: z.strictObject({
      $ne: z.tuple([lazyValue, lazyValue], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $gt: z.strictObject({
      $gt: z.tuple([orderedValueExpressionSchema, orderedValueExpressionSchema], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $ge: z.strictObject({
      $ge: z.tuple([orderedValueExpressionSchema, orderedValueExpressionSchema], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $lt: z.strictObject({
      $lt: z.tuple([orderedValueExpressionSchema, orderedValueExpressionSchema], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $le: z.strictObject({
      $le: z.tuple([orderedValueExpressionSchema, orderedValueExpressionSchema], { error: messages.comparisonRequiresTwoOperands }),
    }),
  }

  // Logical operators

  const logicalSchemas = {
    $and: z.strictObject({
      $and: z.array(lazyFormula).min(2, { error: messages.andOrRequiresMinTwo }),
    }),
    $or: z.strictObject({
      $or: z.array(lazyFormula).min(2, { error: messages.andOrRequiresMinTwo }),
    }),
    $not: z.strictObject({
      $not: lazyFormula,
    }),
  }

  // String match operators

  const stringMatchSchemas = {
    '$regex': z.strictObject({
      $regex: z.tuple([lazyStringValue, lazyStringValue], { error: messages.stringMatchRequiresTwoOperands }),
    }),
    '$contains': z.strictObject({
      $contains: z.tuple([lazyStringValue, lazyStringValue], { error: messages.stringMatchRequiresTwoOperands }),
    }),
    '$starts-with': z.strictObject({
      '$starts-with': z.tuple([lazyStringValue, lazyStringValue], { error: messages.stringMatchRequiresTwoOperands }),
    }),
    '$ends-with': z.strictObject({
      '$ends-with': z.tuple([lazyStringValue, lazyStringValue], { error: messages.stringMatchRequiresTwoOperands }),
    }),
  }

  // Match Expression (elements inside $match array)

  const lazyMatch: z.ZodType<MatchExpression> = z.lazy(
    () => matchExpressionSchema,
  )

  const matchComparisonSchemas = {
    $eq: z.strictObject({
      $eq: z.tuple([lazyValue, lazyValue], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $ne: z.strictObject({
      $ne: z.tuple([lazyValue, lazyValue], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $gt: z.strictObject({
      $gt: z.tuple([orderedValueExpressionSchema, orderedValueExpressionSchema], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $ge: z.strictObject({
      $ge: z.tuple([orderedValueExpressionSchema, orderedValueExpressionSchema], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $lt: z.strictObject({
      $lt: z.tuple([orderedValueExpressionSchema, orderedValueExpressionSchema], { error: messages.comparisonRequiresTwoOperands }),
    }),
    $le: z.strictObject({
      $le: z.tuple([orderedValueExpressionSchema, orderedValueExpressionSchema], { error: messages.comparisonRequiresTwoOperands }),
    }),
  }

  const matchStringSchemas = {
    '$regex': z.strictObject({
      $regex: z.tuple([lazyStringValue, lazyStringValue], { error: messages.stringMatchRequiresTwoOperands }),
    }),
    '$contains': z.strictObject({
      $contains: z.tuple([lazyStringValue, lazyStringValue], { error: messages.stringMatchRequiresTwoOperands }),
    }),
    '$starts-with': z.strictObject({
      '$starts-with': z.tuple([lazyStringValue, lazyStringValue], { error: messages.stringMatchRequiresTwoOperands }),
    }),
    '$ends-with': z.strictObject({
      '$ends-with': z.tuple([lazyStringValue, lazyStringValue], { error: messages.stringMatchRequiresTwoOperands }),
    }),
  }

  const matchNestedSchema = z.strictObject({
    $match: z.array(lazyMatch).min(1, { error: messages.matchRequiresMinOne }),
  })

  const matchExpressionSchema = z.union(
    [
      ...Object.values(matchComparisonSchemas),
      ...Object.values(matchStringSchemas),
      matchNestedSchema,
    ],
    { error: messages.invalidOperator },
  )

  const matchClauseSchema = z.strictObject({
    $match: z.array(matchExpressionSchema).min(1, { error: messages.matchRequiresMinOne }),
  })

  // Structural union

  const baseFormulaExpressionSchema = z.union(
    [
      boolSchema,
      boolCastSchema,
      ...Object.values(comparisonSchemas),
      ...Object.values(logicalSchemas),
      ...Object.values(stringMatchSchemas),
      matchClauseSchema,
    ],
    { error: messages.invalidOperator },
  )

  // Semantic passes

  function checkValueOperands (
    node: unknown,
    ctx: z.RefinementCtx,
    path: (string | number)[] = [],
  ): void {
    if (typeof node !== 'object' || node === null) {
      return
    }

    if (Array.isArray(node)) {
      for (const [i, child] of node.entries()) {
        checkValueOperands(child, ctx, [...path, i])
      }
      return
    }

    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const childPath = [...path, key]
      const childKind = inferKind(child)

      if (DATE_PART_KEYS.has(key) && !kindsCompatible(childKind, 'dateTime')) {
        ctx.addIssue({
          code: 'custom',
          path: childPath,
          message: messages.datePartRequiresDateTime,
        })
      }

      if (key === '$dateTimeCast' && !kindsCompatible(childKind, 'string')) {
        ctx.addIssue({
          code: 'custom',
          path: childPath,
          message: messages.dateTimeCastRequiresString,
        })
      }

      if (
        key === '$timeCast'
        && childKind !== 'unknown'
        && childKind !== 'string'
        && childKind !== 'dateTime'
      ) {
        ctx.addIssue({
          code: 'custom',
          path: childPath,
          message: messages.timeCastRequiresStringOrDateTime,
        })
      }

      checkValueOperands(child, ctx, childPath)
    }
  }

  function checkComparisons (
    node: unknown,
    ctx: z.RefinementCtx,
    path: (string | number)[] = [],
  ): void {
    if (typeof node !== 'object' || node === null) {
      return
    }

    if (Array.isArray(node)) {
      for (const [i, child] of node.entries()) {
        checkComparisons(child, ctx, [...path, i])
      }
      return
    }

    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const childPath = [...path, key]
      const isEquality = EQUALITY_OPS.has(key)
      const isOrdered = ORDERED_OPS.has(key)

      if ((isEquality || isOrdered) && Array.isArray(child) && child.length === 2) {
        const left = inferKind(child[0])
        const right = inferKind(child[1])

        if (!kindsCompatible(left, right)) {
          ctx.addIssue({
            code: 'custom',
            path: childPath,
            message: messages.comparisonTypeMismatch,
          })
        }

        if (isOrdered && (left === 'bool' || right === 'bool')) {
          ctx.addIssue({
            code: 'custom',
            path: childPath,
            message: messages.orderedComparisonNoBoolean,
          })
        }
      }

      checkComparisons(child, ctx, childPath)
    }
  }

  const formulaExpressionSchema = baseFormulaExpressionSchema.superRefine((value, ctx) => {
    checkValueOperands(value, ctx)
    checkComparisons(value, ctx)
  })

  return {
    formulaExpressionSchema,
    baseFormulaExpressionSchema,
    valueExpressionSchema,
    orderedValueExpressionSchema,
    stringValueExpressionSchema,
    matchExpressionSchema,
    boolSchema,
    boolCastSchema,
    ...comparisonSchemas,
    ...logicalSchemas,
    ...stringMatchSchemas,
    matchClauseSchema,
  }
}
