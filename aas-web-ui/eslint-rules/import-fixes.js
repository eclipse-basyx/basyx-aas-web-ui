function removeImportSpecifiers (fixer, sourceCode, declaration, specifiersToRemove) {
  if (sourceCode.getCommentsInside(declaration).length > 0) {
    return null
  }

  const removedSpecifiers = new Set(specifiersToRemove)
  const remainingSpecifiers = declaration.specifiers.filter(specifier => !removedSpecifiers.has(specifier))

  if (remainingSpecifiers.length === 0) {
    return removeImportLine(fixer, sourceCode, declaration)
  }

  const defaultSpecifier = remainingSpecifiers.find(specifier => specifier.type === 'ImportDefaultSpecifier')
  const namespaceSpecifier = remainingSpecifiers.find(specifier => specifier.type === 'ImportNamespaceSpecifier')
  const namedSpecifiers = remainingSpecifiers.filter(specifier => specifier.type === 'ImportSpecifier')
  const clauses = []

  if (defaultSpecifier) {
    clauses.push(sourceCode.getText(defaultSpecifier))
  }
  if (namespaceSpecifier) {
    clauses.push(sourceCode.getText(namespaceSpecifier))
  }
  if (namedSpecifiers.length > 0) {
    clauses.push(`{ ${namedSpecifiers.map(specifier => sourceCode.getText(specifier)).join(', ')} }`)
  }

  const source = sourceCode.getText(declaration.source)
  const suffix = sourceCode.text.slice(declaration.source.range[1], declaration.range[1])
  return fixer.replaceText(declaration, `import ${clauses.join(', ')} from ${source}${suffix}`)
}

function removeImportLine (fixer, sourceCode, declaration) {
  const text = sourceCode.text
  const lineStart = text.lastIndexOf('\n', declaration.range[0] - 1) + 1
  const nextLineBreak = text.indexOf('\n', declaration.range[1])
  const lineEnd = nextLineBreak === -1 ? text.length : nextLineBreak + 1
  const beforeDeclaration = text.slice(lineStart, declaration.range[0])
  const afterDeclaration = text.slice(declaration.range[1], nextLineBreak === -1 ? text.length : nextLineBreak)

  if (beforeDeclaration.trim() === '' && afterDeclaration.trim() === '') {
    return fixer.removeRange([lineStart, lineEnd])
  }

  return fixer.remove(declaration)
}

export { removeImportSpecifiers }
