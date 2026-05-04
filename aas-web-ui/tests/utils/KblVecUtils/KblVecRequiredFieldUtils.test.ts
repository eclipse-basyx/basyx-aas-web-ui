import { describe, it, expect } from 'vitest';
import { inferRequiredFieldValues } from '@/utils/KblVecUtils/KblVecRequiredFieldUtils'; // Pfad anpassen

describe('inferRequiredFieldValues', () => {
  it('extracts values from XML document', () => {
    const xml = `
            <assetAdministrationShell>
                <idShort>MyShell</idShort>
                <identification>
                    <id>AAS-123</id>
                </identification>
                <assetInformation>
                    <globalAssetId>Asset-456</globalAssetId>
                </assetInformation>
                <name>Test AAS</name>
                <description>Some description</description>
            </assetAdministrationShell>
        `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const result = inferRequiredFieldValues(
      [], // keine points → nur DOM
      doc,
      'my-file.xml',
      1000
    );

    expect(result.values).toEqual({
      shortId: 'my_file',
      aasId: 'AAS-123',
      assetId: 'Asset-456',
      aasName: 'Test AAS',
      aasDescription: 'Some description',
      assetKind: 'Instance',
    });

    expect(result.paths.aasId).toContain('assetAdministrationShell.identification');
    expect(result.paths.assetId).toContain('assetAdministrationShell.assetInformation');
  });

  it('prefers File-Name over XML', () => {
    const xml = `
            <root>
                <idShort>TrueValue</idShort>
            </root>
        `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const result = inferRequiredFieldValues(
      [],
      doc,
      'file.xml',
      100
    );

    expect(result.values.shortId).toBe('file');
    expect(result.paths.shortId).toBe('');
    //fehler: während file als short_id beibehalten wird, wird der Path davon geändert
  });

  it('derives shortId correctly from filename', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<root/>', 'text/xml');

    const result = inferRequiredFieldValues([], doc, '123 test file.xml', 10);

    expect(result.values.shortId).toBe('E_123_test_file');
  });
/*
  it('correct maxElementScan limit', () => {
    const xml = `
            <root>
                <ignored>
                    <idShort>ShouldNotBeFound</idShort>
                </ignored>
                <identification>ShouldBeFound</identification>
                <again>
                    <hey>hi</hey>
                </again>
            </root>
        `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const result = inferRequiredFieldValues([], doc, 'file.xml', 3);

    expect(result.values.aasId).toBe('ShouldBeFound');
  });
  //Ergebnis: maxElementScan wird zwar nicht ignoriert, aber ist unaussagend, ich würde bei drei spätestens sagen, dass es gefunden werden sollte.
  */

  it('interprets <aas>-tags correctly', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`
            <aas>
                <ignored>
                    <idShort>Fake-ID</idShort>
                </ignored>
                <identification>AAS-ID</identification>
                <again>
                    <hey>hi</hey>
                </again>
            </aas>
            `, 'text/xml');

    const result = inferRequiredFieldValues([], doc, 'AASID.xml', 10);

    expect(result.values.aasId).toBe('AAS-ID');
  });

  it('interprets <aas>-tags correctly with limited Scans', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`
            <aas>
                <ignored>
                    <idShort>Fake-ID</idShort>
                </ignored>
                <identification>AAS-ID</identification>
            </aas>
            `, 'text/xml');

    const result = inferRequiredFieldValues([], doc, 'AASID.xml', 3);

    expect(result.values.aasId).toBe('AAS-ID');
  });

  it('two <identification>-tags', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`
            <aas>
                <identification>AAS-ID</identification>
                <identification>Fake-ID</identification>
            </aas>
            `, 'text/xml');

    const result = inferRequiredFieldValues([], doc, 'AASID.xml', 10);

    expect(result.values.aasId).toBe('AAS-ID');
  });

  it('prefers File-Name over data-points', () => {
    const xml = `
            <root>
                <idShort>WrongValue</idShort>
            </root>
        `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const points = [
      {
        label: 'assetAdministrationShell.idShort',
        value: 'CorrectValue',
      },
    ];

    const result = inferRequiredFieldValues(
      points,
      doc,
      'file.xml',
      100
    );

    expect(result.values.shortId).toBe('file');
    expect(result.paths.shortId).toBe('');
    //fehler: points werden auch vom Name überschrieben
  });

  it('reads description data point correctly', () => {
    const xml = `
            <root>
                <idShort>WrongValue</idShort>
            </root>
        `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const points = [
      {
        label: 'assetAdministrationShell.description',
        value: 'CorrectValue',
      },
    ];

    const result = inferRequiredFieldValues(
      points,
      doc,
      'file.xml',
      100
    );

    expect(result.values.aasDescription).toBe('CorrectValue');
    expect(result.paths.aasDescription).toBe('assetAdministrationShell.description');
  });

  it('reads description data point to only description', () => {
    const xml = `
            <root/>
        `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const points = [
      {
        label: 'assetAdministrationShell.description',
        value: 'CorrectValue',
      },
    ];

    const result = inferRequiredFieldValues(
      points,
      doc,
      'file.xml',
      100
    );

    expect(result.values.aasDescription).toBe('CorrectValue');
    expect(result.values.aasId).toBe('');
    expect(result.values.aasName).toBe('');
    expect(result.values.assetId).toBe('');
    expect(result.values.assetKind).toBe('');
    expect(result.values.shortId).toBe('file');
    expect(result.paths.aasDescription).toBe('assetAdministrationShell.description');
    expect(result.paths.aasId).toBe('');
    expect(result.paths.aasName).toBe('');
    expect(result.paths.assetId).toBe('');
    expect(result.paths.assetKind).toBe('');
    expect(result.paths.shortId).toBe('');
    //fehler: points überschreiben alles
  });

  it('prefers data points over XML', () => {
    const xml = `
            <root>
                <description>FalseValue</description>
            </root>
        `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const points = [
      {
        label: 'assetAdministrationShell.description',
        value: 'CorrectValue',
      },
    ];

    const result = inferRequiredFieldValues(
      points,
      doc,
      'file.xml',
      100
    );

    expect(result.values.aasDescription).toBe('CorrectValue');
    expect(result.paths.aasDescription).toBe('assetAdministrationShell.description');
  });
});
