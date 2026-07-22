import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useEnvStore } from '@/store/EnvironmentStore'

describe('EnvironmentStore feature control overrides', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('keeps deployment defaults separate from token-derived overrides', () => {
    const envStore = useEnvStore()
    const defaults = {
      endpointConfigAvailable: envStore.getEndpointConfigAvailable,
      singleAas: envStore.getSingleAas,
      smViewerEditor: envStore.getSmViewerEditor,
      singleSm: envStore.getSingleSm,
      allowEditing: envStore.getAllowEditing,
      allowUploading: envStore.getAllowUploading,
      allowLogout: envStore.getAllowLogout,
    }

    envStore.setFeatureControlOverrides({
      endpointConfigAvailable: !defaults.endpointConfigAvailable,
      singleAas: !defaults.singleAas,
      smViewerEditor: !defaults.smViewerEditor,
      singleSm: !defaults.singleSm,
      allowEditing: !defaults.allowEditing,
      allowUploading: !defaults.allowUploading,
      allowLogout: !defaults.allowLogout,
    })

    expect(envStore.getEndpointConfigAvailable).toBe(!defaults.endpointConfigAvailable)
    expect(envStore.getSingleAas).toBe(!defaults.singleAas)
    expect(envStore.getSmViewerEditor).toBe(!defaults.smViewerEditor)
    expect(envStore.getSingleSm).toBe(!defaults.singleSm)
    expect(envStore.getAllowEditing).toBe(!defaults.allowEditing)
    expect(envStore.getAllowUploading).toBe(!defaults.allowUploading)
    expect(envStore.getAllowLogout).toBe(!defaults.allowLogout)

    envStore.setFeatureControlOverrides(null)

    expect(envStore.getEndpointConfigAvailable).toBe(defaults.endpointConfigAvailable)
    expect(envStore.getSingleAas).toBe(defaults.singleAas)
    expect(envStore.getSmViewerEditor).toBe(defaults.smViewerEditor)
    expect(envStore.getSingleSm).toBe(defaults.singleSm)
    expect(envStore.getAllowEditing).toBe(defaults.allowEditing)
    expect(envStore.getAllowUploading).toBe(defaults.allowUploading)
    expect(envStore.getAllowLogout).toBe(defaults.allowLogout)
  })

  it('falls back per feature when a token only controls part of the UI', () => {
    const envStore = useEnvStore()
    const defaultUploading = envStore.getAllowUploading

    envStore.setFeatureControlOverrides({ allowEditing: false })

    expect(envStore.getAllowEditing).toBe(false)
    expect(envStore.getAllowUploading).toBe(defaultUploading)
  })
})
