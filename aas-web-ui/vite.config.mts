// Plugins
import Vue from '@vitejs/plugin-vue';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

function copyWebIfcWasmPlugin() {
    return {
        name: 'copy-web-ifc-wasm',
        buildStart() {
            // Copy WASM files from web-ifc to public/wasm directory
            const sourceDir = 'node_modules/web-ifc';
            const targetDir = 'public/wasm';

            if (!existsSync(targetDir)) {
                mkdirSync(targetDir, { recursive: true });
            }

            const wasmFiles = ['web-ifc.wasm', 'web-ifc-mt.wasm', 'web-ifc-node.wasm'];

            wasmFiles.forEach((file) => {
                const sourcePath = join(sourceDir, file);
                const targetPath = join(targetDir, file);

                if (existsSync(sourcePath)) {
                    copyFileSync(sourcePath, targetPath);
                }
            });
        },
    };
}

function copyOcctImportJsWasmFilesPlugin() {
    return {
        name: 'copy-occt-import-js-wasm',
        buildStart() {
            // Copy WASM files from occt-import-js to public/wasm directory
            const sourceDir = 'node_modules/occt-import-js/dist';
            const targetDir = 'public/wasm';

            if (!existsSync(targetDir)) {
                mkdirSync(targetDir, { recursive: true });
            }

            const wasmFiles = ['occt-import-js.wasm'];

            wasmFiles.forEach((file) => {
                const sourcePath = join(sourceDir, file);
                const targetPath = join(targetDir, file);

                if (existsSync(sourcePath)) {
                    copyFileSync(sourcePath, targetPath);
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
            copyOcctImportJsWasmFilesPlugin(),
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
            fs: {
                allow: ['..'],
            },
        },
        css: {
            preprocessorOptions: {
                sass: {},
            },
        },
        assetsInclude: ['**/*.wasm'],
        optimizeDeps: {
            exclude: ['occt-import-js'],
        },
        define: {
            global: 'globalThis',
        },
    };
});
