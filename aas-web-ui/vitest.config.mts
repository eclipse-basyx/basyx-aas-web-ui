import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.mts';

export default defineConfig(({ mode }) => {
    const viteConfigResult = viteConfig({ mode });

    return {
        ...viteConfigResult,
        test: {
            globals: true,
            environment: 'jsdom',
            coverage: {
                provider: 'istanbul',
                reporter: ['text', 'json', 'html'],
                reportsDirectory: './coverage',
            },
        },
    };
});
