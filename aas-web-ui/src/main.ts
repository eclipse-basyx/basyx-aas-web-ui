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
import App from './App.vue';
import { createAppRouter } from './router';
import { useAuthStore } from './store/AuthStore';
import { useEnvStore } from './store/EnvironmentStore';
import { useNavigationStore } from './store/NavigationStore';

const app = createApp(App);

const pinia = createPinia();

async function loadPlugins() {
    app.use(pinia);

    app.use(VueApexCharts);

    const envStore = useEnvStore(); // Get the store instance

    // create keycloak instance
    if (envStore.getKeycloakActive) {
        try {
            await initKeycloak(envStore.getKeycloakUrl, envStore.getKeycloakRealm, envStore.getKeycloakClientId);
        } catch {
            alert('Could not connect to Keycloak.');
            return;
        }
    }

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

    const navigationStore = useNavigationStore();
    navigationStore.dispatchPlugins(plugins);

    // Determine if mobile or desktop
    const isMobile = window.matchMedia('(max-width: 600px)').matches;
    console.log('isMobile', isMobile);
    navigationStore.dispatchIsMobile(isMobile);

    // Extend the window interface to include cordova and electron properties
    interface ExtendedWindow extends Window {
        cordova?: any;
        electron?: any;
    }
    const extendedWindow = window as ExtendedWindow;

    // Determine the platform
    navigationStore.dispatchPlatform({
        ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
        android: /Android/.test(navigator.userAgent),
        cordova: !!extendedWindow.cordova,
        electron: !!extendedWindow.electron,
        chrome: /Chrome/.test(navigator.userAgent),
        edge: /Edge/.test(navigator.userAgent),
        firefox: /Firefox/.test(navigator.userAgent),
        opera: /OPR/.test(navigator.userAgent),
        win: /Windows/.test(navigator.platform),
        mac: /MacIntel/.test(navigator.platform),
        linux: /Linux/.test(navigator.platform),
        touch: 'ontouchstart' in window,
        ssr: false,
    });

    const router = await createAppRouter();
    app.use(router);

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
            .then(async (auth: boolean) => {
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
                            .then((refreshed: boolean) => {
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
            .catch((error: any) => {
                console.error('Failed to authenticate with Keycloak', error);
                const authStore = useAuthStore();
                authStore.setAuthStatus(false);
                reject();
            });
    });
}

loadPlugins();
