import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config.mts'

export default defineConfig(env => {
  const resolvedViteConfig = typeof viteConfig === 'function'
    ? viteConfig({
        command: 'serve',
        mode: env.mode ?? 'test',
        isSsrBuild: false,
        isPreview: false,
      })
    : viteConfig

  return mergeConfig(resolvedViteConfig, {
    test: {
      globals: true,
      environment: 'jsdom',
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage',
      },
    },
  })
})
