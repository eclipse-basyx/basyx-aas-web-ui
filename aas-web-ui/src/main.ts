/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Types
import type { PluginType } from '@/types/Application';
// Components
import Keycloak from 'keycloak-js';
import { KeycloakOnLoad } from 'keycloak-js';
import { createPinia } from 'pinia';
// Composables
import { createApp } from 'vue';
import { defineComponent } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
// Plugins
import { registerPlugins } from '@/plugins';
import { useAuthStore } from '@/store/AuthStore';
import { useEnvStore } from '@/store/EnvironmentStore';
import { useNavigationStore } from '@/store/NavigationStore';
import App from './App.vue';
import { createAppRouter } from './router';

// Initialize the application
initializeApp();

async function initializeApp(): Promise<void> {
    const app = createApp(App);

    const pinia = createPinia();
    app.use(pinia);

    const router = await createAppRouter();
    app.use(router);

    app.use(VueApexCharts);

    // Stores
    const envStore = useEnvStore();
    const authStore = useAuthStore();
    const navigationStore = useNavigationStore();

    // create keycloak instance
    if (envStore.getKeycloakActive) {
        try {
            await initKeycloak(envStore.getKeycloakUrl, envStore.getKeycloakRealm, envStore.getKeycloakClientId);
        } catch {
            alert('Could not connect to Keycloak.');
            return;
        }
    }

    await loadPlugins();

    app.mount('#app');

    async function loadPlugins(): Promise<void> {
        await registerPlugins(app);

        // Plugins aka Component Visualizations
        const pluginFileRecords = {
            ...import.meta.glob('./components/Plugins/Submodels/*.vue'),
            ...import.meta.glob('./components/Plugins/SubmodelElements/*.vue'),
            ...import.meta.glob('./UserPlugins/*.vue'),
        };

        const plugins = [] as Array<PluginType>;

        for (const path in pluginFileRecords) {
            const pluginName = path.split('/').pop()?.replace('.vue', '') || 'UnnamedPlugin';
            const pluginComponent: any = await pluginFileRecords[path]();

            if (pluginComponent.default.semanticId) {
                app.component(
                    pluginName,
                    (pluginComponent.default || pluginComponent) as ReturnType<typeof defineComponent>
                );
                plugins.push({ name: pluginName, semanticId: pluginComponent.default.semanticId });
            }
        }

        navigationStore.dispatchPlugins(plugins);
    }

    async function initKeycloak(keycloakUrl: string, keycloakRealm: string, keycloakClientId: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let keycloak: Keycloak | null = null;

            const initOptions = {
                url: keycloakUrl,
                realm: keycloakRealm,
                clientId: keycloakClientId,
                onLoad: 'login-required' as KeycloakOnLoad,
            };

            try {
                keycloak = new Keycloak(initOptions);
                // set the keycloak instance in the auth store
                authStore.setKeycloak(keycloak);
                authStore.setAuthStatus(false);
                authStore.setAuthEnabled(true);
            } catch (error) {
                console.error('Failed to initialize Keycloak, running without authentication.', error);
                authStore.setAuthEnabled(false);
            }

            keycloak
                ?.init({ onLoad: initOptions.onLoad })
                .then(async (auth: boolean) => {
                    if (!auth) {
                        window.location.reload();
                    } else {
                        // console.info("Authenticated");
                        resolve();
                        authStore.setToken(keycloak.token ? keycloak.token : '');
                        authStore.setRefreshToken(keycloak.refreshToken ? keycloak.refreshToken : '');
                        authStore.setAuthStatus(true);
                        setInterval(() => {
                            keycloak
                                .updateToken(70)
                                .then((refreshed: boolean) => {
                                    if (refreshed) {
                                        // console.log('Token refreshed');
                                        authStore.setToken(keycloak.token ? keycloak.token : '');
                                        authStore.setRefreshToken(keycloak.refreshToken ? keycloak.refreshToken : '');
                                    }
                                    authStore.setAuthStatus(true);
                                })
                                .catch(() => {
                                    console.error('Failed to refresh token');
                                    authStore.setAuthStatus(false);
                                });
                        }, 60000);
                    }
                })
                .catch((error: any) => {
                    console.error('Failed to authenticate with Keycloak', error);
                    authStore.setAuthStatus(false);
                    reject();
                });
        });
    }
}
