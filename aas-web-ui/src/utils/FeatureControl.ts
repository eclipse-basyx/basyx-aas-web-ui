export type FeatureControlClaimMapping = {
  target: 'features'
  mode: 'list'
  sources: string[]
}

export type FeatureControlOverrides = Partial<{
  endpointConfigAvailable: boolean
  singleAas: boolean
  smViewerEditor: boolean
  singleSm: boolean
  allowEditing: boolean
  allowUploading: boolean
  allowLogout: boolean
}>

type JsonObject = Record<string, unknown>

export class FeatureControlError extends Error {
  constructor (message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'FeatureControlError'
  }
}

/**
 * Parses feature claim mappings using the same target, mode and source model as BaSyx Go.
 */
export function parseFeatureControlClaimMappings (configuration: string): FeatureControlClaimMapping[] {
  if (configuration.trim() === '') {
    return []
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(configuration)
  } catch (error) {
    throw new FeatureControlError('Feature control claim mappings must be valid JSON.', { cause: error })
  }

  if (!Array.isArray(parsed)) {
    throw new FeatureControlError('Feature control claim mappings must be an array.')
  }

  const targets = new Set<string>()
  return parsed.map((candidate, index) => {
    if (!isJsonObject(candidate)) {
      throw new FeatureControlError(`Feature control claim mapping at index ${index} must be an object.`)
    }

    const target = typeof candidate.target === 'string' ? candidate.target.trim() : ''
    if (target !== 'features') {
      throw new FeatureControlError(`Feature control claim mapping target must be "features", got "${target}".`)
    }
    if (targets.has(target)) {
      throw new FeatureControlError(`Duplicate feature control claim mapping target "${target}".`)
    }
    targets.add(target)

    const mode = typeof candidate.mode === 'string' ? candidate.mode.trim().toLowerCase() : ''
    if (mode !== 'list') {
      throw new FeatureControlError(`Feature control claim mapping "${target}" must use list mode.`)
    }

    if (!Array.isArray(candidate.sources) || candidate.sources.length === 0) {
      throw new FeatureControlError(`Feature control claim mapping "${target}" requires at least one source.`)
    }

    const sources: string[] = []
    const seenSources = new Set<string>()
    for (const source of candidate.sources) {
      if (typeof source !== 'string') {
        throw new FeatureControlError(`Feature control claim mapping "${target}" sources must be strings.`)
      }
      decodeJsonPointer(source)
      if (!seenSources.has(source)) {
        sources.push(source)
        seenSources.add(source)
      }
    }

    return { target, mode, sources }
  })
}

/**
 * Maps scalar and string-array claims into a deduplicated feature list.
 */
export function extractFeatureClaims (
  claims: JsonObject,
  mappings: FeatureControlClaimMapping[],
): string[] {
  if (mappings.length === 0) {
    return []
  }

  const features: string[] = []
  const seenFeatures = new Set<string>()
  for (const source of mappings[0].sources) {
    const { found, value } = jsonPointerValue(claims, source)
    if (!found) {
      continue
    }

    const values = stringList(value, source)
    for (const feature of values) {
      if (!seenFeatures.has(feature)) {
        features.push(feature)
        seenFeatures.add(feature)
      }
    }
  }
  return features
}

/**
 * Converts feature values into temporary environment overrides.
 */
export function evaluateFeatureControl (features: readonly string[]): FeatureControlOverrides {
  const availableFeatures = new Set(features)
  const overrides: FeatureControlOverrides = {}

  setConflictingOverride(
    overrides,
    'endpointConfigAvailable',
    availableFeatures,
    'endpoint-config-unavailable',
    false,
    'endpoint-config-available',
    true,
  )
  setConflictingOverride(
    overrides,
    'singleAas',
    availableFeatures,
    'single-aas',
    true,
    'multiple-aas',
    false,
  )
  if (availableFeatures.has('sm-viewer-editor')) {
    overrides.smViewerEditor = true
  }
  setConflictingOverride(
    overrides,
    'singleSm',
    availableFeatures,
    'single-sm',
    true,
    'multiple-sm',
    false,
  )
  setConflictingOverride(
    overrides,
    'allowEditing',
    availableFeatures,
    'forbid-editing',
    false,
    'allow-editing',
    true,
  )
  setConflictingOverride(
    overrides,
    'allowUploading',
    availableFeatures,
    'forbid-uploading',
    false,
    'allow-uploading',
    true,
  )
  setConflictingOverride(
    overrides,
    'allowLogout',
    availableFeatures,
    'forbid-logout',
    false,
    'allow-logout',
    true,
  )

  return overrides
}

function isJsonObject (value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function setConflictingOverride<K extends keyof FeatureControlOverrides> (
  overrides: FeatureControlOverrides,
  key: K,
  features: Set<string>,
  restrictiveFeature: string,
  restrictiveValue: boolean,
  permissiveFeature: string,
  permissiveValue: boolean,
): void {
  if (features.has(restrictiveFeature)) {
    overrides[key] = restrictiveValue
  } else if (features.has(permissiveFeature)) {
    overrides[key] = permissiveValue
  }
}

function stringList (value: unknown, source: string): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return value
  }
  throw new FeatureControlError(`Feature claim source "${source}" must contain a string or string array.`)
}

function jsonPointerValue (root: unknown, pointer: string): { found: boolean, value?: unknown } {
  let current = root
  for (const token of decodeJsonPointer(pointer)) {
    if (Array.isArray(current)) {
      const index = Number(token)
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return { found: false }
      }
      current = current[index]
      continue
    }
    if (isJsonObject(current) && Object.hasOwn(current, token)) {
      current = current[token]
      continue
    }
    return { found: false }
  }
  return { found: true, value: current }
}

function decodeJsonPointer (pointer: string): string[] {
  if (pointer === '') {
    return []
  }
  if (!pointer.startsWith('/')) {
    throw new FeatureControlError(`Invalid JSON pointer "${pointer}": pointer must start with '/'.`)
  }

  return pointer.slice(1).split('/').map(rawToken => {
    let token = ''
    for (let index = 0; index < rawToken.length; index++) {
      if (rawToken[index] !== '~') {
        token += rawToken[index]
        continue
      }
      if (index + 1 >= rawToken.length) {
        throw new FeatureControlError(`Invalid JSON pointer "${pointer}": incomplete escape.`)
      }
      index++
      if (rawToken[index] === '0') {
        token += '~'
      } else if (rawToken[index] === '1') {
        token += '/'
      } else {
        throw new FeatureControlError(`Invalid JSON pointer "${pointer}": unsupported escape ~${rawToken[index]}.`)
      }
    }
    return token
  })
}
