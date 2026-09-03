export function formatJsonPreview (source: string): string {
  try {
    return JSON.stringify(JSON.parse(source), null, 2)
  } catch {
    return source
  }
}

/** Format element-only XML; preserve documents whose whitespace may carry meaning. */
export function formatXmlPreview (source: string): string {
  if (!source.trim() || /<!DOCTYPE|<!\[CDATA\[|xml:space\s*=/i.test(source)) {
    return source
  }
  const document = new DOMParser().parseFromString(source, 'application/xml')
  if (document.querySelector('parsererror')) {
    return source
  }
  const elements = [...document.querySelectorAll('*')]
  if (elements.some(element => element.children.length > 0
    && [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))) {
    return source
  }

  function indent (element: Element, depth: number): void {
    if (element.children.length === 0) {
      return
    }
    const children = [...element.childNodes].filter(node => node.nodeType !== Node.TEXT_NODE || node.textContent?.trim())
    element.replaceChildren()
    for (const child of children) {
      element.append(document.createTextNode(`\n${'  '.repeat(depth + 1)}`))
      if (child.nodeType === Node.ELEMENT_NODE) {
        indent(child as Element, depth + 1)
      }
      element.append(child)
    }
    element.append(document.createTextNode(`\n${'  '.repeat(depth)}`))
  }

  indent(document.documentElement, 0)
  const declaration = source.match(/^\s*(<\?xml\s[^?]*\?>)/)?.[1]
  const formatted = new XMLSerializer().serializeToString(document)
  // Browsers differ in whether the parsed document retains the XML declaration.
  const body = formatted.replace(/^\s*<\?xml\s[^?]*\?>\s*/, '')
  return declaration ? `${declaration}\n${body}` : formatted
}
