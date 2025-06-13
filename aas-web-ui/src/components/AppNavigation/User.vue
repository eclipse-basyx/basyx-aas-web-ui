<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-btn
                v-bind="props"
                :icon="isAuthEnabled ? (authStatus ? 'mdi-account-lock' : 'mdi-lock-remove') : 'mdi-lock-off'"></v-btn>
        </template>
        <v-card
            v-if="isAuthEnabled"
            min-width="300px"
            color="navigationMenu"
            style="border-style: solid; border-width: 1px">
            <v-list nav class="pb-0 bg-navigationMenu">
                <v-list-item
                    class="pt-2"
                    :active="false"
                    nav
                    :subtitle="authStatus ? 'Authenticated' : 'Not Authenticated'"
                    :title="authUsername">
                    <template #prepend>
                        <v-avatar color="surface-light" icon="mdi-account" rounded>
                            <v-icon color="medium-emphasis" />
                        </v-avatar>
                    </template>
                </v-list-item>
            </v-list>
            <template #actions>
                <v-spacer></v-spacer>
                <v-btn append-icon="mdi-logout" class="text-none" color="primary" text="Logout" @click="logout" />
            </template>
        </v-card>
    </v-menu>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useAuthStore } from '@/store/AuthStore';
    import { useEnvStore } from '@/store/EnvironmentStore';

    // Stores
    const envStore = useEnvStore();
    const authStore = useAuthStore();

    // Computed properties
    const authStatus = computed(() =>
        authStore.getAuthStatus ? 'Authenticated' : envStore.getBasicAuthActive ? '' : 'Not Authenticated'
    );
    const isAuthEnabled = computed(() => authStore.getAuthEnabled || envStore.getBasicAuthActive);
    const authUsername = computed(
        () => authStore.getUsername || (envStore.getBasicAuthActive ? envStore.getBasicAuthUsername : '')
    );

    function logout() {
        authStore.getKeycloak?.logout();
        const refreshIntervalId = authStore.getRefreshIntervalId;
        if (refreshIntervalId) {
            window.clearInterval(refreshIntervalId);
        }
    }
</script>
