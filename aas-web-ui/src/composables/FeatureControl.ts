import type { MaybeRefOrGetter, WatchStopHandle } from 'vue'
import { toValue, watch } from 'vue'
import {
  evaluateFeatureControl,
  extractFeatureClaims,
  type FeatureControlOverrides,
  parseFeatureControlClaimMappings,
} from '@/utils/FeatureControl'
import { getTokenPayload } from '@/utils/TokenUtil'

/**
 * Keeps feature overrides synchronized with the active access token and mapping configuration.
 */
export function watchFeatureControlClaims (
  accessToken: MaybeRefOrGetter<string | undefined>,
  configuration: MaybeRefOrGetter<string>,
  applyOverrides: (overrides: FeatureControlOverrides | null) => void,
): WatchStopHandle {
  return watch(
    [() => toValue(accessToken), () => toValue(configuration)],
    ([currentToken, currentConfiguration]) => {
      try {
        const mappings = parseFeatureControlClaimMappings(currentConfiguration)
        if (mappings.length === 0 || !currentToken) {
          applyOverrides(null)
          return
        }

        const features = extractFeatureClaims(getTokenPayload(currentToken), mappings)
        const overrides = evaluateFeatureControl(features)
        applyOverrides(Object.keys(overrides).length > 0 ? overrides : null)
      } catch (error) {
        console.warn(
          '[FeatureControl] Claim-based feature overrides were ignored:',
          error instanceof Error ? error.message : String(error),
        )
        applyOverrides(null)
      }
    },
    { immediate: true },
  )
}
