import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CompanyDescriptorViewer from '@/pages/modules/CompanyDescriptorViewer/index.vue'

const mockState = vi.hoisted(() => ({
  companyDomain: '',
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace: mockState.replace,
  }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    get getCompanyLookupDomain () {
      return mockState.companyDomain
    },
  }),
}))

describe('CompanyDescriptorViewer', () => {
  beforeEach(() => {
    mockState.companyDomain = ''
    mockState.replace.mockReset()
  })

  it('encodes the configured company domain before redirecting', () => {
    mockState.companyDomain = 'https://example.com/a%20b'

    mount(CompanyDescriptorViewer, {
      global: {
        stubs: {
          VContainer: true,
        },
      },
    })

    expect(mockState.replace).toHaveBeenCalledWith({
      path: '/modules/companylookup',
      query: {
        id: 'https%3A%2F%2Fexample.com%2Fa%2520b',
        view: 'detailsOnly',
      },
    })
  })

  it('does not redirect without a configured company domain', () => {
    mount(CompanyDescriptorViewer, {
      global: {
        stubs: {
          VContainer: true,
        },
      },
    })

    expect(mockState.replace).not.toHaveBeenCalled()
  })
})
