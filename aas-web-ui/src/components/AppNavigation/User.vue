<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props: menuProps }">
            <v-btn
                v-if="isAuthEnabled"
                v-bind="menuProps"
                variant="tonal"
                size="small"
                :icon="isAuthenticated ? 'mdi-account-lock' : 'mdi-lock-remove'"></v-btn>
            <v-tooltip v-else text="Authorization Status" location="bottom" :open-delay="600">
                <template #activator="{ props: tooltipProps }">
                    <v-icon v-bind="tooltipProps" class="mx-3">mdi-lock-off</v-icon>
                </template>
                <span>Authentication disabled</span>
            </v-tooltip>
        </template>
        <v-card
            v-if="isAuthEnabled"
            min-width="300px"
            color="navigationMenu"
            rounded="lg"
            style="border-style: solid; border-width: 1px">
            <v-list v-if="isAuthenticated" nav class="bg-navigationMenu">
                <v-list-item class="py-2" :active="false" nav :subtitle="authUserEmail" :title="authUsername">
                    <template #prepend>
                        <v-avatar color="surface-light" icon="mdi-account" rounded>
                            <v-icon color="medium-emphasis" />
                        </v-avatar>
                    </template>
                </v-list-item>
            </v-list>
            <template #actions>
                <v-icon size="small" class="ml-2">
                    {{ authStatusIcon }}
                </v-icon>
                <span class="text-subtitleText text-subtitle-2">{{ authStatus }}</span>
                <template v-if="showAuthButtons">
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
    import { useAuth } from '@/composables/Auth/useAuth';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { getUserFromToken } from '@/utils/TokenUtil';

    // Stores
    const envStore = useEnvStore();
    const infrastructureStore = useInfrastructureStore();
    const router = useRouter();

    const { login: performLogin, logout: performLogout } = useAuth(router);

    // Computed properties
    const currentInfrastructure = computed(() => {
        return infrastructureStore.getSelectedInfrastructure;
    });

    const isAuthenticated = computed(() => {
        const infra = currentInfrastructure.value;
        if (!infra) return false;

        // Check if authenticated via token
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

        // Check if no authentication is configured
        if (!infra.auth || infra.auth.securityType === 'No Authentication') {
            return 'Authentication disabled';
        }

        // Check if authenticated via token
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

    const authStatusIcon = computed(() => {
        const infra = currentInfrastructure.value;
        if (!infra || !infra.auth || infra.auth.securityType === 'No Authentication') {
            return 'mdi-lock-off-outline';
        }
        return 'mdi-lock-check';
    });

    const showAuthButtons = computed(() => {
        const infra = currentInfrastructure.value;
        if (!infra || !infra.auth || infra.auth.securityType === 'No Authentication') {
            return false;
        }
        return allowLogout.value && !isOAuth2ClientCredentials.value;
    });

    const isAuthEnabled = computed(() => {
        const infra = currentInfrastructure.value;
        if (!infra || !infra.auth) return false;
        return infra.auth.securityType !== 'No Authentication';
    });
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
    const isOAuth2ClientCredentials = computed(() => {
        const infra = currentInfrastructure.value;
        return infra?.auth?.oauth2?.authFlow === 'client-credentials';
    });

    async function login(): Promise<void> {
        await performLogin();
    }

    async function logout(): Promise<void> {
        await performLogout();
    }
</script>
