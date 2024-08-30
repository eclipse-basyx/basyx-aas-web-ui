/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import { loadFonts } from './webfontloader';
import { initializeVuetify } from './vuetify';

// Types
import type { App } from 'vue';
import { useEnvStore } from '@/store/EnvironmentStore'; // replace with the path to your store file

export async function registerPlugins(app: App) {
    loadFonts();

    const envStore = useEnvStore();

    let primaryColor = envStore.getEnvPrimaryColor;

    const vuetify = await initializeVuetify(primaryColor);
    app.use(vuetify);
}
