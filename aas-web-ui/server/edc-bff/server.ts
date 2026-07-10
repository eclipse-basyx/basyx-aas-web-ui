import type {
  EdcBffRuntimeConfig,
  EdcCatalogRequest,
  EdcDiscoveryRequest,
  EdcDtrDescriptorByIdRequest,
  EdcDtrDescriptorRequest,
  EdcProxyConfig,
  EdcSubmodelFetchRequest,
} from './types.js'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { pathToFileURL } from 'node:url'
import { authorizeRequest, createAuthError } from './auth.js'
import { loadRuntimeConfig, redactProxyConfig } from './config.js'
import {
  buildCatalogRequestBody,
  buildConnectorDiscoveryRequestBody,
  buildDspVersionParamsRequestBody,
  createHttpError,
  fetchDtrShellDescriptorById,
  fetchDtrShellDescriptors,
  fetchSubmodel,
  forwardJsonToEdc,
} from './edcRequests.js'

const apiBasePath = '/api/catena-x/edc'
const maxBodyBytes = 64 * 1024

export function createEdcBffServer (config: EdcBffRuntimeConfig) {
  return createServer(async (request, response) => {
    try {
      await handleRequest(request, response, config)
    } catch (error) {
      handleError(response, request, error)
    }
  })
}

export function startEdcBffServer (config = loadRuntimeConfig()): void {
  const server = createEdcBffServer(config)

  server.once('error', error => {
    handleStartupError(error, config.port)
  })

  server.listen(config.port, () => {
    console.log(`Catena-X EDC BFF listening on port ${config.port}`)
  })
}

async function handleRequest (
  request: IncomingMessage,
  response: ServerResponse,
  config: EdcBffRuntimeConfig,
): Promise<void> {
  if (request.method === 'OPTIONS') {
    writeJsonResponse(response, 204, {})
    return
  }

  if (request.url === '/health') {
    writeJsonResponse(response, 200, { status: 'ok' })
    return
  }

  const route = parseRoute(request)
  await authorizeRequest(request, config.auth)

  const proxy = config.proxies.get(route.proxyId)
  if (!proxy) {
    writeJsonResponse(response, 404, {
      status: 404,
      ...redactProxyConfig(undefined, route.proxyId),
    })
    return
  }

  if (route.action === 'status' && request.method === 'GET') {
    writeJsonResponse(response, 200, redactProxyConfig(proxy, route.proxyId))
    return
  }

  if (route.action === 'connectors/discover' && request.method === 'POST') {
    await handleDiscoveryRequest(request, response, proxy)
    return
  }

  if (route.action === 'catalog/request' && request.method === 'POST') {
    await handleCatalogRequest(request, response, proxy)
    return
  }

  if (route.action === 'dtr/shell-descriptors' && request.method === 'POST') {
    await handleDtrShellDescriptorsRequest(request, response, proxy)
    return
  }

  if (route.action === 'dtr/shell-descriptors/by-id' && request.method === 'POST') {
    await handleDtrShellDescriptorByIdRequest(request, response, proxy)
    return
  }

  if (route.action === 'submodels/fetch' && request.method === 'POST') {
    await handleSubmodelFetchRequest(request, response, proxy)
    return
  }

  throw createHttpError('Route not found', 404)
}

async function handleDiscoveryRequest (
  request: IncomingMessage,
  response: ServerResponse,
  proxy: EdcProxyConfig,
): Promise<void> {
  assertProxyConfigured(proxy)
  const body = await readJsonBody<EdcDiscoveryRequest>(request)
  const mode = body.mode ?? (body.counterPartyAddress ? 'dspversionparams' : 'connectors')

  if (mode === 'connectors') {
    const edcResponse = await forwardJsonToEdc(
      proxy,
      '/v4alpha/connectordiscovery/connectors',
      buildConnectorDiscoveryRequestBody(body),
    )
    writeJsonResponse(response, edcResponse.status, edcResponse.data)
    return
  }

  if (mode === 'dspversionparams') {
    const edcResponse = await forwardJsonToEdc(
      proxy,
      '/v4alpha/connectordiscovery/dspversionparams',
      buildDspVersionParamsRequestBody(proxy, body),
    )
    writeJsonResponse(response, edcResponse.status, edcResponse.data)
    return
  }

  throw createHttpError('Unsupported connector discovery mode', 400)
}

async function handleCatalogRequest (
  request: IncomingMessage,
  response: ServerResponse,
  proxy: EdcProxyConfig,
): Promise<void> {
  assertProxyConfigured(proxy)
  const body = await readJsonBody<EdcCatalogRequest>(request)
  const edcResponse = await forwardJsonToEdc(
    proxy,
    '/v3/catalog/request',
    buildCatalogRequestBody(proxy, body),
  )
  writeJsonResponse(response, edcResponse.status, edcResponse.data)
}

async function handleDtrShellDescriptorsRequest (
  request: IncomingMessage,
  response: ServerResponse,
  proxy: EdcProxyConfig,
): Promise<void> {
  assertProxyConfigured(proxy)
  const body = await readJsonBody<EdcDtrDescriptorRequest>(request)
  const result = await fetchDtrShellDescriptors(proxy, body)
  writeJsonResponse(response, 200, {
    data: result.data,
    edc: result.metadata,
  })
}

async function handleDtrShellDescriptorByIdRequest (
  request: IncomingMessage,
  response: ServerResponse,
  proxy: EdcProxyConfig,
): Promise<void> {
  assertProxyConfigured(proxy)
  const body = await readJsonBody<EdcDtrDescriptorByIdRequest>(request)
  const result = await fetchDtrShellDescriptorById(proxy, body)
  writeJsonResponse(response, 200, {
    data: result.data,
    edc: result.metadata,
  })
}

async function handleSubmodelFetchRequest (
  request: IncomingMessage,
  response: ServerResponse,
  proxy: EdcProxyConfig,
): Promise<void> {
  assertProxyConfigured(proxy)
  const body = await readJsonBody<EdcSubmodelFetchRequest>(request)
  const result = await fetchSubmodel(proxy, body)
  writeJsonResponse(response, 200, {
    data: result.data,
    edc: result.metadata,
  })
}

function parseRoute (request: IncomingMessage): { proxyId: string, action: string } {
  const url = new URL(request.url ?? '', 'http://localhost')
  if (!url.pathname.startsWith(`${apiBasePath}/`)) {
    throw createHttpError('Route not found', 404)
  }

  const routeParts = url.pathname.slice(apiBasePath.length + 1).split('/').filter(Boolean)
  const proxyId = decodeURIComponent(routeParts[0] ?? '')
  if (!proxyId) {
    throw createHttpError('Missing EDC proxy ID', 400)
  }

  return {
    proxyId,
    action: routeParts.slice(1).join('/'),
  }
}

function assertProxyConfigured (proxy: EdcProxyConfig): void {
  if (!proxy.managementUrl || !proxy.apiKey) {
    throw createHttpError('EDC proxy is not fully configured', 503)
  }
}

async function readJsonBody<T> (request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > maxBodyBytes) {
      throw createHttpError('Request body is too large', 413)
    }
    chunks.push(buffer)
  }

  const body = Buffer.concat(chunks).toString('utf8').trim()
  if (body === '') {
    return {} as T
  }

  return JSON.parse(body) as T
}

function handleError (response: ServerResponse, request: IncomingMessage, error: unknown): void {
  const status = getErrorStatus(error)
  const message = getErrorMessage(error)
  writeJsonResponse(response, status, {
    error: message,
    status,
    code: getErrorCode(error, message, status),
    method: request.method ?? 'UNKNOWN',
    path: getRequestPath(request),
  })
}

function getErrorStatus (error: unknown): number {
  if ((error as Error).name === 'AbortError') {
    return 504
  }

  const status = (error as { status?: unknown }).status
  if (typeof status === 'number' && status >= 400 && status < 600) {
    return status
  }

  return error instanceof SyntaxError ? 400 : 500
}

function getErrorMessage (error: unknown): string {
  if ((error as Error).name === 'AbortError') {
    return 'EDC request timed out'
  }

  if (error instanceof SyntaxError) {
    return 'Invalid JSON request body'
  }

  return error instanceof Error ? error.message : String(error)
}

function getErrorCode (error: unknown, message: string, status: number): string {
  const explicitCode = (error as { code?: unknown }).code
  if (typeof explicitCode === 'string' && explicitCode.trim() !== '') {
    return explicitCode.trim()
  }

  if ((error as Error).name === 'AbortError') {
    return 'EDC_REQUEST_TIMEOUT'
  }

  if (error instanceof SyntaxError) {
    return 'INVALID_JSON'
  }

  const normalizedMessage = message
    .replace(/\([^)]*\)/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalizedMessage || `HTTP_${status}`
}

function getRequestPath (request: IncomingMessage): string {
  try {
    return new URL(request.url ?? '', 'http://localhost').pathname
  } catch {
    return request.url ?? ''
  }
}

function writeJsonResponse (response: ServerResponse, status: number, data: unknown): void {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  })

  if (status === 204) {
    response.end()
    return
  }

  response.end(JSON.stringify(data))
}

function handleStartupError (error: Error, port: number): void {
  const nodeError = error as NodeJS.ErrnoException
  if (nodeError.code === 'EADDRINUSE') {
    console.error(
      `Catena-X EDC BFF could not start because port ${port} is already in use. `
      + `Stop the process using that port or set CX_EDC_BFF_PORT to another port.`,
    )
  } else {
    console.error(error.message)
  }

  process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    startEdcBffServer()
  } catch (error) {
    const startupError = error instanceof Error ? error : createAuthError(String(error), 500)
    console.error(startupError.message)
    process.exitCode = 1
  }
}
