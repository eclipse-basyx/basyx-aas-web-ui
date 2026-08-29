import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = resolve(projectRoot, 'src')
const componentDeclarationPath = resolve(sourceRoot, 'components.d.ts')

const autoImportedComponents = loadAutoImportedComponents(componentDeclarationPath)

function loadAutoImportedComponents (declarationPath) {
  const declarations = readFileSync(declarationPath, 'utf8')
  const declarationDirectory = dirname(declarationPath)
  const components = new Map()
  const declarationPattern = /^\s+([A-Za-z_$][\w$]*): typeof import\('([^']+\.vue)'\)\['default'\]/gm

  for (const match of declarations.matchAll(declarationPattern)) {
    components.set(match[1], resolve(declarationDirectory, match[2]))
  }

  return components
}

function resolveComponentImport (source, filename) {
  if (source.includes('?')) {
    return null
  }

  let importPath

  if (source.startsWith('@/')) {
    importPath = resolve(sourceRoot, source.slice(2))
  } else if (source.startsWith('.')) {
    importPath = resolve(dirname(filename), source)
  } else {
    return null
  }

  const candidates = [importPath, `${importPath}.vue`, resolve(importPath, 'index.vue')]
  return candidates.find(candidate => existsSync(candidate)) ?? importPath
}

function normalizeComponentName (name) {
  return name.replaceAll('-', '').toLowerCase()
}

const noRedundantAutoImportedComponent = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow imports for components that are only used as auto-imported template tags.',
    },
    schema: [],
    messages: {
      redundantImport: 'The \'{{name}}\' import is redundant because the component is only used as an auto-imported template tag.',
    },
  },
  create (context) {
    const candidates = new Map()
    const staticTemplateTags = new Set()
    const templateExpressionReferences = new Set()
    const sourceCode = context.sourceCode

    function registerImport (node) {
      if (node.importKind === 'type' || typeof node.source.value !== 'string') {
        return
      }

      const importSource = resolveComponentImport(node.source.value, context.filename)
      if (!importSource) {
        return
      }

      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportDefaultSpecifier' || specifier.importKind === 'type') {
          continue
        }

        const componentSource = autoImportedComponents.get(specifier.local.name)
        if (componentSource === importSource) {
          candidates.set(specifier.local.name, { node: specifier.local, local: specifier.local })
        }
      }
    }

    function hasScriptReference (name, candidate) {
      const variable = sourceCode.scopeManager.scopes
        .flatMap(scope => scope.variables)
        .find(scopeVariable => scopeVariable.name === name && scopeVariable.identifiers.includes(candidate.local))

      return variable?.references.some(reference => reference.identifier !== candidate.local) ?? false
    }

    function reportRedundantImports () {
      for (const [name, candidate] of candidates) {
        if (!staticTemplateTags.has(normalizeComponentName(name))) {
          continue
        }
        if (templateExpressionReferences.has(name) || hasScriptReference(name, candidate)) {
          continue
        }

        context.report({
          node: candidate.node,
          messageId: 'redundantImport',
          data: { name },
        })
      }
    }

    const scriptVisitor = {
      'ImportDeclaration': registerImport,
      'Program:exit': reportRedundantImports,
    }

    const templateVisitor = {
      VElement (node) {
        staticTemplateTags.add(normalizeComponentName(node.rawName))
      },
      Identifier (node) {
        templateExpressionReferences.add(node.name)
      },
    }

    return sourceCode.parserServices.defineTemplateBodyVisitor(templateVisitor, scriptVisitor)
  },
}

export { noRedundantAutoImportedComponent }
