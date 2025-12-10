<template>
    <v-expansion-panels class="mt-4">
        <v-expansion-panel>
            <v-expansion-panel-title>
                <v-icon left size="small" class="mr-2">mdi-lock</v-icon>
                Security Configuration (applies to all components)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
                <!-- Authentication Type Selection -->
                <v-select
                    :model-value="auth.securityType"
                    :items="securityTypes"
                    label="Authentication Type"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                    @update:model-value="handleSecurityTypeChange"></v-select>

                <!-- Basic Auth -->
                <template v-if="auth.securityType === 'Basic Authentication'">
                    <v-text-field
                        :model-value="basicAuthUsername"
                        label="Username"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:basicAuthUsername', $event)"></v-text-field>
                    <v-text-field
                        :model-value="basicAuthPassword"
                        label="Password"
                        type="password"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:basicAuthPassword', $event)"></v-text-field>
                </template>

                <!-- Bearer Token -->
                <template v-if="auth.securityType === 'Bearer Token'">
                    <v-textarea
                        :model-value="bearerToken"
                        label="Bearer Token"
                        variant="outlined"
                        density="compact"
                        rows="3"
                        class="mb-2"
                        @update:model-value="$emit('update:bearerToken', $event)"></v-textarea>
                </template>

                <!-- OAuth2 -->
                <template v-if="auth.securityType === 'OAuth2'">
                    <v-select
                        :model-value="oAuth2AuthFlow"
                        :items="authFlowOptions"
                        item-title="text"
                        item-value="value"
                        label="Auth Flow"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:oAuth2AuthFlow', $event)"></v-select>
                    <v-alert
                        v-if="oAuth2AuthFlow === 'client-credentials'"
                        type="warning"
                        variant="tonal"
                        density="compact"
                        prominent
                        icon="mdi-alert"
                        class="mb-2">
                        <strong>Security Warning:</strong> Client credentials flow stores the client secret in the
                        browser's localStorage. This exposes the secret in the browser context and should
                        <strong>only be used for development/testing</strong>. For production, use Authorization Code
                        flow or implement a backend service.
                    </v-alert>
                    <v-text-field
                        :model-value="oauth2Data.host"
                        label="OAuth2 Host"
                        variant="outlined"
                        density="compact"
                        placeholder="https://oauth.example.com"
                        class="mb-2"
                        @update:model-value="$emit('update:oauth2Host', $event)"></v-text-field>
                    <v-text-field
                        :model-value="oauth2Data.clientId"
                        label="Client ID"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:oauth2ClientId', $event)"></v-text-field>
                    <v-text-field
                        v-if="oAuth2AuthFlow === 'client-credentials'"
                        :model-value="oauth2Data.clientSecret"
                        label="Client Secret"
                        type="password"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:oauth2ClientSecret', $event)"></v-text-field>
                    <v-text-field
                        v-if="oAuth2AuthFlow === 'password'"
                        :model-value="oauth2Data.username"
                        label="Username"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:oauth2Username', $event)"></v-text-field>
                    <v-text-field
                        v-if="oAuth2AuthFlow === 'password'"
                        :model-value="oauth2Data.password"
                        label="Password"
                        type="password"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:oauth2Password', $event)"></v-text-field>
                    <v-text-field
                        :model-value="oauth2Data.scope"
                        label="Scope (optional)"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:oauth2Scope', $event)"></v-text-field>
                    <v-row v-if="oAuth2AuthFlow === 'client-credentials'" class="mb-2">
                        <v-col>
                            <v-btn
                                v-if="!oauth2Token"
                                block
                                variant="tonal"
                                color="primary"
                                :loading="oauth2Loading"
                                @click="$emit('authenticate-oauth2')">
                                Authenticate
                            </v-btn>
                            <v-btn
                                v-else
                                block
                                variant="tonal"
                                color="success"
                                prepend-icon="mdi-check-circle"
                                @click="$emit('authenticate-oauth2')">
                                Authenticated
                            </v-btn>
                        </v-col>
                    </v-row>
                    <v-row v-if="oAuth2AuthFlow === 'auth-code'" class="mb-2">
                        <v-col>
                            <v-btn
                                block
                                variant="tonal"
                                color="primary"
                                prepend-icon="mdi-login"
                                @click="$emit('authenticate-oauth2')">
                                Login with OAuth2 Provider
                            </v-btn>
                        </v-col>
                    </v-row>
                    <v-alert
                        v-if="oAuth2AuthFlow === 'auth-code'"
                        type="info"
                        variant="tonal"
                        density="compact"
                        class="mb-2">
                        Configure the redirect URI in your OAuth2 provider to:
                        {{ getRedirectUri() }}
                    </v-alert>
                </template>

                <!-- Keycloak -->
                <template v-if="auth.securityType === 'Keycloak'">
                    <v-text-field
                        :model-value="keycloakServerUrl"
                        label="Keycloak Server URL"
                        variant="outlined"
                        density="compact"
                        placeholder="https://keycloak.example.com"
                        class="mb-2"
                        @update:model-value="$emit('update:keycloakServerUrl', $event)"></v-text-field>
                    <v-text-field
                        :model-value="keycloakRealm"
                        label="Realm"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:keycloakRealm', $event)"></v-text-field>
                    <v-text-field
                        :model-value="keycloakClientId"
                        label="Client ID"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:keycloakClientId', $event)"></v-text-field>
                    <v-select
                        :model-value="keycloakAuthFlow"
                        :items="authFlowOptions"
                        item-title="text"
                        item-value="value"
                        label="Auth Flow"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:keycloakAuthFlow', $event)"></v-select>
                    <v-alert
                        v-if="keycloakAuthFlow === 'client-credentials'"
                        type="warning"
                        variant="tonal"
                        density="compact"
                        prominent
                        icon="mdi-alert"
                        class="mb-2">
                        <strong>Security Warning:</strong> Client credentials flow stores the client secret in the
                        browser's localStorage. This exposes the secret in the browser context and should
                        <strong>only be used for development/testing</strong>. For production, use Authorization Code
                        flow or implement a backend service.
                    </v-alert>
                    <v-text-field
                        v-if="keycloakAuthFlow === 'client-credentials' || keycloakAuthFlow === 'password'"
                        :model-value="keycloakClientSecret"
                        label="Client Secret"
                        type="password"
                        variant="outlined"
                        density="compact"
                        class="mb-2"
                        @update:model-value="$emit('update:keycloakClientSecret', $event)"></v-text-field>
                    <template v-if="keycloakAuthFlow === 'password'">
                        <v-text-field
                            :model-value="keycloakUsername"
                            label="Username"
                            variant="outlined"
                            density="compact"
                            class="mb-2"
                            @update:model-value="$emit('update:keycloakUsername', $event)"></v-text-field>
                        <v-text-field
                            :model-value="keycloakPassword"
                            label="Password"
                            type="password"
                            variant="outlined"
                            density="compact"
                            class="mb-2"
                            @update:model-value="$emit('update:keycloakPassword', $event)"></v-text-field>
                    </template>
                    <v-row v-if="keycloakAuthFlow" class="mb-2">
                        <v-col>
                            <v-btn
                                v-if="!keycloakToken"
                                block
                                variant="tonal"
                                color="primary"
                                :loading="keycloakLoading"
                                @click="$emit('authenticate-keycloak')">
                                Authenticate
                            </v-btn>
                            <v-btn
                                v-else
                                block
                                variant="tonal"
                                color="success"
                                prepend-icon="mdi-check-circle"
                                @click="$emit('authenticate-keycloak')">
                                Authenticated
                            </v-btn>
                        </v-col>
                    </v-row>
                    <v-alert
                        v-if="keycloakError"
                        type="error"
                        density="compact"
                        closable
                        class="mb-2"
                        @click:close="$emit('clear-keycloak-error')">
                        {{ keycloakError }}
                    </v-alert>
                </template>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-expansion-panels>
</template>

<script lang="ts" setup>
    import type { AuthTokenState, InfrastructureAuth } from '@/types/Infrastructure';

    // Props
    defineProps<{
        auth: InfrastructureAuth;
        securityTypes: string[];
        authFlowOptions: Array<{ text: string; value: string }>;
        // Basic Auth
        basicAuthUsername: string;
        basicAuthPassword: string;
        // Bearer Token
        bearerToken: string;
        // OAuth2
        oAuth2AuthFlow: string;
        oauth2Data: {
            host: string;
            clientId: string;
            clientSecret: string;
            username: string;
            password: string;
            scope: string;
        };
        oauth2Token: AuthTokenState | null;
        oauth2Loading: boolean;
        // Keycloak
        keycloakServerUrl: string;
        keycloakRealm: string;
        keycloakClientId: string;
        keycloakAuthFlow: string;
        keycloakClientSecret: string;
        keycloakUsername: string;
        keycloakPassword: string;
        keycloakToken: AuthTokenState | null;
        keycloakLoading: boolean;
        keycloakError: string;
    }>();

    // Emits
    const emit = defineEmits<{
        'update:securityType': [value: string];
        'update:basicAuthUsername': [value: string];
        'update:basicAuthPassword': [value: string];
        'update:bearerToken': [value: string];
        'update:oAuth2AuthFlow': [value: string];
        'update:oauth2Host': [value: string];
        'update:oauth2ClientId': [value: string];
        'update:oauth2ClientSecret': [value: string];
        'update:oauth2Username': [value: string];
        'update:oauth2Password': [value: string];
        'update:oauth2Scope': [value: string];
        'update:keycloakServerUrl': [value: string];
        'update:keycloakRealm': [value: string];
        'update:keycloakClientId': [value: string];
        'update:keycloakAuthFlow': [value: string];
        'update:keycloakClientSecret': [value: string];
        'update:keycloakUsername': [value: string];
        'update:keycloakPassword': [value: string];
        'authenticate-oauth2': [];
        'authenticate-keycloak': [];
        'clear-keycloak-error': [];
    }>();

    function handleSecurityTypeChange(value: string): void {
        emit('update:securityType', value);
    }

    function getRedirectUri(): string {
        return `${window.location.origin}/keycloak-callback.html`;
    }
</script>
