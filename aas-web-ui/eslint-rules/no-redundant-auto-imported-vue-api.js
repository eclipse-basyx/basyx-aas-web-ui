import { vueRuntimeAutoImports } from '../config/auto-imports.js'
import { removeImportSpecifiers } from './import-fixes.js'

const autoImportedVueApis = new Set(vueRuntimeAutoImports)

function getImportedName (specifier) {
  return specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value
}

const noRedundantAutoImportedVueApi = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow explicit imports for Vue APIs provided by unplugin-auto-import.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      redundantImports: '{{names}} {{verb}} provided by unplugin-auto-import. Remove the redundant {{noun}}.',
    },
  },
  create (context) {
    const sourceCode = context.sourceCode

    return {
      ImportDeclaration (node) {
        if (node.source.value !== 'vue' || node.importKind === 'type') {
          return
        }

        const redundantSpecifiers = node.specifiers.filter(specifier => (
          specifier.type === 'ImportSpecifier'
          && specifier.importKind !== 'type'
          && autoImportedVueApis.has(getImportedName(specifier))
        ))

        if (redundantSpecifiers.length === 0) {
          return
        }

        const importedNames = redundantSpecifiers.map(specifier => getImportedName(specifier))
        const plural = importedNames.length > 1

        context.report({
          node: redundantSpecifiers[0],
          messageId: 'redundantImports',
          data: {
            names: importedNames.map(name => `'${name}'`).join(', '),
            verb: plural ? 'are' : 'is',
            noun: plural ? 'imports' : 'import',
          },
          fix: fixer => removeImportSpecifiers(fixer, sourceCode, node, redundantSpecifiers),
        })
      },
    }
  },
}

export { noRedundantAutoImportedVueApi }
