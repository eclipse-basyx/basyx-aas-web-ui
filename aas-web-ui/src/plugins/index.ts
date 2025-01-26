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

    // Stores
    const envStore = useEnvStore();

    const primaryLightColor = envStore.getEnvPrimaryLightColor;
    const primaryDarkColor = envStore.getEnvPrimaryDarkColor;

    const vuetify = await initializeVuetify(primaryLightColor, primaryDarkColor);
    app.use(vuetify);
}
