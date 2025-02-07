/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Types
import type { PluginType } from '@/types/Application';
// Components
import { createPinia } from 'pinia';
// Composables
import { createApp } from 'vue';
import { defineComponent } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
// Plugins
import { registerPlugins } from '@/plugins';
import App from './App.vue';
import { initKeycloak, loginWithDirectGrant } from './authService';
import { createAppRouter } from './router';
import { useEnvStore } from './store/EnvironmentStore';
import { useNavigationStore } from './store/NavigationStore';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(VueApexCharts);

async function startApp(): Promise<void> {
    // Initialize the Environment Variable Store
    const envStore = useEnvStore();

    // create keycloak instance
    if (envStore.getKeycloakActive) {
        if (envStore.getPreconfiguredAuth) {
            // Try to login with preconfigured credentials
            const username = envStore.getPreconfiguredAuthUsername;
            const password = envStore.getPreconfiguredAuthPassword;

            try {
                await loginWithDirectGrant(
                    envStore.getKeycloakUrl,
                    envStore.getKeycloakRealm,
                    envStore.getKeycloakClientId,
                    username,
                    password
                );
            } catch {
                alert('Could not login with preconfigured credentials.');
                return;
            }
        } else {
            // Use the normal Keycloak login flow with redirect to the Keycloak login page
            try {
                await initKeycloak(envStore.getKeycloakUrl, envStore.getKeycloakRealm, envStore.getKeycloakClientId);
            } catch {
                alert('Could not connect to Keycloak.');
                return;
            }
        }
    }

    // Create the router
    const router = await createAppRouter();
    app.use(router);

    // Register Plugins (used for Vuetify components)
    await registerPlugins(app);

    // Register BaSyx Web UI Plugins aka Component Visualizations
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

    // Initialize the Navigation Store to manage the plugins
    const navigationStore = useNavigationStore();
    navigationStore.dispatchPlugins(plugins);

    // Mount the app
    app.mount('#app');
}

startApp();
