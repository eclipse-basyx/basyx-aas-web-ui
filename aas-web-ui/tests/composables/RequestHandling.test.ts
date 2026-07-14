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
  showLoginRequiredSnackbar: vi.fn(),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getSnackbar: { status: false },
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
    showLoginRequiredSnackbar: mockDeps.showLoginRequiredSnackbar,
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
    expect(mockDeps.showLoginRequiredSnackbar).toHaveBeenCalledOnce()
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

  it('treats a BaSyx Go 403 error payload without an OAuth token as a login-required response', async () => {
    mockState.selectedInfrastructure = {
      id: 'infra-1',
      auth: {
        securityType: 'OAuth2',
        oauth2: {
          authFlow: 'auth-code',
        },
      },
      token: undefined,
    }

    global.fetch = vi.fn().mockResolvedValue(
      Response.json(
        [{
          code: 403,
          messageType: 'Error',
          correlationId: 'Middleware-403-Rules-Forbidden-Denied',
          text: 'access denied',
        }],
        {
          status: 403,
          statusText: 'Forbidden',
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { getRequest } = useRequestHandling()

    const response = await getRequest('/api/shell-descriptors/old-aas', 'retrieving AAS Descriptor', false)

    expect(response).toEqual(expect.objectContaining({ success: false, status: 403 }))
    expect(mockDeps.setAuthenticationStatusForInfrastructure).toHaveBeenCalledWith('infra-1', false)
    expect(mockDeps.showLoginRequiredSnackbar).toHaveBeenCalledOnce()
  })

  it('shows the login prompt again after switching away from and back to an unauthenticated OAuth infrastructure', async () => {
    const oauthInfrastructure = {
      id: 'infra-secured',
      auth: {
        securityType: 'OAuth2',
        oauth2: {
          authFlow: 'auth-code',
        },
      },
      token: undefined,
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce(
        Response.json([{ code: 403, text: 'access denied' }], {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({}, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        Response.json([{ code: 403, text: 'access denied' }], {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')

    mockState.selectedInfrastructure = oauthInfrastructure
    await useRequestHandling().getRequest('/secured/shells', 'retrieving AAS list', false)

    mockState.selectedInfrastructure = {
      id: 'infra-local',
      auth: { securityType: 'No Authentication' },
      token: undefined,
    }
    await useRequestHandling().getRequest('/local/description', 'connecting to AAS Environment', true)

    mockState.selectedInfrastructure = oauthInfrastructure
    await useRequestHandling().getRequest('/secured/shells', 'retrieving AAS list', false)

    expect(mockDeps.showLoginRequiredSnackbar).toHaveBeenCalledTimes(2)
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
      Response.json([{ code: 403, text: 'Forbidden' }], {
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
        color: 'warning',
        baseError: 'Access denied!',
      }),
    )
  })

  it('stores backend payload details for follow-up UI messaging', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      Response.json(
        [
          {
            messageType: 'Error',
            text: 'access denied',
            code: '403',
            correlationId: 'Middleware-403-Rules-Forbidden-Denied',
            timestamp: '2026-04-02T07:12:28Z',
          },
        ],
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

  it('treats HTTP 409 JSON response without payload code as failure', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      Response.json(
        { message: 'Submodel already exists' },
        {
          status: 409,
          statusText: 'Conflict',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': '37',
          },
        },
      ),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { postRequest, consumeLastRequestFailureStatus } = useRequestHandling()

    const response = await postRequest('/api/submodels', '{}', new Headers(), 'creating Submodel', true)

    expect(response).toEqual({ success: false, status: 409 })
    expect(consumeLastRequestFailureStatus()).toBe(409)
  })

  it('stores object error payload details from BFF responses', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      Response.json(
        {
          error: 'Route not found',
          status: 404,
          code: 'ROUTE_NOT_FOUND',
          method: 'POST',
          path: '/api/catena-x/edc/default/submodels/fetch',
        },
        {
          status: 404,
          statusText: 'Not Found',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': '156',
          },
        },
      ),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { postRequest, consumeLastRequestFailureDetails, consumeLastRequestFailureStatus } = useRequestHandling()

    const response = await postRequest('/api/catena-x/edc/default/submodels/fetch', '{}', new Headers(), 'fetching Submodel', true)

    expect(response).toEqual({ success: false, status: 404 })
    expect(consumeLastRequestFailureStatus()).toBe(404)
    const details = consumeLastRequestFailureDetails()
    expect(details).toContain('Status: 404')
    expect(details).toContain('Code: ROUTE_NOT_FOUND')
    expect(details).toContain('Message: Route not found')
    expect(details).toContain('Route: POST /api/catena-x/edc/default/submodels/fetch')
  })

  it('keeps empty text payload as valid response data in getRequest', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': '1',
        },
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { getRequest } = useRequestHandling()

    const response = await getRequest('/api/plain', 'retrieving text', true)

    expect(response).toEqual(
      expect.objectContaining({
        success: true,
        data: '',
        status: 200,
      }),
    )
  })
})
