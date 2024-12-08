/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

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
import App from './App.vue';
import { createAppRouter } from './router';
import { useAuthStore } from './store/AuthStore';
import { useEnvStore } from './store/EnvironmentStore';
import { PluginType, useNavigationStore } from './store/NavigationStore';

const app = createApp(App);

const pinia = createPinia();

async function loadPlugins() {
    const router = await createAppRouter();

    app.use(router);
    app.use(pinia);
    app.use(VueApexCharts);

    const envStore = useEnvStore(); // Get the store instance
    await envStore.fetchConfig(); // make sure to await fetchConfig

    // Ensure available aasEndpoint query parameter
    const aasEndpoint = new URL(window.location.href).searchParams.get('aas') as string;
    if (
        envStore.getSingleAasRedirect &&
        (aasEndpoint === null || aasEndpoint === undefined || aasEndpoint.trim() === '')
    ) {
        window.location.replace(envStore.getSingleAasRedirect);
        return;
    }

    // create keycloak instance
    if (envStore.getKeycloakUrl !== '' && envStore.getKeycloakRealm !== '' && envStore.getKeycloakClientId !== '') {
        try {
            await initKeycloak(envStore.getKeycloakUrl, envStore.getKeycloakRealm, envStore.getKeycloakClientId);
        } catch {
            alert('Could not connect to Keycloak.');
            return;
        }
    }

    await registerPlugins(app);

    const pluginFileRecords = {
        ...import.meta.glob('./components/Plugins/Submodels/*.vue'),
        ...import.meta.glob('./components/Plugins/SubmodelElements/*.vue'),
        ...import.meta.glob('./UserPlugins/*.vue'),
    };

    const pluginFiles = Object.keys(pluginFileRecords);

    const plugins = [] as Array<PluginType>;

    await Promise.all(
        pluginFiles.map(async (path) => {
            const componentName = path
                .replace('./components/Plugins/Submodels/', '')
                .replace('./components/Plugins/SubmodelElements/', '')
                .replace('./UserPlugins/', '')
                .replace('.vue', '');
            const component: any = await pluginFileRecords[path]();
            if (component.default.semanticId) {
                app.component(componentName, (component.default || component) as ReturnType<typeof defineComponent>);
                plugins.push({ name: componentName, semanticId: component.default.semanticId });
            }
        })
    );

    const navigationStore = useNavigationStore();
    navigationStore.dispatchPlugins(plugins);
    app.mount('#app');
}

async function initKeycloak(keycloakUrl: string, keycloakRealm: string, keycloakClientId: string) {
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
            const authStore = useAuthStore();
            authStore.setKeycloak(keycloak);
            authStore.setAuthStatus(false);
            authStore.setAuthEnabled(true);
        } catch (error) {
            console.error('Failed to initialize Keycloak, running without authentication.', error);
            const authStore = useAuthStore();
            authStore.setAuthEnabled(false);
        }

        keycloak
            ?.init({ onLoad: initOptions.onLoad })
            .then(async (auth) => {
                if (!auth) {
                    window.location.reload();
                } else {
                    // console.info("Authenticated");
                    resolve();
                    const authStore = useAuthStore();
                    authStore.setToken(keycloak.token);
                    authStore.setRefreshToken(keycloak.refreshToken);
                    authStore.setAuthStatus(true);
                    setInterval(() => {
                        keycloak
                            .updateToken(70)
                            .then((refreshed) => {
                                if (refreshed) {
                                    // console.log('Token refreshed');
                                    authStore.setToken(keycloak.token);
                                    authStore.setRefreshToken(keycloak.refreshToken);
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
            .catch((error) => {
                console.error('Failed to authenticate with Keycloak', error);
                const authStore = useAuthStore();
                authStore.setAuthStatus(false);
                reject();
            });
    });
}

loadPlugins();
