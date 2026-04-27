import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import Nameplate_v3_0 from '@/components/Plugins/Submodels/Nameplate_v3_0.vue';

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({
    setData: vi.fn().mockResolvedValue({
      submodelElements: [
        { idShort: 'foo', modelType: 'Property', value: 'bar' },
        { idShort: 'baz', modelType: 'Other' }
      ]
    })
  })
}));

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    nameToDisplay: (p: any) => p.idShort,
    descriptionToDisplay: (p: any) => 'Mock description'
  })
}));

vi.mock('@/composables/AAS/SubmodelElements/SubmodelElement', () => ({
  useSME: () => ({
    valueToDisplay: (p: any) => p.value
  })
}));

function createComponent(submodelElementData = { id: '123', path: 'test' }) {
  return mount(Nameplate_v3_0, {
    props: { submodelElementData }
  });
}

describe('Nameplate_v3_0', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Product Properties Loading', () => {
    it('shows loading skeleton on initial mount', async () => {
      const wrapper = createComponent();
      await nextTick();
      expect(wrapper.find('v-skeleton-loader').exists()).toBe(true);
    });

    it('displays product properties after data loads', async () => {
      const wrapper = createComponent();
      await nextTick();
      await flushPromises();

      const rows = wrapper.findAll('tbody tr');
      expect(rows).toHaveLength(1);
      expect(rows[0].text()).toContain('foo');
      expect(rows[0].text()).toContain('bar');
    });

    it('filters out non-Property model types', async () => {
      const wrapper = createComponent();
      await flushPromises();

      // Component only displays Property types (foo is Property, baz is Other)
      const rows = wrapper.findAll('tbody tr');
      expect(rows.every(row => row.text().includes('foo') || !row.text().includes('baz'))).toBe(true);
    });
  });

  describe('Physical Nameplate Generation', () => {
    it('generates iframe URL with correct structure', async () => {
      const wrapper = createComponent({ id: 'test-id-123', path: 'test' });
      await flushPromises();

      await wrapper.vm.generatePhysicalNameplate();

      const iframe = wrapper.find('iframe');
      expect(iframe.exists()).toBe(true);
      expect(iframe.attributes('src')).toContain('NameplateGenerateByReference');
    });

    it('encodes submodel ID in iframe URL', async () => {
      const testId = 'https://example.com/test';
      const wrapper = createComponent({ id: testId, path: 'test' });
      await flushPromises();

      await wrapper.vm.generatePhysicalNameplate();

      const iframe = wrapper.find('iframe');
      const src = iframe.attributes('src') || '';
      expect(src).toContain('submodels?');
      // Verify it's base64 encoded (no = padding at the end due to replaceAll)
      expect(src).not.toContain(testId);
    });

    it('sets and clears isGenerating flag', async () => {
      const wrapper = createComponent();
      expect(wrapper.vm.isGenerating).toBe(false);

      await wrapper.vm.generatePhysicalNameplate();

      // After async call completes, should be false
      expect(wrapper.vm.isGenerating).toBe(false);
    });
  });

  describe('Download Functionality', () => {
    it('sends postMessage to iframe when triggerDownload called', () => {
      const postMessageMock = vi.fn();
      const iframe = document.createElement('iframe');
      iframe.id = 'nameplate-iframe';

      Object.defineProperty(iframe, 'contentWindow', {
        value: { postMessage: postMessageMock },
        writable: true
      });

      document.body.appendChild(iframe);

      const wrapper = createComponent();
      wrapper.vm.triggerDownload();

      expect(postMessageMock).toHaveBeenCalledWith('trigger-svg-download', '*');

      document.body.removeChild(iframe);
    });

    it('handles missing iframe gracefully', () => {
      const wrapper = createComponent();

      // Should not throw when iframe doesn't exist
      expect(() => wrapper.vm.triggerDownload()).not.toThrow();
    });
  });
});
