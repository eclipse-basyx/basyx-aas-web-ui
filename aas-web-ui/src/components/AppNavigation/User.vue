<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props: menuProps }">
            <v-btn
                v-if="isAuthEnabled"
                v-bind="menuProps"
                :icon="authStatus ? 'mdi-account-lock' : 'mdi-lock-remove'"></v-btn>
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
                <template v-if="allowLogout">
                    <v-spacer></v-spacer>
                    <v-btn append-icon="mdi-logout" class="text-none" color="primary" text="Logout" @click="logout" />
                </template>
            </template>
        </v-card>
    </v-menu>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import { useAuthStore } from '@/store/AuthStore';
    import { useEnvStore } from '@/store/EnvironmentStore';

    // Stores
    const envStore = useEnvStore();
    const authStore = useAuthStore();

    const route = useRoute();

    // Computed properties
    const authStatus = computed(() =>
        authStore.getAuthStatus
            ? 'Authenticated'
            : envStore.getBasicAuthActive
              ? 'Basic Authentication active'
              : 'Not Authenticated'
    );
    const isAuthEnabled = computed(() => authStore.getAuthEnabled || envStore.getBasicAuthActive);
    const authUsername = computed(
        () => authStore.getUser?.username || (envStore.getBasicAuthActive ? envStore.getBasicAuthUsername : '')
    );
    const authUserEmail = computed(() => authStore.getUser?.email || '');
    const allowLogout = computed(() => envStore.getAllowLogout);

    async function logout(): Promise<void> {
        // Store the clean path to redirect to after logout
        const cleanPath = {
            path: route.path,
            hash: route.hash,
        };
        sessionStorage.setItem('logout_redirect', JSON.stringify(cleanPath));

        // Clear any refresh interval
        const refreshIntervalId = authStore.getRefreshIntervalId;
        if (refreshIntervalId) {
            window.clearInterval(refreshIntervalId);
        }

        // Check if we're using preconfigured auth (direct grant)
        if (envStore.getPreconfiguredAuth) {
            // For preconfigured auth, revoke tokens via Keycloak API before clearing state
            const refreshToken = authStore.getRefreshToken;
            if (refreshToken && envStore.getKeycloakUrl && envStore.getKeycloakRealm && envStore.getKeycloakClientId) {
                try {
                    const logoutEndpoint = `${envStore.getKeycloakUrl}/realms/${envStore.getKeycloakRealm}/protocol/openid-connect/logout`;
                    const logoutParams = new URLSearchParams({
                        client_id: envStore.getKeycloakClientId,
                        refresh_token: refreshToken,
                    });

                    await fetch(logoutEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: logoutParams.toString(),
                    });
                } catch (error) {
                    console.error('Failed to revoke tokens:', error);
                }
            }

            // Clear local auth state
            authStore.setAuthStatus(false);
            authStore.setAuthEnabled(false);
            authStore.setToken(undefined);
            authStore.setRefreshToken(undefined);
            authStore.setKeycloak(null);
            authStore.setRefreshIntervalId(undefined);

            // Redirect with ignorePreConfAuth parameter
            const params = new URLSearchParams(window.location.search);
            params.set('ignorePreConfAuth', '');

            let redirectUri = '';
            if (envStore.getSingleAas && envStore.getSingleAasRedirect) {
                redirectUri = envStore.getSingleAasRedirect;
            } else {
                redirectUri = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
            }

            window.location.href = redirectUri;
            return;
        }

        // For all logout scenarios, manually revoke tokens via Keycloak API and clear state
        // This works for both standard Keycloak auth and direct grant auth
        const refreshToken = authStore.getRefreshToken;
        if (refreshToken && envStore.getKeycloakUrl && envStore.getKeycloakRealm && envStore.getKeycloakClientId) {
            try {
                const logoutEndpoint = `${envStore.getKeycloakUrl}/realms/${envStore.getKeycloakRealm}/protocol/openid-connect/logout`;
                const logoutParams = new URLSearchParams({
                    client_id: envStore.getKeycloakClientId,
                    refresh_token: refreshToken,
                });

                await fetch(logoutEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: logoutParams.toString(),
                });
            } catch (revokeError) {
                console.error('Failed to revoke tokens:', revokeError);
            }
        } // Clear auth state
        authStore.setAuthStatus(false);
        authStore.setAuthEnabled(false);
        authStore.setToken(undefined);
        authStore.setRefreshToken(undefined);
        authStore.setKeycloak(null);
        authStore.setRefreshIntervalId(undefined);

        // Determine redirect URI
        let redirectUri = '';
        if (envStore.getSingleAas && envStore.getSingleAasRedirect) {
            redirectUri = envStore.getSingleAasRedirect;
        } else {
            redirectUri = `${window.location.origin}${window.location.pathname}${window.location.search}`;
        }

        window.location.href = redirectUri;
    }
</script>
