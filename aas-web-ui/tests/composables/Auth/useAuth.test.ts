import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  selectedInfrastructure: {
    id: 'secured-infrastructure',
    auth: {
      securityType: 'OAuth2',
      oauth2: {
        host: 'https://idp.example',
        clientId: 'web-ui',
        authFlow: 'auth-code',
      },
    },
  } as any,
  snackbar: { status: false } as any,
}))

const mocks = vi.hoisted(() => ({
  dispatchSnackbar: vi.fn((snackbar: any) => {
    state.snackbar = snackbar
  }),
  dispatchUpdateInfrastructure: vi.fn(),
  setAuthenticationStatusForInfrastructure: vi.fn(),
  dispatchClearAASList: vi.fn(),
  dispatchClearTreeview: vi.fn(),
  dispatchTriggerAASListReload: vi.fn(),
  dispatchTriggerTreeviewReload: vi.fn(),
  discoverOpenIdConfiguration: vi.fn(),
  startLogoutTransaction: vi.fn(() => ({
    callbackPath: '/',
    redirectUri: 'http://localhost:3000/',
  })),
  routerReplace: vi.fn(),
}))

vi.mock('@/composables/Auth/OpenIdConnect', () => ({
  discoverOpenIdConfiguration: mocks.discoverOpenIdConfiguration,
}))

vi.mock('@/composables/Auth/OAuth2Navigation', () => ({
  startLogoutTransaction: mocks.startLogoutTransaction,
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    get getSelectedInfrastructure () {
      return state.selectedInfrastructure
    },
    get getIsLoginAvailable () {
      return true
    },
    dispatchUpdateInfrastructure: mocks.dispatchUpdateInfrastructure,
    setAuthenticationStatusForInfrastructure: mocks.setAuthenticationStatusForInfrastructure,
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    get getSnackbar () {
      return state.snackbar
    },
    dispatchSnackbar: mocks.dispatchSnackbar,
    dispatchClearAASList: mocks.dispatchClearAASList,
    dispatchClearTreeview: mocks.dispatchClearTreeview,
    dispatchTriggerAASListReload: mocks.dispatchTriggerAASListReload,
    dispatchTriggerTreeviewReload: mocks.dispatchTriggerTreeviewReload,
  }),
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    state.selectedInfrastructure = {
      id: 'secured-infrastructure',
      auth: {
        securityType: 'OAuth2',
        oauth2: {
          host: 'https://idp.example',
          clientId: 'web-ui',
          authFlow: 'auth-code',
        },
      },
    }
    state.snackbar = { status: false }
    mocks.discoverOpenIdConfiguration.mockResolvedValue({})
    mocks.routerReplace.mockResolvedValue(undefined)
  })

  it('scopes a login-required snackbar to its infrastructure and ignores a stale Login action', async () => {
    const { useAuth } = await import('@/composables/Auth/useAuth')
    const { showLoginRequiredSnackbar } = useAuth()

    showLoginRequiredSnackbar()
    showLoginRequiredSnackbar()

    expect(mocks.dispatchSnackbar).toHaveBeenCalledTimes(1)
    expect(state.snackbar).toEqual(expect.objectContaining({
      infrastructureId: 'secured-infrastructure',
      actionText: 'Login',
    }))

    state.selectedInfrastructure = {
      id: 'local-infrastructure',
      auth: { securityType: 'No Authentication' },
    }
    await state.snackbar.actionCallback()

    expect(mocks.dispatchSnackbar).toHaveBeenCalledTimes(1)
  })

  it('re-enters the router after a local OAuth logout without an end-session endpoint', async () => {
    const { useAuth } = await import('@/composables/Auth/useAuth')
    const { logout } = useAuth({ replace: mocks.routerReplace } as any)

    await logout()

    expect(mocks.startLogoutTransaction).toHaveBeenCalledOnce()
    expect(mocks.routerReplace).toHaveBeenCalledWith('/')
    expect(mocks.dispatchTriggerAASListReload).not.toHaveBeenCalled()
    expect(mocks.dispatchTriggerTreeviewReload).not.toHaveBeenCalled()
  })

  it('re-enters the router after a non-OAuth local logout', async () => {
    state.selectedInfrastructure = {
      id: 'secured-infrastructure',
      auth: { securityType: 'Basic' },
      token: { accessToken: 'token' },
    }
    const { useAuth } = await import('@/composables/Auth/useAuth')
    const { logout } = useAuth({ replace: mocks.routerReplace } as any)

    await logout()

    expect(mocks.startLogoutTransaction).toHaveBeenCalledOnce()
    expect(mocks.routerReplace).toHaveBeenCalledWith('/')
  })

  it('keeps a logout discovery failure visible after clearing local authentication', async () => {
    mocks.discoverOpenIdConfiguration.mockRejectedValue(new Error('discovery unavailable'))
    const { useAuth } = await import('@/composables/Auth/useAuth')
    const { logout } = useAuth({ replace: mocks.routerReplace } as any)

    await logout()

    expect(mocks.routerReplace).toHaveBeenCalledWith('/')
    expect(mocks.dispatchSnackbar).toHaveBeenLastCalledWith(expect.objectContaining({
      text: 'Failed to initiate logout',
      extendedError: 'discovery unavailable',
    }))
  })
})
