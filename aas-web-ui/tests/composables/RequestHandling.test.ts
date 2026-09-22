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
    get getSelectedInfrastructure () {
      return mockState.selectedInfrastructure
    },
    get getIsLoginAvailable () {
      return mockState.isLoginAvailable
    },
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

  it.each(['{ "value": 1 }\n', '{ malformed JSON', '', 'false'])('preserves attachment bytes in blob mode: %s', async source => {
    global.fetch = vi.fn().mockResolvedValue(new Response(source, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch
    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const response = await useRequestHandling().getRequest('/attachment', 'previewing', true, new Headers(), {}, 'blob')
    expect(response.success).toBe(true)
    expect(await response.data.text()).toBe(source)
  })

  it('keeps JSON parsing as the default and preserves error handling in blob mode', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response('{"value":1}', { headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response('{"message":"Forbidden"}', { status: 403, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch
    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { getRequest } = useRequestHandling()
    expect((await getRequest('/data', 'loading', true)).data).toEqual({ value: 1 })
    expect(await getRequest('/attachment', 'previewing', true, new Headers(), {}, 'blob')).toMatchObject({ success: false, status: 403 })
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

    const response = await deleteRequest('/api/submodels/1', new Headers(), 'deleting Submodel', false)

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

    const response = await deleteRequest('/api/submodels/1', new Headers(), 'deleting Submodel', false)

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

  it('does not apply a late authentication failure to a newly selected infrastructure', async () => {
    mockState.selectedInfrastructure = {
      id: 'infra-old',
      auth: { securityType: 'OAuth2', oauth2: { authFlow: 'auth-code' } },
      token: undefined,
    }

    let resolveRequest!: (response: Response) => void
    global.fetch = vi.fn().mockReturnValue(new Promise<Response>(resolve => {
      resolveRequest = resolve
    })) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const pendingRequest = useRequestHandling().getRequest('/old/shells', 'retrieving AAS list', false)

    mockState.selectedInfrastructure = {
      id: 'infra-new',
      auth: { securityType: 'OAuth2', oauth2: { authFlow: 'auth-code' } },
      token: undefined,
    }
    resolveRequest(Response.json([{ code: 403, text: 'access denied' }], {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }))

    await pendingRequest

    expect(mockDeps.setAuthenticationStatusForInfrastructure).not.toHaveBeenCalled()
    expect(mockDeps.showLoginRequiredSnackbar).not.toHaveBeenCalled()
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

    const response = await deleteRequest('/api/submodels/1', new Headers(), 'deleting Submodel', false)

    expect(response).toEqual({ success: false, status: 500 })
    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'error',
      }),
    )
  })

  it('suppresses only an explicitly expected 404 while retaining its structured result', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      Response.json([{ code: 404, text: 'Submodel Descriptor not found' }], {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { getRequest, consumeLastRequestFailureStatus } = useRequestHandling()

    const response = await getRequest(
      '/api/submodel-descriptors/hidden',
      'retrieving SM Descriptor',
      false,
      new Headers(),
      { suppressStatuses: [404] },
    )

    expect(response).toEqual(expect.objectContaining({ success: false, status: 404 }))
    expect(consumeLastRequestFailureStatus()).toBe(404)
    expect(mockDeps.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('continues to report a normal 404 when the caller has not marked it as expected', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      Response.json([{ code: 404, text: 'Submodel Descriptor not found' }], {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { getRequest } = useRequestHandling()

    await getRequest('/api/submodel-descriptors/missing', 'retrieving SM Descriptor', false)

    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'error',
        baseError: 'Error retrieving SM Descriptor!',
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

  it('exposes status and raw response headers for an empty accepted POST response', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('', {
        status: 202,
        headers: { Location: '/operation-status/handle-1' },
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { postRequest } = useRequestHandling()

    const response = await postRequest('/operation/invoke-async', '{}', new Headers(), 'invoking Operation', false)

    expect(response).toEqual(expect.objectContaining({
      success: true,
      status: 202,
      raw: expect.any(Response),
    }))
    expect(response.raw.headers.get('Location')).toBe('/operation-status/handle-1')
  })

  it('does not mutate caller-owned headers when adding authorization', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 202 })) as unknown as typeof fetch
    const requestHeaders = new Headers({ Accept: 'application/json' })

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { postRequest } = useRequestHandling()
    await postRequest('/operation/invoke-async', '{}', requestHeaders, 'invoking Operation', false)

    expect(requestHeaders.has('Authorization')).toBe(false)
    const fetchHeaders = (vi.mocked(global.fetch).mock.calls[0][1]?.headers) as Headers
    expect(fetchHeaders.get('Authorization')).toBe('Bearer token-1')
  })

  it('sends the configured custom header verbatim under the given name', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 202 })) as unknown as typeof fetch
    mockState.selectedInfrastructure = {
      id: 'infra-1',
      auth: {
        securityType: 'Custom Header',
        customHeader: { name: 'X-API-KEY', value: 'secret-key-123' },
      },
      token: undefined,
    }

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { postRequest } = useRequestHandling()
    await postRequest('/operation/invoke-async', '{}', new Headers(), 'invoking Operation', false)

    const fetchHeaders = (vi.mocked(global.fetch).mock.calls[0][1]?.headers) as Headers
    expect(fetchHeaders.get('X-API-KEY')).toBe('secret-key-123')
    // Does not set an Authorization header for this scheme.
    expect(fetchHeaders.has('Authorization')).toBe(false)
  })

  it.each([
    undefined,
    { name: 'X-API-KEY', value: ' '.repeat(3) },
    { name: ' ', value: 'secret' },
    { name: 'X API KEY', value: 'secret' },
    { name: 'X-API-KEY:', value: 'secret' },
    { name: 'X-API-KEY', value: 'line1\nline2' },
    { name: 'X-API-KEY', value: 'line1\rline2' },
    { name: 'X-API-KEY', value: 'key\0value' },
    { name: 'X-API-KEY', value: '🔑' },
    { name: 'X-API-KEY', value: 123_456 },
    { name: 123, value: 'secret' },
  ])('handles invalid custom headers without sending a request: %j', async customHeader => {
    global.fetch = vi.fn()
    mockState.selectedInfrastructure = {
      id: 'infra-1', auth: { securityType: 'Custom Header', customHeader },
    }

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const requests = useRequestHandling()
    const results = await Promise.all([
      requests.getRequest('/api', 'loading', false),
      requests.postRequest('/api', '{}', new Headers(), 'posting', false),
      requests.putRequest('/api', '{}', new Headers(), 'updating', false),
      requests.patchRequest('/api', '{}', new Headers(), 'patching', false),
      requests.deleteRequest('/api', new Headers(), 'deleting', false),
    ])

    expect(results).toEqual(Array.from({ length: 5 }, () => ({ success: false, status: undefined })))
    expect(global.fetch).not.toHaveBeenCalled()
    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledTimes(5)
    expect(mockDeps.dispatchSnackbar).toHaveBeenLastCalledWith(expect.objectContaining({
      color: 'error',
      text: expect.stringContaining('Invalid custom header configuration'),
    }))
  })

  it('respects disabled messages for invalid custom-header configuration', async () => {
    global.fetch = vi.fn()
    mockState.selectedInfrastructure = { id: 'infra-1', auth: { securityType: 'Custom Header' } }
    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const requests = useRequestHandling()

    expect(await requests.getRequest('/api', 'loading', true)).toMatchObject({ success: false })
    expect(requests.consumeLastRequestFailureDetails()).toContain('Invalid custom header configuration')
    expect(mockDeps.dispatchSnackbar).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('suppresses only configured unsupported POST statuses so a caller can fall back', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      Response.json([{ code: 405, text: 'Method not allowed' }], {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { postRequest } = useRequestHandling()

    const response = await postRequest(
      '/operation/invoke-async',
      '{}',
      new Headers(),
      'invoking Operation',
      false,
      false,
      { suppressStatuses: [404, 405, 501] },
    )

    expect(response).toEqual(expect.objectContaining({
      success: false,
      status: 405,
      data: [{ code: 405, text: 'Method not allowed' }],
    }))
    expect(mockDeps.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('passes an AbortSignal to fetch and does not show an error for cancellation', async () => {
    const controller = new AbortController()
    global.fetch = vi.fn((_path, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'))
      })
    })) as unknown as typeof fetch

    const { useRequestHandling } = await import('@/composables/RequestHandling')
    const { getRequest } = useRequestHandling()
    const request = getRequest(
      '/operation/operation-status/handle-1',
      'requesting operation status',
      false,
      new Headers(),
      { signal: controller.signal },
    )

    controller.abort()
    const response = await request

    expect(response).toEqual({ success: false, aborted: true })
    expect(global.fetch).toHaveBeenCalledWith(
      '/operation/operation-status/handle-1',
      expect.objectContaining({ signal: controller.signal }),
    )
    expect(mockDeps.dispatchSnackbar).not.toHaveBeenCalled()
  })
})
