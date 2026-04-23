import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Fonts from 'unplugin-fonts/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

function copyWebIfcWasmPlugin () {
  return {
    name: 'copy-web-ifc-wasm',
    buildStart () {
      const sourceDir = 'node_modules/web-ifc'
      const targetDir = 'public/wasm'

      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      const wasmFiles = ['web-ifc.wasm', 'web-ifc-mt.wasm', 'web-ifc-node.wasm']

      for (const file of wasmFiles) {
        const sourcePath = join(sourceDir, file)
        const targetPath = join(targetDir, file)

        if (existsSync(sourcePath)) {
          copyFileSync(sourcePath, targetPath)
        }
      }
    },
  }
}

function getCommitSha (): string {
  try {
    return execSync('git rev-parse HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }
  const isProduction = mode === 'production'
  const base = isProduction ? process.env.BASE || '/__BASE_PATH_PLACEHOLDER__/' : '/'
  const version = process.env.VITE_APP_VERSION || 'dev'
  const commitSha = process.env.VITE_APP_COMMIT_SHA || getCommitSha()
  const buildDate = process.env.VITE_APP_BUILD_DATE || new Date().toISOString()

  return {
    plugins: [
      basicSsl(),
      copyWebIfcWasmPlugin(),
      AutoImport({
        imports: ['vue'],
        dts: 'src/auto-imports.d.ts',
        eslintrc: {
          enabled: true,
        },
        vueTemplate: true,
      }),
      Components({
        dts: 'src/components.d.ts',
      }),
      Vue({
        template: { transformAssetUrls },
      }),
      // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
      Vuetify({
        autoImport: true,
        styles: {
          configFile: 'src/styles/settings.scss',
        },
      }),
      Fonts({
        fontsource: {
          families: [
            {
              name: 'Roboto',
              weights: [100, 300, 400, 500, 700, 900],
              styles: ['normal', 'italic'],
            },
          ],
        },
      }),
    ],
    base,
    define: {
      'process.env': {
        NODE_ENV: mode,
      },
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
      'import.meta.env.VITE_APP_COMMIT_SHA': JSON.stringify(commitSha),
      'import.meta.env.VITE_APP_BUILD_DATE': JSON.stringify(buildDate),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
      extensions: [
        '.js',
        '.json',
        '.jsx',
        '.mjs',
        '.ts',
        '.tsx',
        '.vue',
      ],
    },
    server: {
      port: 3000,
      host: true,
      hmr: true,
    },
  }
})
