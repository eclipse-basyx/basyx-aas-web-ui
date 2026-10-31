import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  edcRequestFailureText,
  useEdcRequestFailureMessage,
} from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'

const mocks = vi.hoisted(() => ({
  dispatchSnackbar: vi.fn(),
  snackbar: { status: false } as Record<string, unknown>,
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    get getSnackbar () {
      return mocks.snackbar
    },
    dispatchSnackbar: mocks.dispatchSnackbar,
  }),
}))

describe('EdcRequestFailure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.snackbar = { status: false }
  })

  it('describes a conflict on creation as an existing resource', () => {
    expect(edcRequestFailureText(
      { success: false, status: 409, errorDetails: 'Asset with ID a already exists' },
      'Asset',
      'create',
    )).toBe('An EDC Asset with this ID already exists.')
  })

  it('uses the reference of the EDC for a conflict on deletion', () => {
    const errorDetails = 'PolicyDefinition p cannot be deleted as it is referenced by at least one contract definition'

    expect(edcRequestFailureText({ success: false, status: 409, errorDetails }, 'Policy', 'delete')).toBe(errorDetails)
  })

  it.each(['update', 'delete'] as const)('describes a missing resource on %s', action => {
    expect(edcRequestFailureText(
      { success: false, status: 404, errorDetails: 'Object of type ContractDefinition with ID=null was not found' },
      'Contract Definition',
      action,
    )).toBe('The EDC Contract Definition does not exist (anymore).')
  })

  it('uses the error details of the EDC and falls back to the status', () => {
    expect(edcRequestFailureText({ success: false, status: 400, errorDetails: 'mandatory value is missing' }, 'Policy', 'update'))
      .toBe('mandatory value is missing')
    expect(edcRequestFailureText({ success: false, status: 405 }, 'Policy', 'update')).toBe('The EDC responded with HTTP 405.')
    expect(edcRequestFailureText({ success: false }, 'Policy', 'create')).toBe('The EDC could not be reached.')
  })

  it('shows the failure with its details', () => {
    useEdcRequestFailureMessage().showFailureMessage('Failed to delete EDC Asset.', 'details', 'warning')

    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      status: true,
      color: 'warning',
      baseError: 'Failed to delete EDC Asset.',
      extendedError: 'details',
    }))
  })

  it.each(['authentication-required', 'access-denied'])('keeps a shown %s message', kind => {
    mocks.snackbar = { status: true, kind }

    useEdcRequestFailureMessage().showFailureMessage('Failed to delete EDC Asset.', 'details')

    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })
})
