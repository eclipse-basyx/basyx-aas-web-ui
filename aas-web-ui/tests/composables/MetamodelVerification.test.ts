import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
import { describe, expect, it } from 'vitest';
import { applyFieldErrors, buildVerificationSummary, verifyForEditor } from '@/composables/MetamodelVerification';

describe('MetamodelVerification.ts', () => {
    it('reports invalid value error', () => {
        const property = new aasTypes.Property(aasTypes.DataTypeDefXsd.Int);
        property.idShort = 'property1';
        property.value = 'not-an-int';

        const result = verifyForEditor(property, { maxErrors: 10 });

        expect(result.isValid).toBe(false);
        expect(result.fieldErrors.size + result.globalErrors.length).toBeGreaterThan(0);
        expect(result.totalErrors).toBeGreaterThan(0);
    });

    it('caps reported errors to maxErrors', () => {
        const submodel = new aasTypes.Submodel('urn:example:submodel');
        submodel.submodelElements = [];

        for (let index = 0; index < 12; index += 1) {
            const property = new aasTypes.Property(aasTypes.DataTypeDefXsd.Int);
            property.idShort = `property${index}`;
            property.value = 'not-an-int';
            submodel.submodelElements.push(property);
        }

        const result = verifyForEditor(submodel, { maxErrors: 10 });

        expect(result.isValid).toBe(false);
        expect(result.truncated).toBe(true);
        expect(result.reportedErrors).toBe(10);
        expect(result.totalErrors).toBeGreaterThan(10);
    });

    it('builds summary text from result metadata', () => {
        const property = new aasTypes.Property(aasTypes.DataTypeDefXsd.Int);
        property.idShort = 'property1';
        property.value = 'not-an-int';

        const result = verifyForEditor(property, { maxErrors: 1 });

        expect(buildVerificationSummary(result)).toContain('Validation found');
    });

    it('applies field errors into existing map', () => {
        const targetMap = new Map<string, string>();
        const sourceMap = new Map<string, string>([['idShort', 'invalid value']]);

        applyFieldErrors(targetMap, sourceMap);

        expect(targetMap.get('idShort')).toBe('invalid value');
    });

    it('does not throw when optional idShort is undefined', () => {
        const property = new aasTypes.Property(aasTypes.DataTypeDefXsd.String);
        property.idShort = 'temp';
        (property as unknown as Record<string, unknown>).idShort = undefined;

        const result = verifyForEditor(property, { maxErrors: 10 });

        expect(result.isValid).toBe(false);
        expect(result.globalErrors.some((message) => message.includes('Verification failed unexpectedly'))).toBe(true);
    });
});
