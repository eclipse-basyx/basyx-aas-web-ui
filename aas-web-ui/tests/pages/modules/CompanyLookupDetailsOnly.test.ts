import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import CompaniesList from '@/pages/modules/CompanyLookup/components/CompaniesList.vue'
import CompanyLookupConfigurator from '@/pages/modules/CompanyLookup/components/CompanyLookupConfigurator.vue'
import CompanyLookupLayout from '@/pages/modules/CompanyLookup/components/CompanyLookupLayout.vue'
import CompanyDetail from '@/pages/modules/CompanyLookup/components/detail/CompanyDetail.vue'
import CompanyOptions from '@/pages/modules/CompanyLookup/components/options/CompanyOptions.vue'

const mockState = vi.hoisted(() => ({
  isMobile: false,
  query: {} as Record<string, string>,
  replace: vi.fn(),
}))

const PassthroughStub = defineComponent({
  template: '<div><slot /></div>',
})

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: mockState.query,
  }),
  useRouter: () => ({
    replace: mockState.replace,
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    get getIsMobile () {
      return mockState.isMobile
    },
  }),
}))

vi.mock('@/pages/modules/CompanyLookup/i18n/useCompanyLookupI18n', () => ({
  useCompanyLookupI18n: () => ({
    t: (key: string) => key,
    tm: vi.fn(),
    i18nData: vi.fn(),
  }),
}))

vi.mock('@/composables/Client/CompanyLookup/queries/useGetCompany', () => ({
  useGetCompany: () => ({
    data: ref({
      domain: 'example.com',
      idShort: 'Example',
      name: 'Example Company',
    }),
    isLoading: ref(false),
  }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getAllowEditing: true,
  }),
}))

vi.mock('@/composables/ClipboardUtil', () => ({
  useClipboardUtil: () => ({
    copyToClipboard: vi.fn(),
  }),
}))

describe('Company Lookup details-only mode', () => {
  beforeEach(() => {
    mockState.isMobile = false
    mockState.query = {}
    mockState.replace.mockReset()
  })

  it('suppresses company navigation and hides configuration preferences', () => {
    mockState.query = {
      id: 'example.com',
      view: 'detailsOnly',
    }

    const wrapper = mount(CompanyLookupLayout, {
      shallow: true,
    })

    expect(wrapper.findComponent(CompaniesList).exists()).toBe(false)
    expect(wrapper.findComponent(CompanyLookupConfigurator).exists()).toBe(false)
    expect(wrapper.findComponent(CompanyDetail).props('detailsOnly')).toBe(true)
    expect(wrapper.find('v-btn-stub').exists()).toBe(false)
  })

  it('hides company actions and the view toggle', () => {
    mockState.query = {
      id: 'example.com',
      view: 'detailsOnly',
    }

    const wrapper = mount(CompanyDetail, {
      props: {
        detailsOnly: true,
      },
      shallow: true,
      global: {
        stubs: {
          VCard: PassthroughStub,
          VCardTitle: PassthroughStub,
        },
      },
    })

    expect(wrapper.findComponent(CompanyOptions).exists()).toBe(false)
    expect(wrapper.find('v-btn-toggle-stub').exists()).toBe(false)
  })

  it('keeps the regular company list outside details-only mode', () => {
    mockState.query = {
      id: 'example.com',
      view: 'details',
    }

    const wrapper = mount(CompanyLookupLayout, {
      shallow: true,
    })

    expect(wrapper.findComponent(CompaniesList).exists()).toBe(true)
    expect(wrapper.findComponent(CompanyDetail).props('detailsOnly')).toBe(false)
  })
})
