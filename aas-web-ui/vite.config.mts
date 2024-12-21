// Plugins
import Vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
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
    base: '',
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
            sass: {
                api: 'modern-compiler',
            },
        },
    },
});
