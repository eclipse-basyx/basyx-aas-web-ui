// Plugins
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
// Utilities
import { defineConfig } from 'vite';
import eslintPlugin from 'vite-plugin-eslint';
import vuetify from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        eslintPlugin({
            include: ['./src/**/*.js', './src/**/*.vue', './src/**/*.ts'],
        }),
        // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
        vuetify({
            autoImport: true,
            styles: {
                configFile: 'src/styles/settings.scss',
            },
        }),
    ],
    base: '',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
    },
    server: {
        port: 3000,
        hmr: true, // enable hot module replacement
    },
});
