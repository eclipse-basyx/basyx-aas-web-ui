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
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    get getSelectedInfrastructure () {
      return state.selectedInfrastructure
    },
    get getIsLoginAvailable () {
      return true
    },
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    get getSnackbar () {
      return state.snackbar
    },
    dispatchSnackbar: mocks.dispatchSnackbar,
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
})
