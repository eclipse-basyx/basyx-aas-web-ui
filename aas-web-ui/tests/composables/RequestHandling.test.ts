import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  selectedInfrastructure: {
    id: 'infra-1',
    auth: { securityType: 'Bearer Token', bearerToken: { token: 'token-1' } },
    token: undefined,
  } as any,
  isLoginAvailable: true,
  authPrefix: 'Bearer',
  authDescriptionExemption: false,
}))

const mockDeps = vi.hoisted(() => ({
  dispatchSnackbar: vi.fn(),
  setAuthenticationStatusForInfrastructure: vi.fn(),
  login: vi.fn(),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: mockDeps.dispatchSnackbar,
  }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getSelectedInfrastructure: mockState.selectedInfrastructure,
    getIsLoginAvailable: mockState.isLoginAvailable,
    setAuthenticationStatusForInfrastructure: mockDeps.setAuthenticationStatusForInfrastructure,
  }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getAuthorizationPrefix: mockState.authPrefix,
    getAuthorizationDescriptionEndpointExemption: mockState.authDescriptionExemption,
  }),
}))

vi.mock('@/composables/Auth/useAuth', () => ({
  useAuth: () => ({
    login: mockDeps.login,
  }),
}))

describe('RequestHandling.ts', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockState.selectedInfrastructure = {
      id: 'infra-1',
      auth: { securityType: 'Bearer Token', bearerToken: { token: 'token-1' } },
      token: undefined,
    }
    mockState.isLoginAvailable = true
    mockState.authPrefix = 'Bearer'
    mockState.authDescriptionExemption = false
  })

  it('handles 401 with authentication-required snackbar and infra auth reset', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('', {
        status: 401,
        statusText: 'Unauthorized',
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { deleteRequest } = useRequestHandling()

    const response = await deleteRequest('/api/submodels/1', 'deleting Submodel', false)

    expect(response).toEqual({ success: false, status: 401 })
    expect(mockDeps.setAuthenticationStatusForInfrastructure).toHaveBeenCalledWith('infra-1', false)
    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'warning',
        baseError: 'Authentication required!',
        actionText: 'Login',
      }),
    )
  })

  it('handles 403 with dedicated forbidden snackbar and no login action', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('', {
        status: 403,
        statusText: 'Forbidden',
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { deleteRequest, consumeLastRequestFailureStatus } = useRequestHandling()

    const response = await deleteRequest('/api/submodels/1', 'deleting Submodel', false)

    expect(response).toEqual({ success: false, status: 403 })
    expect(consumeLastRequestFailureStatus()).toBe(403)
    expect(consumeLastRequestFailureStatus()).toBeUndefined()
    expect(mockDeps.setAuthenticationStatusForInfrastructure).not.toHaveBeenCalled()
    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'warning',
        baseError: 'Access denied!',
        extendedError: 'You are not allowed to perform this action.',
      }),
    )
  })

  it('returns structured status for non-auth failures and keeps generic error snackbar', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { deleteRequest } = useRequestHandling()

    const response = await deleteRequest('/api/submodels/1', 'deleting Submodel', false)

    expect(response).toEqual({ success: false, status: 500 })
    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'error',
      }),
    )
  })

  it('treats PUT array error payload with code 403 as failure', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ code: 403, text: 'Forbidden' }]), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '36',
        },
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { putRequest, consumeLastRequestFailureStatus } = useRequestHandling()

    const response = await putRequest('/api/sme/1', '{}', new Headers(), 'updating Submodel Element', false)

    expect(response).toEqual({ success: false, status: 403 })
    expect(consumeLastRequestFailureStatus()).toBe(403)
    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'error',
      }),
    )
  })

  it('stores backend payload details for follow-up UI messaging', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            messageType: 'Error',
            text: 'access denied',
            code: '403',
            correlationId: 'Middleware-403-Rules-Forbidden-Denied',
            timestamp: '2026-04-02T07:12:28Z',
          },
        ]),
        {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': '171',
          },
        },
      ),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { postRequest, consumeLastRequestFailureStatus, consumeLastRequestFailureDetails } = useRequestHandling()

    const response = await postRequest('/api/submodels', '{}', new Headers(), 'creating Submodel', false)

    expect(response).toEqual({ success: false, status: 403 })
    expect(consumeLastRequestFailureStatus()).toBe(403)
    const details = consumeLastRequestFailureDetails()
    expect(details).toContain('Status: 403')
    expect(details).toContain('Message Type: Error')
    expect(details).toContain('Text: access denied')
    expect(details).toContain('Correlation ID: Middleware-403-Rules-Forbidden-Denied')
    expect(consumeLastRequestFailureDetails()).toBeUndefined()
  })
})
