import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import RailwayFireProtection from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0.vue'
// Official IDTA 02102 v1.0 example, source and licence in fixtures/README.md
import officialExample from './fixtures/railway-fire-protection.idta-example.json'

vi.mock('@/composables/AAS/SMHandling', () => ({
  // The real implementation additionally assigns the element paths
  useSMHandling: () => ({ setData: async (element: any) => ({ ...element, timestamp: 'now' }) }),
}))

vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({ downloadFile: vi.fn(), valueUrl: () => ({ url: '', isExternal: false }) }),
}))

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    disconnect () {}
    observe () {}
    unobserve () {}
  })
  vi.stubGlobal('visualViewport', {
    addEventListener: vi.fn(),
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    removeEventListener: vi.fn(),
    width: 1024,
  })
})

const mounted: VueWrapper[] = []

afterEach(() => {
  for (const wrapper of mounted.splice(0)) {
    wrapper.unmount()
  }
  document.body.innerHTML = ''
})

function mountPlugin (submodel: unknown) {
  const wrapper = mount(RailwayFireProtection, {
    attachTo: document.body,
    props: { submodelElementData: submodel as any },
    global: {
      plugins: [createVuetify(), createPinia()],
      stubs: {
        VisualizationHeader: true,
        PDFPreview: { template: '<div data-test="pdf-preview" />' },
        ImagePreview: true,
      },
    },
  })
  mounted.push(wrapper)
  return wrapper
}

function withPath (submodel: any) {
  return { ...structuredClone(submodel), path: '/submodels/abc' }
}

describe('RailwayFireProtection_v1_0', () => {
  it('declares the IDTA 02102 semanticId', () => {
    expect((RailwayFireProtection as any).semanticId).toBe('https://admin-shell.io/idta/cds/RailwayFireProtection/1')
  })

  it('shows an info alert without requirement sets', async () => {
    const wrapper = mountPlugin({ idShort: 'RailwayFireProtection', modelType: 'Submodel', path: '/submodels/abc', submodelElements: [] })
    await flushPromises()

    expect(wrapper.text()).toContain('No requirement sets found in this submodel.')
  })

  describe('with the official IDTA 02102 example', () => {
    it('shows the product summary and one tile per requirement set', async () => {
      const wrapper = mountPlugin(withPath(officialExample))
      await flushPromises()

      expect(wrapper.text()).toContain('Silicone-Schaum RF035')
      expect(wrapper.text()).toContain('BIW Isolierstoffe GmbH')
      // The example lists 0.36 kg combustible of 0.35 kg total mass: a note instead of the chart
      expect(wrapper.text()).toContain('The combustible mass exceeds the total mass')
      expect(wrapper.find('.rfp-mass-chart').exists()).toBe(false)

      const tiles = wrapper.findAll('[aria-haspopup="dialog"]')
      expect(tiles.map(tile => tile.attributes('aria-label'))).toEqual([
        'R22: Compliant: Hazard Level 3. Show details',
        'R23: Compliant: Hazard Level 3. Show details',
      ])
      expect(tiles[0].text()).toContain('HL3')
      expect(tiles[0].text()).toContain('1 report')
      expect(tiles[0].text()).toContain('DIN EN ISO 5659-2; T10.03')
      expect(tiles[0].text()).toContain('74,0')
      expect(tiles[0].text()).toContain('EN 17084 Verfahren 1; T11.02')
      expect(tiles[0].text()).toContain('0,0477')
      // The requirement text is only shown in the details, and the order cannot be changed
      expect(tiles[0].text()).not.toContain('requirement for hazard level')
      expect(wrapper.find('.mdi-sort').exists()).toBe(false)
    })

    it('opens the details with report, tests and laboratory when a tile is clicked', async () => {
      const wrapper = mountPlugin(withPath(officialExample))
      await flushPromises()

      await wrapper.findAll('[aria-haspopup="dialog"]')[1].trigger('click')
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 50))
      await flushPromises()

      const dialog = document.body.querySelector('.rfp-details')
      expect(dialog).not.toBeNull()
      const text = dialog?.textContent ?? ''
      expect(text).toContain('R23 requirement for hazard level HL3 according to EN 45545-2')
      expect(text).toContain('Compliant: Hazard Level 3')
      expect(text).toContain('Report 2024-1176')
      expect(text).toContain('DIN EN ISO 5659-2; T10.03')
      expect(text).toContain('0,0477')
      expect(text).toContain('Brandhaus Rhein-Main GmbH & Co. KG')
      expect(text).toContain('kontakt@brandhaus-RM.de')
    })
  })
})
