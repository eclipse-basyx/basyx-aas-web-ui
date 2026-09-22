import vuetify from 'eslint-config-vuetify'
import jsdoc from 'eslint-plugin-jsdoc'
import vue from 'eslint-plugin-vue'
import { noRedundantAutoImportedComponent } from './eslint-rules/no-redundant-auto-imported-component.js'
import { noRedundantAutoImportedVueApi } from './eslint-rules/no-redundant-auto-imported-vue-api.js'

export default vuetify({
  ts: true,
  ignore: {
    ignore: ['public/**'],
  },
  stylistic: {
    severity: 'error',
  },
}, {
  plugins: {
    basyx: {
      rules: {
        'no-redundant-auto-imported-component': noRedundantAutoImportedComponent,
        'no-redundant-auto-imported-vue-api': noRedundantAutoImportedVueApi,
      },
    },
    jsdoc,
    vue,
  },
  rules: {
    'linebreak-style': ['error', 'unix'],
    'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
    'vue/component-api-style': ['error', ['script-setup']],
    'vue/script-indent': ['error', 2, { baseIndent: 1, switchCase: 1 }],
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'error',
    'jsdoc/check-line-alignment': 'error',
  },
}, {
  files: ['src/**/*.{ts,tsx,js,jsx,vue,mts,mjs}'],
  rules: {
    'basyx/no-redundant-auto-imported-vue-api': 'error',
  },
}, {
  files: ['src/**/*.vue'],
  rules: {
    'basyx/no-redundant-auto-imported-component': 'error',
  },
})
