import type { InfrastructureConfig } from '@/types/Infrastructure'
import { describe, expect, it } from 'vitest'
import { infrastructureLoadFailureMessage } from '@/pages/modules/EclipseDataspaceConnector/composables/InfrastructureLoadFailure'

const texts = { authentication: 'Log in', denied: 'No access', unavailable: 'Reload' }
const basicAuth = { auth: { securityType: 'Basic Authentication' } } as unknown as InfrastructureConfig
const loggedOutOAuth2 = { auth: { securityType: 'OAuth2' }, token: {} } as unknown as InfrastructureConfig

describe('InfrastructureLoadFailure', () => {
  it('asks for authentication after a rejected login or without an OAuth2 login', () => {
    expect(infrastructureLoadFailureMessage(basicAuth, 401, 'AAS', texts)).toEqual({ title: 'Authentication Required', text: 'Log in' })
    expect(infrastructureLoadFailureMessage(loggedOutOAuth2, 403, 'AAS', texts)).toEqual({ title: 'Authentication Required', text: 'Log in' })
  })

  it('denies access to a logged in user', () => {
    expect(infrastructureLoadFailureMessage(basicAuth, 403, 'Submodels', texts)).toEqual({ title: 'Access Denied', text: 'No access' })
  })

  it('names the list items of any other failure', () => {
    expect(infrastructureLoadFailureMessage(basicAuth, 500, 'Submodels', texts)).toEqual({ title: 'Submodels Not Available', text: 'Reload' })
    expect(infrastructureLoadFailureMessage(null, undefined, 'AAS', texts)).toEqual({ title: 'AAS Not Available', text: 'Reload' })
  })
})
