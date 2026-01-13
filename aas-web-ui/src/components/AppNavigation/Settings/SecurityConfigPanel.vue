<template>
    <v-expansion-panels class="border rounded" :elevation="0">
        <v-expansion-panel>
            <v-expansion-panel-title v-slot="{ expanded }">
                <v-row no-gutters>
                    <v-col class="d-flex justify-start align-center" cols="4">
                        <v-icon size="small" class="mr-2">mdi-lock</v-icon>
                        Security Configuration
                    </v-col>
                    <v-col class="text-grey" cols="8">
                        <v-fade-transition leave-absolute>
                            <span v-if="expanded">Applies to all components</span>
                            <span v-else class="d-flex flex-row align-center">
                                <div class="d-flex flex-row align-center">
                                    <span class="mr-2">Type:</span>
                                    <v-chip border label variant="tonal" size="small" color="primary">{{
                                        auth.securityType || 'No Authentication'
                                    }}</v-chip>
                                </div>
                                <v-spacer></v-spacer>
                                <template v-if="auth.securityType === 'OAuth2'">
                                    <span class="mr-3">{{
                                        authFlowOptions.find((opt) => opt.value === oAuth2AuthFlow)?.text
                                    }}</span>
                                </template>
                            </span>
                        </v-fade-transition>
                    </v-col>
                </v-row>
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
        'authenticate-oauth2': [];
    }>();

    function handleSecurityTypeChange(value: string): void {
        emit('update:securityType', value);
    }
</script>
