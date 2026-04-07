/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
// Types
import type { App } from 'vue'
import { initializeVuetify } from '@/plugins/vuetify'
import { useEnvStore } from '@/store/EnvironmentStore' // replace with the path to your store file

export async function registerVuetify (app: App) {
  const envStore = useEnvStore()

  const primaryLightColor = envStore.getEnvPrimaryLightColor
  const primaryDarkColor = envStore.getEnvPrimaryDarkColor

  const vuetify = await initializeVuetify(primaryLightColor, primaryDarkColor)
  app.use(vuetify)
}
