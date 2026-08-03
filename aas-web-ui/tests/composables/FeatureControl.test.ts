import type { FeatureControlOverrides } from '@/utils/FeatureControl'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  type FeatureControlToken,
  watchFeatureControlClaims,
  watchFeatureControlRoutes,
} from '@/composables/FeatureControl'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

const mappings = JSON.stringify([
  { target: 'features', mode: 'list', sources: ['/basyx_features'] },
])

function tokenWithFeatures (features: string[]): string {
  return `${base64Encode(JSON.stringify({ alg: 'none' }))}.${base64Encode(JSON.stringify({ basyx_features: features }))}.signature`
}

function featureToken (features: string[], overrides: Partial<FeatureControlToken> = {}): FeatureControlToken {
  return { accessToken: tokenWithFeatures(features), ...overrides }
}

describe('feature control authentication lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('applies a restored access token immediately', () => {
    const accessToken = ref<FeatureControlToken | undefined>(featureToken(['forbid-editing']))
    const configuration = ref(mappings)
    const applied: Array<FeatureControlOverrides | null> = []

    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    expect(applied).toEqual([{ allowEditing: false }])
    stop()
  })

  it('re-evaluates refreshed tokens and selected infrastructure changes', async () => {
    const accessToken = ref<FeatureControlToken | undefined>(featureToken(['allow-editing']))
    const configuration = ref(mappings)
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    accessToken.value = featureToken(['forbid-editing', 'forbid-uploading'])
    await nextTick()
    accessToken.value = featureToken(['single-aas'])
    await nextTick()

    expect(applied).toEqual([
      { allowEditing: true },
      { allowEditing: false, allowUploading: false },
      { singleAas: true },
    ])
    stop()
  })

  it('restores deployment defaults on logout, token removal, or empty features', async () => {
    const accessToken = ref<FeatureControlToken | undefined>(featureToken(['allow-uploading']))
    const configuration = ref(mappings)
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    accessToken.value = featureToken([])
    await nextTick()
    accessToken.value = undefined
    await nextTick()

    expect(applied).toEqual([{ allowUploading: true }, null, null])
    stop()
  })

  it('restores defaults when mappings are disabled or invalid', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const accessToken = ref<FeatureControlToken | undefined>(featureToken(['allow-editing']))
    const configuration = ref('')
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    configuration.value = '{'
    await nextTick()

    expect(applied).toEqual([null, null])
    expect(console.warn).toHaveBeenCalledOnce()
    stop()
  })

  it('restores defaults for malformed tokens and invalid claim shapes', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const accessToken = ref<FeatureControlToken | undefined>({ accessToken: 'malformed-token' })
    const configuration = ref(mappings)
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    const invalidClaimToken = `${base64Encode('{}')}.${base64Encode(JSON.stringify({ basyx_features: true }))}.signature`
    accessToken.value = { accessToken: invalidClaimToken }
    await nextTick()

    expect(applied).toEqual([null, null])
    expect(console.warn).toHaveBeenCalledTimes(2)
    stop()
  })

  it('restores defaults when authentication is invalidated', async () => {
    const accessToken = ref<FeatureControlToken | undefined>(featureToken(['forbid-editing']))
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, mappings, overrides => applied.push(overrides))

    accessToken.value = { ...accessToken.value!, isAuthenticated: false }
    await nextTick()

    expect(applied).toEqual([{ allowEditing: false }, null])
    stop()
  })

  it('expires feature overrides even when the stored token does not change', async () => {
    vi.useFakeTimers()
    const accessToken = ref<FeatureControlToken | undefined>(featureToken(
      ['forbid-editing'],
      { expiresAt: Date.now() + 1000 },
    ))
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, mappings, overrides => applied.push(overrides))

    await vi.advanceTimersByTimeAsync(1001)

    expect(applied).toEqual([{ allowEditing: false }, null])
    stop()
  })

  it('does not expire long-lived token overrides at the browser timer limit', async () => {
    vi.useFakeTimers()
    const timerLimit = 2_147_483_647
    const accessToken = ref<FeatureControlToken | undefined>(featureToken(
      ['forbid-editing'],
      { expiresAt: Date.now() + timerLimit + 10_000 },
    ))
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, mappings, overrides => applied.push(overrides))

    await vi.advanceTimersByTimeAsync(timerLimit)
    expect(applied).toEqual([{ allowEditing: false }])

    await vi.advanceTimersByTimeAsync(10_001)
    expect(applied).toEqual([{ allowEditing: false }, null])
    stop()
  })
})

describe('feature-controlled routes', () => {
  function testRouter () {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/aasviewer', name: 'AASViewer', component: {} },
        { path: '/aaseditor', name: 'AASEditor', component: {} },
        { path: '/smviewer', name: 'SMViewer', component: {} },
        { path: '/smeditor', name: 'SMEditor', component: {} },
      ],
    })
  }

  it('leaves an open AAS editor when refreshed claims forbid editing', async () => {
    const router = testRouter()
    const allowEditing = ref(true)
    const smViewerEditor = ref(true)
    const redirected = vi.fn()
    await router.push({ name: 'AASEditor', query: { aas: 'example' } })
    const stop = watchFeatureControlRoutes(router, allowEditing, smViewerEditor, redirected)

    allowEditing.value = false
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('AASViewer'))

    expect(router.currentRoute.value.query).toEqual({ aas: 'example' })
    expect(redirected).toHaveBeenCalledOnce()
    stop()
  })

  it('moves an open Submodel editor to the AAS viewer when separate routes are removed', async () => {
    const router = testRouter()
    const allowEditing = ref(true)
    const smViewerEditor = ref(true)
    await router.push({ name: 'SMEditor', query: { path: 'submodel' } })
    const stop = watchFeatureControlRoutes(router, allowEditing, smViewerEditor)

    smViewerEditor.value = false
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('AASViewer'))

    expect(router.currentRoute.value.query).toEqual({ path: 'submodel' })
    stop()
  })
})
