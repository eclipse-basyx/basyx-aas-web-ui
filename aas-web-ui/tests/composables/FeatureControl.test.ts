import type { FeatureControlOverrides } from '@/utils/FeatureControl'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { watchFeatureControlClaims } from '@/composables/FeatureControl'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

const mappings = JSON.stringify([
  { target: 'features', mode: 'list', sources: ['/basyx_features'] },
])

function tokenWithFeatures (features: string[]): string {
  return `${base64Encode(JSON.stringify({ alg: 'none' }))}.${base64Encode(JSON.stringify({ basyx_features: features }))}.signature`
}

describe('feature control authentication lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('applies a restored access token immediately', () => {
    const accessToken = ref<string | undefined>(tokenWithFeatures(['forbid-editing']))
    const configuration = ref(mappings)
    const applied: Array<FeatureControlOverrides | null> = []

    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    expect(applied).toEqual([{ allowEditing: false }])
    stop()
  })

  it('re-evaluates refreshed tokens and selected infrastructure changes', async () => {
    const accessToken = ref<string | undefined>(tokenWithFeatures(['allow-editing']))
    const configuration = ref(mappings)
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    accessToken.value = tokenWithFeatures(['forbid-editing', 'forbid-uploading'])
    await nextTick()
    accessToken.value = tokenWithFeatures(['single-aas'])
    await nextTick()

    expect(applied).toEqual([
      { allowEditing: true },
      { allowEditing: false, allowUploading: false },
      { singleAas: true },
    ])
    stop()
  })

  it('restores deployment defaults on logout, token removal, or empty features', async () => {
    const accessToken = ref<string | undefined>(tokenWithFeatures(['allow-uploading']))
    const configuration = ref(mappings)
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    accessToken.value = tokenWithFeatures([])
    await nextTick()
    accessToken.value = undefined
    await nextTick()

    expect(applied).toEqual([{ allowUploading: true }, null, null])
    stop()
  })

  it('restores defaults when mappings are disabled or invalid', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const accessToken = ref<string | undefined>(tokenWithFeatures(['allow-editing']))
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
    const accessToken = ref<string | undefined>('malformed-token')
    const configuration = ref(mappings)
    const applied: Array<FeatureControlOverrides | null> = []
    const stop = watchFeatureControlClaims(accessToken, configuration, overrides => applied.push(overrides))

    const invalidClaimToken = `${base64Encode('{}')}.${base64Encode(JSON.stringify({ basyx_features: true }))}.signature`
    accessToken.value = invalidClaimToken
    await nextTick()

    expect(applied).toEqual([null, null])
    expect(console.warn).toHaveBeenCalledTimes(2)
    stop()
  })
})
