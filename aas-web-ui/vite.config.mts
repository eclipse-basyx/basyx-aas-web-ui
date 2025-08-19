// Plugins
import Vue from '@vitejs/plugin-vue';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

// Custom plugin to copy web-ifc WASM files
function copyWebIfcWasmPlugin() {
    return {
        name: 'copy-web-ifc-wasm',
        buildStart() {
            // Copy WASM files from web-ifc to public/wasm directory
            const sourceDir = 'node_modules/web-ifc';
            const targetDir = 'public/wasm';

            // Ensure target directory exists
            if (!existsSync(targetDir)) {
                mkdirSync(targetDir, { recursive: true });
            }

            // Files to copy
            const wasmFiles = ['web-ifc.wasm', 'web-ifc-mt.wasm', 'web-ifc-node.wasm'];

            wasmFiles.forEach((file) => {
                const sourcePath = join(sourceDir, file);
                const targetPath = join(targetDir, file);

                if (existsSync(sourcePath)) {
                    copyFileSync(sourcePath, targetPath);
                    console.log(`✓ Copied ${file} to public/wasm/`);
                } else {
                    console.warn(`⚠ Could not find ${sourcePath}`);
                }
            });
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    const isProduction = mode === 'production';
    const base = isProduction ? process.env.BASE || '/__BASE_PATH_PLACEHOLDER__/' : '/';
    return {
        plugins: [
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
            // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
            Vuetify({
                autoImport: true,
                styles: {
                    configFile: 'src/styles/settings.scss',
                },
            }),
        ],
        base: base,
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
            extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
        },
        server: {
            port: 3000,
            hmr: true, // enable hot module replacement
        },
        css: {
            preprocessorOptions: {
                sass: {},
            },
        },
    };
});
