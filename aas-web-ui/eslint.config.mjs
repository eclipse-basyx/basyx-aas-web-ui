import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';
import pluginPromise from 'eslint-plugin-promise';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import vue from 'eslint-plugin-vue';
import browserGlobals from 'globals';
import ts from 'typescript-eslint';

export default [
    {
        ignores: ['{dist,public}/**/*', 'vue-shim.d.ts'],
    },

    {
        languageOptions: {
            ecmaVersion: 'latest',
            globals: {
                ...browserGlobals.browser,
                process: 'readonly',
            },
        },
    },

    // js
    js.configs.recommended,

    // ts
    ...ts.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
            '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
            'no-console': [process.env.NODE_ENV === 'production' ? 'error' : 'warn', { allow: ['warn', 'error'] }],
        },
    },

    // vue
    ...vue.configs['flat/recommended'],
    {
        // files: ['*.vue', '**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
            },
        },
    },
    {
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/no-unused-vars': ['error', { ignorePattern: '^_' }],
            'vue/max-attributes-per-line': ['error', { singleline: 5 }],
            'vue/no-console': [process.env.NODE_ENV === 'production' ? 'error' : 'warn', { allow: ['warn', 'error'] }],
            'vue/component-api-style': ['error', ['script-setup', 'composition']],
        },
    },

    // Vue template-specific rules
    {
        files: ['*.vue'],
        rules: {
            'no-console': [process.env.NODE_ENV === 'production' ? 'error' : 'warn', { allow: ['warn', 'error'] }],
        },
    },

    // Sort imports
    {
        plugins: {
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [
                        [
                            '^\\u0000', // all side effects (0 at start)
                            '^[^/\\.].*\u0000$', // external types (0 at end)
                            '^\\..*\u0000$', // internal types (0 at end)
                            '^@?\\w', // Starts with @
                            '^[^.]', // any
                            '^\\.', // local
                        ],
                    ],
                },
            ],
            'simple-import-sort/exports': 'error',
            '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
        },
    },

    // Promise
    pluginPromise.configs['flat/recommended'],
    {
        rules: {
            'promise/always-return': 'off',
            'promise/catch-or-return': 'off',
        },
    },

    // Prettier
    {
        plugins: {
            prettier,
        },
        rules: {
            'prettier/prettier': 'error',
        },
    },

    // Disable rules that conflict with Prettier
    eslintConfigPrettier,
];
