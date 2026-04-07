import vuetify from 'eslint-config-vuetify'
import jsdoc from 'eslint-plugin-jsdoc'
import vue from 'eslint-plugin-vue'

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
    jsdoc,
    vue,
  },
  rules: {
    'linebreak-style': ['error', 'unix'],
    'vue/component-api-style': ['error', ['script-setup']],
    'vue/script-indent': ['error', 2, { baseIndent: 1, switchCase: 1 }],
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'error',
    'jsdoc/check-line-alignment': 'error',
  },
})
