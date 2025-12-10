<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props: menuProps }">
            <v-btn
                v-if="isAuthEnabled"
                v-bind="menuProps"
                :icon="isAuthenticated ? 'mdi-account-lock' : 'mdi-lock-remove'"></v-btn>
            <v-tooltip v-else text="Authorization Status" location="bottom" :open-delay="600">
                <template #activator="{ props: tooltipProps }">
                    <v-icon v-bind="tooltipProps">mdi-lock-off</v-icon>
                </template>
                <span>Authentication disabled</span>
            </v-tooltip>
        </template>
        <v-card
            v-if="isAuthEnabled"
            min-width="300px"
            color="navigationMenu"
            style="border-style: solid; border-width: 1px">
            <v-list nav class="bg-navigationMenu">
                <v-list-item class="py-2" :active="false" nav :subtitle="authUserEmail" :title="authUsername">
                    <template #prepend>
                        <v-avatar color="surface-light" icon="mdi-account" rounded>
                            <v-icon color="medium-emphasis" />
                        </v-avatar>
                    </template>
                </v-list-item>
            </v-list>
            <template #actions>
                <v-icon size="small" class="ml-2"> mdi-lock-check </v-icon>
                <span class="text-subtitleText text-subtitle-2">{{ authStatus }}</span>
                <template v-if="allowLogout && !isClientCredentialsFlow && !isOAuth2ClientCredentials">
                    <v-spacer></v-spacer>
                    <v-btn
                        v-if="currentInfrastructure?.token?.accessToken"
                        append-icon="mdi-logout"
                        class="text-none"
                        color="primary"
                        text="Logout"
                        @click="logout" />
                    <v-btn
                        v-else
                        append-icon="mdi-login"
                        class="text-none"
                        color="primary"
                        text="Login"
                        @click="login" />
                </template>
            </template>
        </v-card>
    </v-menu>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useRouter } from 'vue-router';
    import { authenticateKeycloak } from '@/composables/KeycloakAuth';
    import { usePopupOverlay } from '@/composables/PopupOverlay';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getUserFromToken } from '@/utils/TokenUtil';

    // Stores
    const envStore = useEnvStore();
    const navStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    const router = useRouter();

    const { showOverlay, hideOverlay } = usePopupOverlay();

    // Computed properties
    const currentInfrastructure = computed(() => {
        return infrastructureStore.getSelectedInfrastructure;
    });

    const isAuthenticated = computed(() => {
        const infra = currentInfrastructure.value;
        if (!infra) return false;

        // Check if authenticated via token (OAuth2 or Keycloak)
        if (infra.token?.accessToken) {
            return true;
        }

        // Check if authenticated via basic auth
        if (infra.auth?.basicAuth) {
            return true;
        }

        // Check legacy isAuthenticated flag
        if (infra.isAuthenticated) {
            return true;
        }

        return false;
    });

    const authStatus = computed(() => {
        const infra = currentInfrastructure.value;
        if (!infra) return 'Not Authenticated';

        // Check if authenticated via token (OAuth2 or Keycloak)
        if (infra.token?.accessToken) {
            return 'Authenticated';
        }

        // Check if authenticated via basic auth
        if (infra.auth?.basicAuth) {
            return 'Basic Authentication active';
        }

        // Check legacy isAuthenticated flag
        if (infra.isAuthenticated) {
            return 'Authenticated';
        }

        return 'Not Authenticated';
    });
    const isAuthEnabled = computed(
        () =>
            currentInfrastructure.value?.auth?.keycloakConfig ||
            currentInfrastructure.value?.auth?.basicAuth ||
            currentInfrastructure.value?.auth?.bearerToken ||
            currentInfrastructure.value?.auth?.oauth2
    );
    const authUsername = computed(() => {
        const infra = currentInfrastructure.value;
        // Try to get username from infrastructure token
        if (infra?.token?.accessToken) {
            try {
                const user = getUserFromToken(infra.token.accessToken);
                return user.username || '';
            } catch {
                // If token parsing fails, fall through to other methods
            }
        }
        // Fallback to basic auth username
        if (infra?.auth?.basicAuth?.username) {
            return infra.auth.basicAuth.username;
        }
        return '';
    });
    const authUserEmail = computed(() => {
        const infra = currentInfrastructure.value;
        // Try to get email from infrastructure token
        if (infra?.token?.accessToken) {
            try {
                const user = getUserFromToken(infra.token.accessToken);
                return user.email || '';
            } catch {
                // If token parsing fails, return empty string
            }
        }
        return '';
    });
    const allowLogout = computed(() => envStore.getAllowLogout);
    const isClientCredentialsFlow = computed(() => {
        const infra = currentInfrastructure.value;
        return infra?.auth?.keycloakConfig?.authFlow === 'client-credentials';
    });
    const isOAuth2ClientCredentials = computed(() => {
        const infra = currentInfrastructure.value;
        return infra?.auth?.oauth2?.authFlow === 'client-credentials';
    });

    async function login(): Promise<void> {
        const infra = currentInfrastructure.value;

        // Handle OAuth2 login
        if (infra?.auth?.oauth2) {
            infrastructureStore.dispatchTriggerInfrastructureDialog(true);
            return;
        }

        // Handle Keycloak login
        if (!infra?.auth?.keycloakConfig) {
            return;
        }

        const config = infra.auth.keycloakConfig;

        if (!config.serverUrl || !config.realm || !config.clientId || !config.authFlow) {
            navStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Keycloak configuration incomplete',
            });
            return;
        }

        try {
            if (config.authFlow === 'auth-code') {
                const result = await authenticateKeycloak(config);

                // Update infrastructure with new token
                const updatedInfra = {
                    ...infra,
                    token: {
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                        idToken: result.idToken,
                        expiresAt: result.expiresAt,
                    },
                };
                infrastructureStore.dispatchUpdateInfrastructure(updatedInfra);
                infrastructureStore.setAuthenticationStatusForInfrastructure(infra.id, true);
                navStore.dispatchTriggerAASListReload();
                navStore.dispatchTriggerTreeviewReload();

                navStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: 'Successfully authenticated',
                });
            } else {
                // For client-credentials and password flows, need to open the dialog
                infrastructureStore.dispatchTriggerInfrastructureDialog(true);
            }
        } catch (error: unknown) {
            navStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Authentication failed',
                extendedError: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    function clearLocalToken(): void {
        if (currentInfrastructure.value) {
            infrastructureStore.setAuthenticationStatusForInfrastructure(currentInfrastructure.value.id, false);
            const updatedInfra = { ...currentInfrastructure.value, token: undefined };
            infrastructureStore.dispatchUpdateInfrastructure(updatedInfra);
            navStore.dispatchClearAASList();
            navStore.dispatchClearTreeview();
            router.push({ query: {} });

            navStore.dispatchSnackbar({
                status: true,
                timeout: 3000,
                color: 'success',
                btnColor: 'buttonText',
                text: 'Logged out successfully',
            });
        }
    }

    async function logout(): Promise<void> {
        const infra = currentInfrastructure.value;
        if (!infra) return;

        // Open popup window
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        let logoutUrl: URL;
        const redirectUri = `${window.location.origin}/keycloak-logout.html`;

        // Handle OAuth2 logout
        if (infra.auth?.oauth2) {
            const host = infra.auth.oauth2.host;
            if (!host) {
                return;
            }

            try {
                // Fetch end_session_endpoint from well-known configuration
                const wellKnownUrl = `${host}/.well-known/openid-configuration`;
                const wellKnownResponse = await fetch(wellKnownUrl);

                if (!wellKnownResponse.ok) {
                    throw new Error('Failed to fetch OpenID configuration');
                }

                const wellKnownConfig = await wellKnownResponse.json();
                const endSessionEndpoint = wellKnownConfig.end_session_endpoint;

                if (!endSessionEndpoint) {
                    // If no end_session_endpoint, just clear local token
                    clearLocalToken();
                    return;
                }

                logoutUrl = new URL(endSessionEndpoint);
                logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);

                // Add id_token_hint if available (required by some OAuth2 providers)
                const idToken = infra.token?.idToken;
                if (idToken) {
                    logoutUrl.searchParams.set('id_token_hint', idToken);
                } else {
                    // Some providers accept client_id instead of id_token_hint
                    if (infra.auth.oauth2?.clientId) {
                        logoutUrl.searchParams.set('client_id', infra.auth.oauth2.clientId);
                    }
                }
            } catch (error) {
                navStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Failed to initiate logout',
                    extendedError: error instanceof Error ? error.message : 'Unknown error',
                });
                // Fallback: just clear local token
                clearLocalToken();
                return;
            }
        }
        // Handle Keycloak logout
        else if (infra.auth?.keycloakConfig) {
            const serverUrl = infra.auth.keycloakConfig.serverUrl;
            const realm = infra.auth.keycloakConfig.realm;
            const idToken = infra.token?.idToken;

            if (!serverUrl || !realm) {
                return;
            }

            // Build Keycloak logout URL
            logoutUrl = new URL(`${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/logout`);
            logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);
            if (idToken) {
                logoutUrl.searchParams.set('id_token_hint', idToken);
            }
        } else {
            return;
        }

        // Show overlay before opening popup
        showOverlay();

        const keycloakPopup = window.open(
            logoutUrl.toString(),
            'keycloak-logout',
            `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`
        );

        if (!keycloakPopup) {
            hideOverlay();
            throw new Error('Failed to open logout popup. Please allow popups for this site.');
        }

        // Listen for messages from popup
        const messageHandler = async (event: MessageEvent): Promise<void> => {
            if (event.origin !== window.location.origin) return;
            if (event.data && event.data.type === 'keycloak-logout-complete') {
                if (currentInfrastructure.value) {
                    infrastructureStore.setAuthenticationStatusForInfrastructure(currentInfrastructure.value.id, false);
                    // Remove token from infrastructure
                    const updatedInfra = { ...currentInfrastructure.value, token: undefined };
                    infrastructureStore.dispatchUpdateInfrastructure(updatedInfra);
                    navStore.dispatchClearAASList();
                    navStore.dispatchClearTreeview();
                    router.push({
                        query: {},
                    });
                }
                hideOverlay();
                window.removeEventListener('message', messageHandler);
                if (keycloakPopup && !keycloakPopup.closed) {
                    keycloakPopup.close();
                }
            }
        };

        window.addEventListener('message', messageHandler);

        // Monitor if popup is closed manually
        const popupCheckInterval = setInterval(() => {
            if (keycloakPopup && keycloakPopup.closed) {
                clearInterval(popupCheckInterval);
                hideOverlay();
                window.removeEventListener('message', messageHandler);
                // Don't remove token if popup was just closed without completing logout
            }
        }, 500);
    }
</script>
