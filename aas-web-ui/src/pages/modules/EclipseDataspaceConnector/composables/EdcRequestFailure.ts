import type { CatenaXEdcFailure } from '@/composables/Client/CatenaXEdcClient'
import { useNavigationStore } from '@/store/NavigationStore'

export type EdcRequestAction = 'create' | 'update' | 'delete'

/**
 * Describes why the EDC did not create, update or delete a resource, e.g. `Asset` or `Policy`.
 * Otherwise the error details of the EDC are used, e.g. the reference preventing a deletion (409).
 */
export function edcRequestFailureText (failure: CatenaXEdcFailure, resourceLabel: string, action: EdcRequestAction): string {
  if (action === 'create' && failure.status === 409) {
    return `An EDC ${resourceLabel} with this ID already exists.`
  }
  if (action !== 'create' && failure.status === 404) {
    return `The EDC ${resourceLabel} does not exist (anymore).`
  }
  if (failure.errorDetails) {
    return failure.errorDetails
  }
  return failure.status ? `The EDC responded with HTTP ${failure.status}.` : 'The EDC could not be reached.'
}

export function useEdcRequestFailureMessage () {
  // Stores
  const navigationStore = useNavigationStore()

  /**
   * Shows the error message of a failed request, unless the request handling already shows a login or
   * access denied message, which offers the next step.
   */
  function showFailureMessage (baseError: string, extendedError: string, color = 'error'): void {
    const snackbar = navigationStore.getSnackbar
    if (snackbar.status && (snackbar.kind === 'authentication-required' || snackbar.kind === 'access-denied')) {
      return
    }

    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 60_000,
      color,
      btnColor: 'buttonText',
      baseError,
      extendedError,
    })
  }

  return {
    showFailureMessage,
  }
}
