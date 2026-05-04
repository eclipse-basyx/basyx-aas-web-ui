import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
import { describe, it, expect } from 'vitest';
import { buildSubmodelsFromSelection } from '@/utils/KblVecUtils/KblVecSubmodelGenerationUtils'; // Pfad anpassen

// Minimaler Fake für File (jsdom kann das, aber so ist es stabil)
function createFile(name: string, content = 'test'): File {
  return new File([content], name, {
    type: 'text/xml',
    lastModified: new Date('2024-01-01').getTime(),
  });
}

describe('buildSubmodelsFromSelection', () => {
  it('builds technical + handover submodels from selected nodes', () => {
    const file = createFile('example.vec');

    const dataPointTree = [
      {
        key: 'group:person',
        label: 'person',
        displayLabel: 'person',
        exportIdShort: 'person',
        kindLabel: '',
        value: '',
        leafCount: 1,
        depth: 0,
        selectable: false,
        hasChildren: true,
        icon: '',
        expanded: true,
        children: [
          {
            key: 'node:person:1',
            label: 'person',
            displayLabel: 'person',
            exportIdShort: 'PersonNode',
            kindLabel: '',
            value: '',
            leafCount: 1,
            depth: 1,
            selectable: true,
            hasChildren: false,
            icon: '',
            expanded: false,
            children: [],
            exportPoints: [
              {
                key: 'leaf:person.name:1',
                label: 'person.name',
                value: 'Max',
              },
            ],
          },
        ],
        exportPoints: [],
      },
    ];

    const selectedKeys = new Set<string>(['node:person:1']);

    const result = buildSubmodelsFromSelection(
      'aas-123',
      file,
      dataPointTree as any,
      selectedKeys,
      true,
      () => 'application/xml'
    );

    //  Grundstruktur
    expect(result.submodels.length).toBe(2);

    const [technical, handover] = result.submodels;

    //  Technical Submodel vorhanden
    expect(technical.idShort).toBe('TechnicalData');
    expect(technical.submodelElements?.length).toBeGreaterThan(0);

    //  Handover Submodel immer vorhanden
    expect(handover.idShort).toBe('HandoverDocumentation');

    //  DataPointCount korrekt
    expect(result.dataPointCount).toBe(1);

    //  Property wurde erzeugt
    const groupCollection = technical.submodelElements?.[0];
    const nodeCollection = groupCollection?.value?.[0];
    const property = nodeCollection?.value?.[0];

    expect(property.value).toBe('Max');
  });

  it('returns only handover submodel if nothing selected', () => {
    const file = createFile('example.xml');

    const result = buildSubmodelsFromSelection(
      'aas-123',
      file,
      [],
      new Set(),
      false,
      () => 'application/xml'
    );

    expect(result.submodels.length).toBe(1);
    expect(result.submodels[0].idShort).toBe('HandoverDocumentation');
    expect(result.dataPointCount).toBe(0);
  });

  it('ensures unique idShorts for duplicate nodes', () => {
    const file = createFile('example.xml');

    const node = {
      key: 'node:1',
      label: 'item',
      displayLabel: 'item',
      exportIdShort: 'duplicate',
      kindLabel: '',
      value: '',
      leafCount: 1,
      depth: 1,
      selectable: true,
      hasChildren: false,
      icon: '',
      expanded: false,
      children: [],
      exportPoints: [
        { key: '1', label: 'item.value', value: 'A' },
      ],
    };

    const dataPointTree = [
      {
        key: 'group:item',
        label: 'item',
        displayLabel: 'item',
        exportIdShort: 'item',
        kindLabel: '',
        value: '',
        leafCount: 2,
        depth: 0,
        selectable: false,
        hasChildren: true,
        icon: '',
        expanded: true,
        children: [node, { ...node, key: 'node:2' }],
        exportPoints: [],
      },
    ];

    const selectedKeys = new Set(['node:1', 'node:2']);

    const result = buildSubmodelsFromSelection(
      'aas-123',
      file,
      dataPointTree as any,
      selectedKeys,
      false,
      () => 'application/xml'
    );

    const technical = result.submodels[0];
    const group = technical.submodelElements?.[0];

    const ids = (group?.value ?? []).map((c: any) => c.idShort);

    expect(ids[0]).toBe('duplicate');
    expect(ids[1]).toMatch(/^duplicate_2$/);
  });
});
