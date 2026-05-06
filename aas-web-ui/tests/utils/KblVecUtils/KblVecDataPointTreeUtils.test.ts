import { describe, it, expect } from 'vitest';
import { buildDataPointTree } from '@/utils/KblVecUtils/KblVecDataPointTreeUtils';

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, 'text/xml');
}

describe('buildDataPointTree', () => {

  it('groups children by tag name at root level', () => {
    const doc = parseXml(`
            <root>
                <a>1</a>
                <a>2</a>
                <b>3</b>
            </root>
        `);

    const result = buildDataPointTree(doc.documentElement);

    expect(result.length).toBe(2);

    const groupA = result.find(n => n.label === 'a');
    const groupB = result.find(n => n.label === 'b');

    expect(groupA?.children.length).toBe(2);
    expect(groupB?.children.length).toBe(1);
  });

  it('creates leaf nodes with text values', () => {
    const doc = parseXml(`
            <root>
                <name>Max</name>
            </root>
        `);

    const result = buildDataPointTree(doc.documentElement);
    const nameNode = result[0].children[0];

    expect(nameNode.value).toBe('Max');
    expect(nameNode.leafCount).toBe(1);
    expect(nameNode.exportPoints.length).toBe(1);
    expect(nameNode.selectable).toBe(false);
  });

  it('creates nested structure correctly', () => {
    const doc = parseXml(`
            <root>
                <person>
                    <name>Max</name>
                </person>
            </root>
        `);

    const result = buildDataPointTree(doc.documentElement);
    const personNode = result[0].children[0];
    const nameNode = personNode.children[0];

    expect(personNode.hasChildren).toBe(true);
    expect(nameNode.value).toBe('Max');
    expect(nameNode.depth).toBe(2);
  });

  it('uses id attribute in displayLabel and exportIdShort', () => {
    const doc = parseXml(`
            <root>
                <item id="abc-123">Value</item>
            </root>
        `);

    const result = buildDataPointTree(doc.documentElement);
    const node = result[0].children[0];

    expect(node.displayLabel).toContain('abc-123');
    expect(node.exportIdShort).toBe('abc_123');
    expect(node.selectable).toBe(true);
  });

  it('adds index for duplicate siblings without id', () => {
    const doc = parseXml(`
            <root>
                <item>1</item>
                <item>2</item>
            </root>
        `);

    const result = buildDataPointTree(doc.documentElement);
    const nodes = result[0].children;

    expect(nodes[0].displayLabel).toBe('item');
    expect(nodes[1].displayLabel).toBe('item [2]');
  });

  it('aggregates exportPoints across subtree', () => {
    const doc = parseXml(`
            <root>
                <person>
                    <name>Max</name>
                    <age>30</age>
                </person>
            </root>
        `);

    const result = buildDataPointTree(doc.documentElement);
    const personNode = result[0].children[0];

    expect(personNode.leafCount).toBe(2);
    expect(personNode.exportPoints.length).toBe(2);
  });

  it('sets selectable correctly', () => {
    const doc = parseXml(`
            <root>
                <parent>
                    <child>value</child>
                </parent>
                <leaf>text</leaf>
            </root>
        `);

    const result = buildDataPointTree(doc.documentElement);

    const parentNode = result.find(g => g.label === 'parent')?.children[0];
    const leafNode = result.find(g => g.label === 'leaf')?.children[0];

    expect(parentNode?.selectable).toBe(true);
    expect(leafNode?.selectable).toBe(false);
  });

  it('sanitizes exportIdShort correctly', () => {
    const doc = parseXml(`
            <root>
                <item>value</item>
            </root>
        `);

    const result = buildDataPointTree(doc.documentElement);
    const node = result[0].children[0];

    expect(node.exportIdShort).toMatch(/^[a-zA-Z_]/);
  });

});
