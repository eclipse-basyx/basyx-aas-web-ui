import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

describe('EnvironmentStore feature-control configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('uses effective single-resource overrides when resolving redirects', async () => {
    vi.stubEnv('VITE_SINGLE_AAS', 'false')
    vi.stubEnv('VITE_SINGLE_AAS_REDIRECT', 'https://example.com/aas')
    vi.stubEnv('VITE_SINGLE_SM', 'false')
    vi.stubEnv('VITE_SINGLE_SM_REDIRECT', 'https://example.com/submodel')
    const { useEnvStore } = await import('@/store/EnvironmentStore')
    setActivePinia(createPinia())
    const envStore = useEnvStore()

    expect(envStore.getSingleAasRedirect).toBeUndefined()
    expect(envStore.getSingleSmRedirect).toBeUndefined()

    envStore.setFeatureControlOverrides({ singleAas: true, singleSm: true })

    expect(envStore.getSingleAasRedirect).toBe('https://example.com/aas')
    expect(envStore.getSingleSmRedirect).toBe('https://example.com/submodel')
  })

  it('decodes Unicode JSON pointers from production Base64 configuration', async () => {
    const configuration = '[{"target":"features","mode":"list","sources":["/fēatures"]}]'
    const { decodeProductionBase64 } = await import('@/store/EnvironmentStore')

    expect(decodeProductionBase64(base64Encode(configuration, false))).toBe(configuration)
  })

  it('provides the configured footer links', async () => {
    vi.stubEnv('VITE_COPYRIGHT_NAME', 'Example Corp')
    vi.stubEnv('VITE_LEGAL_NOTICE_URL', 'https://example.com/legal-notice')
    vi.stubEnv('VITE_PRIVACY_POLICY_URL', 'https://example.com/privacy-policy')
    const { useEnvStore } = await import('@/store/EnvironmentStore')
    setActivePinia(createPinia())
    const envStore = useEnvStore()

    expect(envStore.getEnvCopyrightName).toBe('Example Corp')
    expect(envStore.getEnvLegalNoticeUrl).toBe('https://example.com/legal-notice')
    expect(envStore.getEnvPrivacyPolicyUrl).toBe('https://example.com/privacy-policy')
  })
})
