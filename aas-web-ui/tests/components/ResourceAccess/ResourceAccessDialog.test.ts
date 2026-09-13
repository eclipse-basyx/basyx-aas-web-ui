import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ResourceAccessDialog from '@/components/ResourceAccess/ResourceAccessDialog.vue'

const environment = vi.hoisted(() => ({ template: 'full' }))

const client = vi.hoisted(() => ({
  getOverview: vi.fn(),
  putPolicy: vi.fn(),
  deletePolicy: vi.fn(),
  createGrant: vi.fn(),
  updateGrant: vi.fn(),
  deleteGrant: vi.fn(),
  replaceOwners: vi.fn(),
  replaceManagers: vi.fn(),
}))

vi.mock('@/composables/Client/ResourceAccessClient', () => ({ useResourceAccessClient: () => client }))
vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({ supportsResourceAccess: () => true,
    getSelectedInfrastructure: { get template () {
      return environment.template
    }, auth: { securityType: 'No Authentication' } },
  }),
}))

const target = {
  kind: 'aas' as const,
  label: 'Asset Administration Shell: urn:aas',
  endpoint: 'https://host/shells/dXJuOmFhcw',
  componentKey: 'AASRepo' as const,
}
const resource = { IDENTIFIABLE: '$aas("urn:aas")' } as const
const overview = {
  revision: 1,
  resource,
  localPolicy: null,
  effectivePolicy: { RESOURCE: resource, rules: [] },
  owners: [{ issuer: 'https://issuer', subject: 'owner' }],
  managers: [],
  grants: [],
}

const stubs = {
  VAlert: { template: '<div><slot /></div>' },
  VBtn: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
  VCard: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VCardSubtitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VDialog: { template: '<div><slot /></div>' },
  VIcon: true,
  VProgressLinear: true,
  VSkeletonLoader: true,
  VSpacer: true,
  VTab: { template: '<div><slot /></div>' },
  VTabs: { template: '<div><slot /></div>' },
  VWindow: { template: '<div><slot /></div>' },
  VWindowItem: { template: '<div><slot /></div>' },
  VExpansionPanels: { template: '<div><slot /></div>' },
  VExpansionPanel: { template: '<div><slot /></div>' },
  VExpansionPanelText: { template: '<div><slot /></div>' },
  ShareLinkManager: true,
  GrantManager: true,
  PolicyManager: true,
  PrincipalManager: true,
}

describe('ResourceAccessDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    environment.template = 'full'
    client.getOverview.mockResolvedValue({ ok: true, data: structuredClone(overview), etag: '"revision-1"' })
    client.putPolicy.mockResolvedValue({ ok: true })
    client.deletePolicy.mockResolvedValue({ ok: true })
    client.replaceManagers.mockResolvedValue({ ok: true })
  })

  it.each(['mono-repo', 'mono-all'])('blocks descriptor management for %s', async template => {
    environment.template = template
    const wrapper = mount(ResourceAccessDialog, {
      props: { modelValue: false, target: { ...target, kind: 'aas-descriptor', componentKey: 'AASRegistry' } },
      global: { stubs },
    })
    await (wrapper.vm as any).load()
    expect(client.getOverview).not.toHaveBeenCalled()
    expect((wrapper.vm as any).enabled).toBe(false)
  })

  it('copies the effective policy only after the explicit localization action', async () => {
    const wrapper = mountDialog()
    await (wrapper.vm as any).load()
    await (wrapper.vm as any).localizePolicy()
    expect(client.putPolicy).toHaveBeenCalledWith(target, { RESOURCE: resource, rules: [] }, '"revision-1"')
  })

  it('confirms inheritance changes before sharing and uses the refreshed ETag', async () => {
    const wrapper = mountDialog()
    const vm = wrapper.vm as any
    await vm.load()
    const grant = { principal: { issuer: 'https://issuer', subject: 'reader' }, rights: ['READ'] }
    await vm.createGrant(grant)
    expect(vm.confirmLocalize).toBe(true)
    expect(client.putPolicy).not.toHaveBeenCalled()
    expect(client.createGrant).not.toHaveBeenCalled()
    client.getOverview.mockResolvedValue({ ok: true, data: { ...structuredClone(overview), localPolicy: { RESOURCE: resource, rules: [] } }, etag: '"revision-2"' })
    client.createGrant.mockResolvedValue({ ok: true })
    await vm.localizePolicy()
    expect(client.createGrant).toHaveBeenCalledWith(target, grant, '"revision-2"')
    expect(vm.savedGrantVersion).toBe(1)
  })

  it('cancels first-time sharing without changing policies or grants', async () => {
    const wrapper = mountDialog()
    const vm = wrapper.vm as any
    await vm.load()
    await vm.createGrant({ principal: { issuer: 'https://issuer', subject: 'reader' }, rights: ['READ'] })
    vm.cancelLocalize()
    expect(vm.pendingGrant).toBeUndefined()
    expect(client.putPolicy).not.toHaveBeenCalled()
    expect(client.createGrant).not.toHaveBeenCalled()
    expect(vm.savedGrantVersion).toBe(0)
  })

  it.each(['policy', 'refresh', 'grant'])('preserves the sharing draft when %s fails', async failure => {
    const wrapper = mountDialog()
    const vm = wrapper.vm as any
    await vm.load()
    await vm.createGrant({ principal: { issuer: 'https://issuer', subject: 'reader' }, rights: ['READ'] })
    client.putPolicy.mockResolvedValue(failure === 'policy' ? { ok: false, status: 412 } : { ok: true })
    client.getOverview.mockResolvedValue(failure === 'refresh'
      ? { ok: false, status: 500 }
      : {
          ok: true, data: { ...structuredClone(overview), localPolicy: { RESOURCE: resource, rules: [] } }, etag: '"revision-2"',
        })
    client.createGrant.mockResolvedValue({ ok: false, status: 403 })
    await vm.localizePolicy()
    expect(vm.savedGrantVersion).toBe(0)
    if (failure !== 'grant') {
      expect(client.createGrant).not.toHaveBeenCalled()
    }
  })

  it('keeps an unsaved sharing draft open until the user confirms discarding', async () => {
    const wrapper = mountDialog()
    const vm = wrapper.vm as any
    await vm.load()
    vm.sharingDraft = true
    vm.requestClose()
    expect(vm.confirmDiscard).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('restores inheritance by deleting the local policy with the current ETag', async () => {
    const wrapper = mountDialog()
    await (wrapper.vm as any).load()
    await (wrapper.vm as any).deletePolicy()
    expect(client.deletePolicy).toHaveBeenCalledWith(target, '"revision-1"')
  })

  it('reloads stale manager state and keeps the conflict warning visible', async () => {
    client.replaceManagers.mockResolvedValue({
      ok: false,
      status: 412,
      message: 'Access was changed by someone else. The latest version has been loaded; review and retry.',
    })
    client.getOverview
      .mockResolvedValueOnce({ ok: true, data: structuredClone(overview), etag: '"revision-1"' })
      .mockResolvedValueOnce({
        ok: true,
        data: { ...structuredClone(overview), revision: 2, managers: [{ issuer: 'https://issuer', subject: 'new-manager' }] },
        etag: '"revision-2"',
      })
    const wrapper = mountDialog()
    await (wrapper.vm as any).load()
    ;(wrapper.vm as any).managers = [{ issuer: 'https://issuer', subject: 'stale-manager' }]
    await (wrapper.vm as any).saveManagers()
    await nextTick()
    expect(client.replaceManagers).toHaveBeenCalledWith(target, [{ issuer: 'https://issuer', subject: 'stale-manager' }], '"revision-1"')
    expect((wrapper.vm as any).managers).toEqual([{ issuer: 'https://issuer', subject: 'new-manager' }])
    expect(wrapper.text()).toContain('changed by someone else')
  })

  it('does not start a second mutation while a request is loading', async () => {
    const wrapper = mountDialog()
    ;(wrapper.vm as any).loading = true
    await (wrapper.vm as any).saveManagers()
    expect(client.replaceManagers).not.toHaveBeenCalled()
  })
})

function mountDialog () {
  return mount(ResourceAccessDialog, {
    props: { modelValue: false, target },
    global: { stubs },
  })
}
