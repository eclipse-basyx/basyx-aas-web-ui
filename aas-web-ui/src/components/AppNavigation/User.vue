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
                <v-list-item class="py-2" :active="false" nav :subtitle="authStatus" :title="authUsername">
                    <template #prepend>
                        <v-avatar color="surface-light" icon="mdi-account" rounded>
                            <v-icon color="medium-emphasis" />
                        </v-avatar>
                    </template>
                </v-list-item>
            </v-list>
            <template v-if="authStore.getAuthStatus && allowLogout" #actions>
                <v-spacer></v-spacer>
                <v-btn append-icon="mdi-logout" class="text-none" color="primary" text="Logout" @click="logout" />
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
        () => authStore.getUsername || (envStore.getBasicAuthActive ? envStore.getBasicAuthUsername : '')
    );
    const allowLogout = computed(() => envStore.getAllowLogout);

    function logout(): void {
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
            // For preconfigured auth, clear local auth state and redirect manually
            authStore.setAuthStatus(false);
            authStore.setAuthEnabled(false);
            authStore.setToken(undefined);
            authStore.setRefreshToken(undefined);
            authStore.setUsername(undefined);
            authStore.setKeycloak(null);
            authStore.setRefreshIntervalId(undefined); // Clear refresh interval

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

        // For standard Keycloak auth, use Keycloak logout
        if (authStore.getKeycloak && typeof authStore.getKeycloak.logout === 'function') {
            let redirectUri = '';

            if (envStore.getSingleAas && envStore.getSingleAasRedirect) {
                redirectUri = envStore.getSingleAasRedirect;
            } else {
                const params = envStore.getSingleAas
                    ? new URLSearchParams(window.location.search)
                    : new URLSearchParams();

                redirectUri = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
            }

            authStore.getKeycloak.logout({
                redirectUri: redirectUri,
            });
        } else {
            // Fallback: clear auth state and reload page
            authStore.setAuthStatus(false);
            authStore.setAuthEnabled(false);
            authStore.setToken(undefined);
            authStore.setRefreshToken(undefined);
            authStore.setUsername(undefined);
            authStore.setKeycloak(null);
            window.location.reload();
        }
    }
</script>
