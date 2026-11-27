import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreateAssetDialog from '@/pages/modules/EclipseDataspaceConnector/components/Assets/Dialogs/CreateAssetDialog.vue'
import { formStub } from '../../../helpers/vuetifyStubs'

const mocks = vi.hoisted(() => ({
  createAsset: vi.fn(),
  dispatchSnackbar: vi.fn(),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({ createAsset: mocks.createAsset }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ getSnackbar: { status: false }, dispatchSnackbar: mocks.dispatchSnackbar }),
}))

const slotStub = { template: '<div><slot /></div>' }

function mountDialog (fromTemplate = false) {
  return mount(CreateAssetDialog, {
    props: { modelValue: true, proxyId: 'proxy-a', fromTemplate },
    global: {
      stubs: {
        'v-dialog': slotStub,
        'v-sheet': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-layout': slotStub,
        'v-main': slotStub,
        'v-form': formStub,
        'v-divider': true,
        'v-spacer': true,
        'v-text-field': {
          props: ['modelValue', 'label'],
          emits: ['update:modelValue'],
          template: '<input :data-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
        },
        'v-btn': { props: ['text', 'disabled'], emits: ['click'], template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>' },
        'JSONPreview': { props: ['jsonContent'], template: '<pre class="preview">{{ jsonContent }}</pre>' },
        'EdcAssetSettingsDrawer': true,
        'EdcAssetOAuth2Fields': true,
        'EdcAssetSettingsButton': true,
        'EdcTemplateSelect': {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="" /><option value="default" /><option value="digitalTwinRegistry" /></select>',
        },
      },
    },
  })
}

describe('CreateAssetDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createAsset.mockResolvedValue({ success: true, data: { '@id': 'dtr"test', 'createdAt': 1 } })
  })

  it('creates an asset with a quote in its ID, as the value was entered', async () => {
    const wrapper = mountDialog()
    await wrapper.find('input[data-label="Asset ID *"]').setValue('dtr"test')
    await wrapper.find('input[data-label="Asset Endpoint *"]').setValue('https://backend.test/api')

    const preview = JSON.parse(wrapper.find('pre.preview').text())
    await wrapper.findAll('button').find(button => button.text() === 'Create')!.trigger('click')
    await flushPromises()

    const asset = mocks.createAsset.mock.calls[0]![1]
    expect(mocks.createAsset).toHaveBeenCalledWith('proxy-a', expect.any(Object))
    expect(asset).toMatchObject({
      '@id': 'dtr"test',
      'properties': { id: 'dtr"test' },
      'dataAddress': { type: 'HttpData', baseUrl: 'https://backend.test/api' },
    })
    // Unfilled optional placeholders are left out, the preview shows the created asset
    expect(asset.properties).not.toHaveProperty('displayName')
    expect(asset.dataAddress).not.toHaveProperty('oauth2:clientId')
    expect(preview).toEqual(asset)
    expect(wrapper.emitted('assets-created')).toEqual([['dtr"test']])
  })

  it('does not count a mandatory field with only spaces as filled', async () => {
    const wrapper = mountDialog()
    await wrapper.find('input[data-label="Asset ID *"]').setValue(' '.repeat(3))
    await wrapper.find('input[data-label="Asset Endpoint *"]').setValue('https://backend.test/api')

    expect(createButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('shows the fields of a template only after it is chosen', async () => {
    const wrapper = mountDialog(true)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(createButton(wrapper).attributes('disabled')).toBeDefined()

    await wrapper.find('select').setValue('digitalTwinRegistry')
    expect(wrapper.find('input[data-label="Digital Twin Registry Asset ID *"]').exists()).toBe(true)
  })
})

function createButton (wrapper: ReturnType<typeof mountDialog>) {
  return wrapper.findAll('button').find(button => button.text() === 'Create')!
}
