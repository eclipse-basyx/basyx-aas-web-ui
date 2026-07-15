import type { Router } from 'vue-router'
import { startLogoutTransaction } from '@/composables/Auth/OAuth2Navigation'
import { discoverOpenIdConfiguration } from '@/composables/Auth/OpenIdConnect'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { useNavigationStore } from '@/store/NavigationStore'

/**
 * Composable for handling authentication logic
 * Centralizes login and logout functionality for OAuth2
 */
export function useAuth (router?: Router) {
  const infrastructureStore = useInfrastructureStore()
  const navStore = useNavigationStore()

  /**
   * Perform login for the current infrastructure
   * Handles OAuth2 (both flows) authentication
   */
  async function login (): Promise<void> {
    const infra = infrastructureStore.getSelectedInfrastructure

    if (!infra) {
      navStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'No infrastructure selected',
      })
      return
    }

    // Handle OAuth2 login - authenticate directly without opening full dialog
    if (infra.auth?.oauth2) {
      const config = infra.auth.oauth2

      if (!config.host || !config.clientId) {
        navStore.dispatchSnackbar({
          status: true,
          timeout: 4000,
          color: 'error',
          btnColor: 'buttonText',
          text: 'OAuth2 configuration incomplete. Please configure in settings.',
        })
        return
      }

      try {
        // For client-credentials, authenticate directly
        if (config.authFlow === 'client-credentials') {
          if (!config.clientSecret) {
            navStore.dispatchSnackbar({
              status: true,
              timeout: 4000,
              color: 'error',
              btnColor: 'buttonText',
              text: 'Client secret is required. Please configure in settings.',
            })
            return
          }

          const { authenticateOAuth2ClientCredentials } = await import('@/composables/Auth/OAuth2Auth')
          const result = await authenticateOAuth2ClientCredentials(config)

          // Update infrastructure with new token
          const updatedInfra = {
            ...infra,
            token: {
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              idToken: result.idToken,
              expiresAt: result.expiresAt,
            },
          }
          infrastructureStore.dispatchUpdateInfrastructure(updatedInfra)
          infrastructureStore.setAuthenticationStatusForInfrastructure(infra.id, true)
          navStore.dispatchTriggerAASListReload()
          navStore.dispatchTriggerTreeviewReload()

          navStore.dispatchSnackbar({
            status: true,
            timeout: 4000,
            color: 'success',
            btnColor: 'buttonText',
            text: 'Successfully authenticated with OAuth2',
          })
        } else {
          // For authorization-code flow, use the form composable which handles the redirect flow
          const { useOAuth2Form } = await import('@/composables/Auth/useOAuth2Form')
          const oauth2Form = useOAuth2Form()

          // Load current infrastructure config
          oauth2Form.loadFromInfrastructure(infra)

          // Authenticate - this will redirect the page for auth-code flow
          await oauth2Form.authenticate(infra.id)
        }
      } catch (error: unknown) {
        navStore.dispatchSnackbar({
          status: true,
          timeout: 4000,
          color: 'error',
          btnColor: 'buttonText',
          text: 'OAuth2 authentication failed',
          extendedError: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      return
    }

    // No authentication configured
    navStore.dispatchSnackbar({
      status: true,
      timeout: 4000,
      color: 'warning',
      btnColor: 'buttonText',
      text: 'No authentication configured for this infrastructure',
    })
  }

  /**
   * Show the authentication-required notification for the currently selected
   * infrastructure. The action is intentionally bound to that infrastructure,
   * so a stale notification cannot start OAuth for a later selection.
   */
  function showLoginRequiredSnackbar (): void {
    const infra = infrastructureStore.getSelectedInfrastructure
    if (!infra) {
      return
    }

    const currentSnackbar = navStore.getSnackbar
    if (
      currentSnackbar.status
      && currentSnackbar.kind === 'authentication-required'
      && currentSnackbar.infrastructureId === infra.id
    ) {
      return
    }

    const isLoginAvailable = infrastructureStore.getIsLoginAvailable
    navStore.dispatchSnackbar({
      status: true,
      timeout: 8000,
      color: 'warning',
      btnColor: 'buttonText',
      baseError: 'Authentication required!',
      extendedError: 'Please log in again.',
      infrastructureId: infra.id,
      kind: 'authentication-required',
      actionText: isLoginAvailable ? 'Login' : undefined,
      actionCallback: isLoginAvailable
        ? async () => {
          if (infrastructureStore.getSelectedInfrastructure?.id === infra.id) {
            await login()
          }
        }
        : undefined,
    })
  }

  /**
   * Clear local token and update UI
   */
  function clearLocalToken ({
    reloadData = true,
    showSuccess = true,
  }: { reloadData?: boolean, showSuccess?: boolean } = {}): void {
    const infra = infrastructureStore.getSelectedInfrastructure
    if (infra) {
      infrastructureStore.setAuthenticationStatusForInfrastructure(infra.id, false)
      const updatedInfra = { ...infra, token: undefined }
      infrastructureStore.dispatchUpdateInfrastructure(updatedInfra)
      if (reloadData) {
        navStore.dispatchClearAASList()
        navStore.dispatchClearTreeview()
        navStore.dispatchTriggerAASListReload()
        navStore.dispatchTriggerTreeviewReload()
      }

      if (showSuccess) {
        navStore.dispatchSnackbar({
          status: true,
          timeout: 3000,
          color: 'success',
          btnColor: 'buttonText',
          text: 'Logged out successfully',
        })
      }
    }
  }

  async function completeLocalLogout (logoutError?: unknown): Promise<void> {
    const logoutTransaction = router ? startLogoutTransaction() : null
    clearLocalToken({
      reloadData: !logoutTransaction,
      showSuccess: !logoutError,
    })

    if (logoutTransaction) {
      await router?.replace(logoutTransaction.callbackPath)
    }

    if (logoutError) {
      navStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Failed to initiate logout',
        extendedError: logoutError instanceof Error ? logoutError.message : 'Unknown error',
      })
    }
  }

  /**
   * Perform logout for the current infrastructure
   * Handles OAuth2 logout flow
   */
  async function logout (): Promise<void> {
    const infra = infrastructureStore.getSelectedInfrastructure
    if (!infra) {
      return
    }
    // Handle OAuth2 logout
    if (infra.auth?.oauth2) {
      const host = infra.auth.oauth2.host
      if (!host) {
        await completeLocalLogout(new Error('OAuth2 issuer is missing from the infrastructure configuration'))
        return
      }
      let logoutUrl
      try {
        const openIdConfiguration = await discoverOpenIdConfiguration(host)
        const endSessionEndpoint = openIdConfiguration.end_session_endpoint
        if (!endSessionEndpoint) {
          await completeLocalLogout()
          return
        }

        logoutUrl = new URL(endSessionEndpoint)
        const logoutTransaction = startLogoutTransaction()
        logoutUrl.searchParams.set(
          'post_logout_redirect_uri',
          logoutTransaction.redirectUri,
        )

        // Add id_token_hint if available (required by some OAuth2 providers)
        const idToken = infra.token?.idToken
        if (idToken) {
          logoutUrl.searchParams.set('id_token_hint', idToken)
        } else {
          // Some providers accept client_id instead of id_token_hint
          if (infra.auth.oauth2?.clientId) {
            logoutUrl.searchParams.set('client_id', infra.auth.oauth2.clientId)
          }
        }
      } catch (error) {
        await completeLocalLogout(error)
        return
      }
      clearLocalToken({ reloadData: false })
      window.location.href = logoutUrl.toString()
      return
    } else {
      // No logout URL - just clear local token
      await completeLocalLogout()
      return
    }
  }

  return {
    login,
    logout,
    clearLocalToken,
    showLoginRequiredSnackbar,
  }
}
