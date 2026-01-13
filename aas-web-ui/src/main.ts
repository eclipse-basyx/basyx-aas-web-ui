/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Types
import type { PluginType } from '@/types/Application';
import type { App as AppType } from 'vue';
// Components
import { createPinia } from 'pinia';
// Composables
import { createApp } from 'vue';
import { defineComponent } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import App from '@/App.vue';
// Plugins
import { registerVuetify } from '@/plugins';
import { createAppRouter } from '@/router';
import { useNavigationStore } from '@/store/NavigationStore';

initialize();

async function initialize(): Promise<void> {
    const app = createApp(App);

    // Pinia
    const pinia = createPinia();
    app.use(pinia);

    // ApexCharts
    app.component('ApexChart', VueApexCharts);

    // Stores
    const navigationStore = useNavigationStore();

    // Vuetify
    registerVuetify(app);

    // Load plugins aka Component Visualizations
    navigationStore.dispatchPlugins(await getVisualizations(app));

    // Determine if mobile or desktop
    const isMobile = window.matchMedia('(max-width: 600px)').matches;
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

    // Create the router (this also initializes InfrastructureStore which may trigger auth)
    const router = await createAppRouter();

    app.use(router);

    // Mount the app
    app.mount('#app');
}

async function getVisualizations(app: AppType): Promise<PluginType[]> {
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

    return plugins;
}
