import type { QuerySearchRouteState } from '@/composables/QueryLanguage/QuerySearchRoute'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useQuerySearchRoute } from '@/composables/QueryLanguage/QuerySearchRoute'

describe('useQuerySearchRoute', () => {
  it('keeps unrelated parameters and switches between text and advanced searches', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ component: { template: '<div />' }, path: '/' }],
    })
    await router.push({ path: '/', query: { aas: 'selected-shell' } })
    await router.isReady()

    let routeSearch!: ReturnType<typeof useQuerySearchRoute>
    mount({
      setup () {
        routeSearch = useQuerySearchRoute('aasSearch', 'aasQuery')
        return () => h('div')
      },
    }, {
      global: { plugins: [router] },
    })

    await routeSearch.commitSearch(' idShort:Motor ')
    expect(router.currentRoute.value.query).toEqual({
      aas: 'selected-shell',
      aasSearch: 'idShort:Motor',
    })
    expect(routeSearch.state.value).toEqual<QuerySearchRouteState>({
      expression: 'idShort:Motor',
      mode: 'search',
    })

    await routeSearch.commitAdvancedQuery({ $condition: { $boolean: true } })
    expect(router.currentRoute.value.query.aasSearch).toBeUndefined()
    expect(router.currentRoute.value.query.aasQuery).toBe('{"$condition":{"$boolean":true}}')

    await routeSearch.clear()
    expect(router.currentRoute.value.query).toEqual({ aas: 'selected-shell' })
  })

  it('does not add duplicate history entries for the current search', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ component: { template: '<div />' }, path: '/' }],
    })
    await router.push('/?smSearch=idShort%3AMotor')
    await router.isReady()

    let routeSearch!: ReturnType<typeof useQuerySearchRoute>
    mount({
      setup () {
        routeSearch = useQuerySearchRoute('smSearch', 'smQuery')
        return () => h('div')
      },
    }, {
      global: { plugins: [router] },
    })

    await expect(routeSearch.commitSearch('idShort:Motor')).resolves.toBe(false)
  })

  it('round-trips UTF-8 and reserved URL characters as one search parameter', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ component: { template: '<div />' }, path: '/' }],
    })
    await router.push('/')
    await router.isReady()

    let routeSearch!: ReturnType<typeof useQuerySearchRoute>
    mount({
      setup () {
        routeSearch = useQuerySearchRoute('aasSearch', 'aasQuery')
        return () => h('div')
      },
    }, {
      global: { plugins: [router] },
    })

    const expression = 'idShort:"Müller & Söhne?" globalAssetId:"urn:test#1"'
    await routeSearch.commitSearch(expression)

    expect(router.currentRoute.value.query).toEqual({ aasSearch: expression })
    expect(Object.keys(router.currentRoute.value.query)).toEqual(['aasSearch'])
    expect(router.currentRoute.value.fullPath).toContain('%26')
    expect(router.currentRoute.value.fullPath).toContain('%23')
    expect(router.currentRoute.value.fullPath).toContain('%22')
    expect(router.currentRoute.value.fullPath).toContain('M%C3%BCller')
  })
})
