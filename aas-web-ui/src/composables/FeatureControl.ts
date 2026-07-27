import type { MaybeRefOrGetter, WatchStopHandle } from 'vue'
import type { LocationQuery, Router, RouteRecordNameGeneric } from 'vue-router'
import { toValue, watch } from 'vue'
import {
  evaluateFeatureControl,
  extractFeatureClaims,
  type FeatureControlOverrides,
  parseFeatureControlClaimMappings,
} from '@/utils/FeatureControl'
import { getTokenPayload } from '@/utils/TokenUtil'

export type FeatureControlToken = {
  accessToken: string
  expiresAt?: number
  isAuthenticated?: boolean
}

/**
 * Keeps feature overrides synchronized with the active access token and mapping configuration.
 */
export function watchFeatureControlClaims (
  token: MaybeRefOrGetter<FeatureControlToken | undefined>,
  configuration: MaybeRefOrGetter<string>,
  applyOverrides: (overrides: FeatureControlOverrides | null) => void,
): WatchStopHandle {
  return watch(
    [() => toValue(token), () => toValue(configuration)],
    ([currentToken, currentConfiguration], _previous, onCleanup) => {
      try {
        const mappings = parseFeatureControlClaimMappings(currentConfiguration)
        if (mappings.length === 0 || !currentToken?.accessToken || currentToken.isAuthenticated === false) {
          applyOverrides(null)
          return
        }

        const payload = getTokenPayload(currentToken.accessToken)
        const expiresAt = getFeatureTokenExpiration(currentToken, payload)
        if (expiresAt !== undefined) {
          const remainingLifetime = expiresAt - Date.now()
          if (remainingLifetime <= 0) {
            applyOverrides(null)
            return
          }

          let expirationTimer: number | undefined
          const scheduleExpiration = (): void => {
            const remaining = expiresAt - Date.now()
            if (remaining <= 0) {
              applyOverrides(null)
              return
            }
            expirationTimer = window.setTimeout(
              scheduleExpiration,
              Math.min(remaining + 1, 2_147_483_647),
            )
          }
          scheduleExpiration()
          onCleanup(() => {
            if (expirationTimer !== undefined) {
              window.clearTimeout(expirationTimer)
            }
          })
        }

        const features = extractFeatureClaims(payload, mappings)
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

/**
 * Moves users out of routes which become unavailable after a feature-claim refresh.
 */
export function watchFeatureControlRoutes (
  router: Router,
  allowEditing: MaybeRefOrGetter<boolean>,
  smViewerEditor: MaybeRefOrGetter<boolean>,
  onRedirect?: () => void,
): WatchStopHandle {
  return watch(
    [() => toValue(allowEditing), () => toValue(smViewerEditor)],
    async ([editingAllowed, separateSmRoutes]) => {
      const destination = restrictedFeatureRoute(
        router.currentRoute.value.name,
        router.currentRoute.value.query,
        editingAllowed,
        separateSmRoutes,
      )
      if (!destination) {
        return
      }

      try {
        await router.replace(destination)
        onRedirect?.()
      } catch (error) {
        console.warn(
          '[FeatureControl] Could not leave a restricted route:',
          error instanceof Error ? error.message : String(error),
        )
      }
    },
  )
}

function getFeatureTokenExpiration (
  token: FeatureControlToken,
  payload: Record<string, unknown>,
): number | undefined {
  const expirations: number[] = []
  if (typeof token.expiresAt === 'number' && Number.isFinite(token.expiresAt)) {
    expirations.push(token.expiresAt)
  }
  if (typeof payload.exp === 'number' && Number.isFinite(payload.exp)) {
    expirations.push(payload.exp * 1000)
  }
  return expirations.length > 0 ? Math.min(...expirations) : undefined
}

function restrictedFeatureRoute (
  routeName: RouteRecordNameGeneric | null | undefined,
  query: LocationQuery,
  allowEditing: boolean,
  smViewerEditor: boolean,
): { name: string, query: LocationQuery, replace: true } | null {
  if (routeName === 'AASEditor' && !allowEditing) {
    return { name: 'AASViewer', query, replace: true }
  }
  if (routeName === 'SMEditor') {
    if (!smViewerEditor) {
      return { name: 'AASViewer', query, replace: true }
    }
    if (!allowEditing) {
      return { name: 'SMViewer', query, replace: true }
    }
  }
  if (routeName === 'SMViewer' && !smViewerEditor) {
    return { name: 'AASViewer', query, replace: true }
  }
  return null
}
