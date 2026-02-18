import { describe, expect, it } from 'vitest';
import { buildAttachmentSmePath } from '@/composables/AAS/AASXImport';
import { resolveAttachmentFetchPath } from '@/composables/AAS/AASXPackaging';

describe('AASX path handling regression tests', () => {
    it('builds client import SME attachment path with dot-separated idShort segments', () => {
        const smEndpoint = 'https://example.test/submodels/encoded-submodel-id';
        const idShortPath = ['Documents', 'Manual', 'Pdf File'];

        const path = buildAttachmentSmePath(smEndpoint, idShortPath);

        expect(path).toBe(
            'https://example.test/submodels/encoded-submodel-id/submodel-elements/Documents.Manual.Pdf%20File'
        );
    });

    it('preserves repository attachment fetch path for download packaging', () => {
        const path = '  https://example.test/submodels/abc/submodel-elements/Documents.Manual.Pdf%20File  ';

        const fetchPath = resolveAttachmentFetchPath(path);

        expect(fetchPath).toBe('https://example.test/submodels/abc/submodel-elements/Documents.Manual.Pdf%20File');
    });
});
