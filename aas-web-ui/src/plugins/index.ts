/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
// Types
import type { App } from 'vue';
import { useEnvStore } from '@/store/EnvironmentStore'; // replace with the path to your store file
import { initializeVuetify } from './vuetify';
import { loadFonts } from './webfontloader';

export async function registerPlugins(app: App) {
    loadFonts();

    const envStore = useEnvStore();

    const primaryColor = envStore.getEnvPrimaryColor;

    const vuetify = await initializeVuetify(primaryColor);
    app.use(vuetify);
}
