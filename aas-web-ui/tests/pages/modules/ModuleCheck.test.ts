import type { ModuleNavigationRoute } from '@/types/Application'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ModuleCheck from '@/pages/modules/ModuleCheck.vue'

const mockState = vi.hoisted(() => ({
  moduleRoutes: [] as Array<ModuleNavigationRoute>,
  availableModules: [] as Array<string>,
  visibleModules: [] as Array<string>,
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    get getModuleRoutes () {
      return mockState.moduleRoutes
    },
  }),
}))

vi.mock('@/composables/ModuleHandling', () => ({
  useModuleHandling: () => ({
    isModuleAvailable: (moduleName: string) => mockState.availableModules.includes(moduleName),
    isModuleVisible: (moduleName: string) => mockState.visibleModules.includes(moduleName),
    getModuleRouteLocation: (moduleName: string) => mockState.availableModules.includes(moduleName)
      ? { path: `/modules/${moduleName.toLowerCase()}`, query: { aas: 'remembered-aas' } }
      : undefined,
  }),
}))

const stubs = {
  VContainer: { template: '<div><slot /></div>' },
  VCard: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VCardSubtitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VTable: { template: '<table><slot /></table>' },
  VChip: { template: '<span class="chip"><slot /></span>' },
  VIcon: { template: '<i class="icon" />' },
  VBtn: { props: ['to'], template: '<a class="link" :data-to="to.path" :data-aas="to.query.aas"><slot /></a>' },
  VEmptyState: { props: ['title'], template: '<div class="empty-state">{{ title }}</div>' },
}

function mountModuleCheck () {
  return mount(ModuleCheck, { global: { stubs } })
}

describe('ModuleCheck', () => {
  beforeEach(() => {
    mockState.moduleRoutes = [
      { path: '/modules/testinvisible', name: 'TestInvisible', meta: { title: 'TestInvisible' } },
      { path: '/modules/catenaxplorer', name: 'CatenaXplorer', meta: { title: 'CatenaXplorer' } },
      { path: '/modules/test', name: 'Test', meta: { title: 'TestTitle' } },
      { path: '/modules/testonlymobile', name: 'TestOnlyMobile', meta: { title: 'TestOnlyMobile' } },
    ]
    mockState.availableModules = ['Test', 'TestInvisible', 'CatenaXplorer']
    mockState.visibleModules = ['Test', 'CatenaXplorer']
  })

  it('lists only Test* modules, sorted by name', () => {
    const rows = mountModuleCheck().findAll('tbody tr')

    expect(rows.map(row => row.find('td div').text())).toEqual([
      'TestTitle',
      'TestInvisible',
      'TestOnlyMobile',
    ])
  })

  it('shows the module name below the title only if they differ', () => {
    const rows = mountModuleCheck().findAll('tbody tr')

    expect(rows.map(row => row.find('.text-caption').exists() ? row.find('.text-caption').text() : null)).toEqual([
      'Test',
      null,
      null,
    ])
  })

  it('shows availability and visibility of each module', () => {
    const rows = mountModuleCheck().findAll('tbody tr')

    expect(rows.map(row => row.findAll('.chip').map(chip => chip.text()))).toEqual([
      ['Available', 'Visible'],
      ['Available', 'Hidden'],
      ['Not available', 'Hidden'],
    ])
  })

  it('links only available modules, using their route location', () => {
    const links = mountModuleCheck().findAll('.link')

    expect(links.map(link => link.attributes('data-to'))).toEqual(['/modules/test', '/modules/testinvisible'])
    expect(links.map(link => link.attributes('data-aas'))).toEqual(['remembered-aas', 'remembered-aas'])
  })

  it('lists child routes indented below their module, in manifest order', () => {
    mockState.moduleRoutes = [
      {
        path: '/modules/testchildroutes',
        name: 'TestChildRoutes',
        meta: { title: 'TestChildRoutes' },
        children: [
          { path: 'inherited', name: 'TestChildRoutes__Inherited', meta: { title: 'Inherited Requirements' } },
          { path: 'full-only', name: 'TestChildRoutes__FullOnly', meta: { title: 'Only Full Infrastructure' } },
        ],
      },
      { path: '/modules/test', name: 'Test', meta: { title: 'TestTitle' } },
    ]
    mockState.availableModules = ['Test', 'TestChildRoutes', 'TestChildRoutes__Inherited']

    const rows = mountModuleCheck().findAll('tbody tr')
    const firstCells = rows.map(row => row.find('td'))

    expect(firstCells.map(cell => cell.find('.text-caption').exists() ? cell.find('.text-caption').text() : cell.text()))
      .toEqual(['Test', 'TestChildRoutes', 'TestChildRoutes__Inherited', 'TestChildRoutes__FullOnly'])
    expect(firstCells.map(cell => cell.classes('ps-10'))).toEqual([false, false, true, true])
    expect(firstCells.map(cell => cell.find('.icon').exists())).toEqual([false, false, true, true])
    expect(mountModuleCheck().findAll('.link').map(link => link.attributes('data-to'))).toEqual([
      '/modules/test',
      '/modules/testchildroutes',
      '/modules/testchildroutes__inherited',
    ])
  })

  it('shows an empty state when there are no Test* modules', () => {
    mockState.moduleRoutes = [{ path: '/modules/catenaxplorer', name: 'CatenaXplorer' }]

    const wrapper = mountModuleCheck()

    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.find('.empty-state').text()).toBe('No Test* modules found')
  })
})
