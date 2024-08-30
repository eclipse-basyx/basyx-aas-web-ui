/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Types
interface PluginType {
    name: string;
    SemanticID: string;
}

// Components
import App from './App.vue';
import { createAppRouter } from './router';
import { useNavigationStore } from './store/NavigationStore';
import { useEnvStore } from './store/EnvironmentStore';
import { useAuthStore } from './store/AuthStore';
import { reactive } from 'vue';

import VueApexCharts from 'vue3-apexcharts';

// Composables
import { createApp } from 'vue';
import { defineComponent } from 'vue';
import { createPinia } from 'pinia';

// Plugins
import { registerPlugins } from '@/plugins';
import Keycloak from 'keycloak-js';
import { KeycloakOnLoad } from 'keycloak-js';

const app = createApp(App);

const pinia = createPinia();

async function loadUserPlugins() {
    const router = await createAppRouter();

    app.use(router);
    app.use(pinia);
    app.use(VueApexCharts);

    const envStore = useEnvStore(); // Get the store instance
    await envStore.fetchConfig(); // make sure to await fetchConfig

    // create keycloak instance
    if (envStore.getKeycloakUrl !== '' && envStore.getKeycloakRealm !== '' && envStore.getKeycloakClientId !== '') {
        try {
            await initKeycloak(envStore.getKeycloakUrl, envStore.getKeycloakRealm, envStore.getKeycloakClientId);
        } catch (error) {
            alert('Could not connect to Keycloak.');
            return;
        }
    }

    await registerPlugins(app);

    // Load all components in the components folder
    const pluginFiles = import.meta.glob('./UserPlugins/*.vue');
    const files = Object.keys(pluginFiles);

    let plugins = [] as Array<PluginType>;

    await Promise.all(
        files.map(async (path) => {
            const componentName = path.replace('./UserPlugins/', '').replace('.vue', '');
            const component: any = await pluginFiles[path]();
            app.component(componentName, (component.default || component) as ReturnType<typeof defineComponent>);
            plugins.push({ name: componentName, SemanticID: component.default.SemanticID });
        })
    );

    const navigationStore = useNavigationStore(); // Get the store instance
    navigationStore.dispatchPlugins(plugins); // Update the plugins state
    app.mount('#app');
}

async function initKeycloak(keycloakUrl: string, keycloakRealm: string, keycloakClientId: string) {
    return new Promise<void>((resolve, reject) => {
        let keycloak: Keycloak | null = null;

        let initOptions = {
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
                                } else {
                                    const exp = keycloak?.tokenParsed?.exp as number;
                                    const timeScew = keycloak?.timeSkew as number;
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

loadUserPlugins();
