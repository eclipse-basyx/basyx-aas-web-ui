import { describe, expect, it } from 'vitest';
import { resolveAttachmentFetchPath, resolveAttachmentFilename } from '@/composables/AAS/AASXPackaging';

describe('AASXPackaging.ts; pure helper tests', () => {
    it('preserves repository attachment fetch path for download packaging', () => {
        const path = '  https://example.test/submodels/abc/submodel-elements/Documents.Manual.Pdf%20File  ';

        const fetchPath = resolveAttachmentFetchPath(path);

        expect(fetchPath).toBe('https://example.test/submodels/abc/submodel-elements/Documents.Manual.Pdf%20File');
    });

    it('sanitizes filename derived from file.value to match package path rules', () => {
        const file = {
            value: 'aHR0cHM6Ly9hZG1pbi1zaGVsbC5pby9pZHRhL1N1Ym1vZGVsVGVtcGxhdGUvRGlnaXRhbE5hbWVwbGF0ZS8zLzA-Markings[0].MarkingFile-Schwindegg.png',
            idShort: 'MarkingFile',
        };

        const fileName = resolveAttachmentFilename(file, 0, 'image/png');

        expect(fileName).toBe(
            'aHR0cHM6Ly9hZG1pbi1zaGVsbC5pby9pZHRhL1N1Ym1vZGVsVGVtcGxhdGUvRGlnaXRhbE5hbWVwbGF0ZS8zLzA-Markings-0-.MarkingFile-Schwindegg.png'
        );
    });

    it('falls back to sanitized idShort and extension when value has no filename extension', () => {
        const file = {
            value: 'urn:example:attachment',
            idShort: 'Manual File',
        };

        const fileName = resolveAttachmentFilename(file, 1, 'application/pdf');

        expect(fileName).toBe('Manual-File-2.pdf');
    });

    it('falls back to generic file prefix when idShort is empty', () => {
        const file = {
            value: 'urn:example:attachment',
            idShort: '',
        };

        const fileName = resolveAttachmentFilename(file, 2, 'image/png');

        expect(fileName).toBe('file-3-3.png');
    });
});
