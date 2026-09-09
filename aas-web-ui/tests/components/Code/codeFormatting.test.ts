import { describe, expect, it, vi } from 'vitest'
import { formatJsonPreview, formatXmlPreview } from '@/utils/codeFormatting'

describe('preview formatting', () => {
  it('formats valid JSON without changing the supplied source', () => {
    const source = '{"count":2,"enabled":false}'
    expect(formatJsonPreview(source)).toBe('{\n  "count": 2,\n  "enabled": false\n}')
    expect(source).toBe('{"count":2,"enabled":false}')
  })

  it.each(['', '{bad json', '  invalid  ', 'false', '0', 'null'])('keeps malformed and primitive JSON readable: %s', source => {
    expect(formatJsonPreview(source)).toBe(source)
  })

  it('indents XML elements while preserving declarations, namespaces, comments and escaped values', () => {
    const source = '<?xml version="1.0"?><root xmlns="urn:test"><!--note--><child value="&amp;">hello</child><empty/></root>'
    const formatted = formatXmlPreview(source)
    expect(formatted).toContain('<?xml version="1.0"?>\n')
    expect(formatted).toContain('\n  <!--note-->\n  <child value="&amp;">hello</child>\n  <empty/>\n')
    const parsed = new DOMParser().parseFromString(formatted, 'application/xml')
    expect(parsed.documentElement.namespaceURI).toBe('urn:test')
    expect(parsed.querySelector('child')?.getAttribute('value')).toBe('&')
  })

  it('includes the XML declaration once even when the browser serializer retains it', () => {
    const serializer = vi.spyOn(XMLSerializer.prototype, 'serializeToString')
      .mockReturnValue('<?xml version="1.0"?><root/>')
    try {
      expect(formatXmlPreview('<?xml version="1.0"?><root/>')).toBe('<?xml version="1.0"?>\n<root/>')
    } finally {
      serializer.mockRestore()
    }
  })

  it.each([
    '', '<broken>', '<p>Hello <b>world</b>!</p>',
    '<root><![CDATA[ <raw> ]]><child/></root>',
    '<root xml:space="preserve">  <child/> </root>',
    '<!DOCTYPE root [<!ENTITY example "value">]><root>&example;</root>',
  ])('preserves whitespace-sensitive or malformed XML: %s', source => {
    expect(formatXmlPreview(source)).toBe(source)
  })
})
