import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import QueryLanguageEditor from '@/components/QueryLanguage/QueryLanguageEditor.vue'
import { shortcuts } from '@/pages/modules/QueryLanguage.vue'
import { hotkeyStub } from '../../helpers/vuetifyStubs'

vi.mock('@/components/QueryLanguage/monacoQueryLanguage', () => ({ queryLanguageSchemas: [] }))
vi.mock('@/composables/RequestHandling', () => ({ useRequestHandling: vi.fn() }))

const suggest = vi.fn()
const editor = defineComponent({
  setup (_, { expose }) {
    expose({ suggest })
  },
  template: '<div />',
})

async function mountEditor () {
  const wrapper = mount(QueryLanguageEditor, {
    props: { modelValue: '' },
    attrs: { id: 'query-language-editor' },
    attachTo: document.body,
    global: { stubs: { CodeEditor: editor, VHotkey: hotkeyStub, VProgressLinear: true, VAlert: true } },
  })
  await vi.dynamicImportSettled()
  await flushPromises()
  return wrapper
}

describe('Query Language command palette shortcuts', () => {
  beforeEach(() => {
    suggest.mockClear()
  })

  it('registers the displayed shortcut and opens suggestions after the palette can close', async () => {
    const wrapper = await mountEditor()
    const [command] = shortcuts({ route: { name: 'QueryLanguage' } as RouteLocationNormalizedLoaded })
    expect(command.title).toBe('Show Query Suggestions')
    expect(wrapper.getComponent(hotkeyStub).props('keys')).toBe(command.keys)
    command.handler(new KeyboardEvent('keydown'))
    expect(suggest).not.toHaveBeenCalled()
    await nextTick()
    expect(suggest).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('does not act on an editor that unmounts while the command is queued', async () => {
    const wrapper = await mountEditor()
    const [command] = shortcuts({ route: { name: 'QueryLanguage' } as RouteLocationNormalizedLoaded })
    command.handler(new KeyboardEvent('keydown'))
    wrapper.unmount()
    await nextTick()
    expect(suggest).not.toHaveBeenCalled()
  })
})
