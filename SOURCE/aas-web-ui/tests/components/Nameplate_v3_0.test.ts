import { test, describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Nameplate_v3_0 from '@/components/Plugins/Submodels/Nameplate_v3_0.vue';
import { createVuetify } from 'vuetify';

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
    nameToDisplay: (p: any) => p.idShort
  })
}));

vi.mock('@/composables/AAS/SubmodelElements/SubmodelElement', () => ({
  useSME: () => ({
    valueToDisplay: (p: any) => p.value
  })
}));

test('loads and displays product properties', async () => {
  const vuetify = createVuetify();
  const wrapper = mount(Nameplate_v3_0, {
    global: {
      plugins: [vuetify]
    },
    props: {
      submodelElementData: { id: '123', path: 'test' }
    }
  });

  // initially loading
  expect(wrapper.findComponent({ name: 'VSkeletonLoader' }).exists()).toBe(true);

  await flushPromises();

  // after load
  const rows = wrapper.findAll('tbody tr');
  expect(rows.length).toBe(1); // only "Property" items
  expect(rows[0].text()).toContain('foo');
  expect(rows[0].text()).toContain('bar');
});

test('generates iframe URL when button clicked', async () => {
  const vuetify = createVuetify();
  const wrapper = mount(Nameplate_v3_0, {
    global: {
      plugins: [vuetify]
    },
    props: {
      submodelElementData: { id: 'abc', path: 'test' }
    }
  });

  await flushPromises();

  const button = wrapper.findAll('button')
  .find(b => b.text().includes('Generate Preview'));

  await button!.trigger('click');

  const iframe = wrapper.find('iframe');
  expect(iframe.exists()).toBe(true);
  expect(iframe.attributes('src')).toContain('NameplateGenerateByReference');
});

test('triggerDownload sends postMessage', () => {
  const postMessageMock = vi.fn();

  const iframe = document.createElement('iframe');
  iframe.id = 'nameplate-iframe';
  // @ts-ignore
  iframe.contentWindow = { postMessage: postMessageMock };

  document.body.appendChild(iframe);

  const vuetify = createVuetify();
  const wrapper = mount(Nameplate_v3_0, {
    global: {
      plugins: [vuetify]
    },
    props: { submodelElementData: {} }
  });

  wrapper.vm.triggerDownload();

  expect(postMessageMock).toHaveBeenCalledWith('trigger-svg-download', '*');
});
