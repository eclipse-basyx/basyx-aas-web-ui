import vuetify from 'eslint-config-vuetify'
import jsdoc from 'eslint-plugin-jsdoc'

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
  },
  rules: {
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'error',
    'jsdoc/check-line-alignment': 'error',
  },
})
