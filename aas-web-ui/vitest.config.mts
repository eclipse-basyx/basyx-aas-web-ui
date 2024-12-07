import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.mts';

export default mergeConfig(
    viteConfig,
    defineConfig({
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
);
