import type { WritableComputedRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useEdcDialogRoute } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute'

async function setup (url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: { template: '<div />' }, path: '/assets' }],
  })
  await router.push(url)
  await router.isReady()

  let dialog!: WritableComputedRef<boolean>
  let infrastructure!: WritableComputedRef<string | null>
  mount({
    setup () {
      const { dialogOpen, dialogState } = useEdcDialogRoute()
      dialog = dialogOpen('create-asset')
      infrastructure = dialogState('infrastructure')
      return () => h('div')
    },
  }, {
    global: { plugins: [router] },
  })

  return { router, dialog, infrastructure }
}

describe('useEdcDialogRoute', () => {
  it('keeps the open dialog and its state in the query and removes both on close', async () => {
    const { router, dialog, infrastructure } = await setup('/assets?proxy=default')

    dialog.value = true
    await flushPromises()
    infrastructure.value = 'secured-infrastructure'
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({
      proxy: 'default',
      dialog: 'create-asset',
      dialogInfrastructure: 'secured-infrastructure',
    })

    dialog.value = false
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ proxy: 'default' })
    expect(infrastructure.value).toBeNull()
  })

  it('restores an open dialog and its state from the query, e.g. after a login redirect', async () => {
    const { dialog, infrastructure } = await setup('/assets?dialog=create-asset&dialogInfrastructure=secured-infrastructure')

    expect(dialog.value).toBe(true)
    expect(infrastructure.value).toBe('secured-infrastructure')
  })

  it('ignores state changes while no dialog is open', async () => {
    const { router, infrastructure } = await setup('/assets')

    infrastructure.value = 'secured-infrastructure'
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({})
  })
})
