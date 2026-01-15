import { describe, expect, it } from 'vitest';
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';

// Define test data
const testData = [
    {
        testId: 'a02d1932-06bf-4a75-88e4-4c989f3c2f30',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'AAS-3.0',
                    protocolInformation: {
                        href: 'http://example.com/aasEndpoint',
                    },
                },
            ],
        },
        interfaceShortName: 'AAS-3.0',
        result: 'http://example.com/aasEndpoint',
    },
    {
        testId: 'bf24b84b-d1c2-4b4c-94ea-5849344ce003',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'AAS-3.0',
                    protocolInformation: {
                        href: '',
                    },
                },
            ],
        },
        interfaceShortName: 'AAS-3.0',
        result: '',
    },
    {
        testId: '81f24ed8-3935-466d-a2ba-cd4cd56ac5b6',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'AAS-3.0',
                    protocolInformation: {},
                },
            ],
        },
        interfaceShortName: 'AAS-3.0',
        result: '',
    },
    {
        testId: 'cb99220e-db19-46be-8df6-a7530b77f9e0',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'AAS-3.0',
                },
            ],
        },
        interfaceShortName: 'AAS-3.0',
        result: '',
    },
    {
        testId: 'e1740859-463e-4b95-9faa-07f999ed6342',
        aasDescriptor: {
            endpoints: [{}],
        },
        interfaceShortName: 'AAS-3.0',
        result: '',
    },
    {
        testId: 'ffa2ad5e-1f38-4b9b-86b5-53957c516007',
        aasDescriptor: {
            endpoints: [],
        },
        interfaceShortName: 'AAS-3.0',
        result: '',
    },
    {
        testId: 'c4c667a5-51be-419e-a8f4-1a2cc615347b',
        aasDescriptor: {},
        interfaceShortName: 'AAS-3.0',
        result: '',
    },
    {
        testId: '6b1b781b-925b-4cbe-a8dd-151352f541a6',
        aasDescriptor: null,
        interfaceShortName: 'AAS-3.0',
        result: '',
    },
    // Fallback tests: AAS-3.0 not found, but AAS-REPOSITORY-3.0 exists
    {
        testId: 'fb5d2c1a-7e3f-4a9b-8c2d-9e1f4a5b6c7d',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'AAS-REPOSITORY-3.0',
                    protocolInformation: {
                        href: 'http://example.com/aas-repository',
                    },
                },
            ],
        },
        interfaceShortName: 'AAS-3.0',
        result: 'http://example.com/aas-repository',
    },
    // Fallback tests: AAS-3.0.1 not found, but AAS-REPOSITORY-3.0.1 exists (multi-part version)
    {
        testId: '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'AAS-REPOSITORY-3.0.1',
                    protocolInformation: {
                        href: 'http://example.com/aas-repository-v3.0.1',
                    },
                },
            ],
        },
        interfaceShortName: 'AAS-3.0.1',
        result: 'http://example.com/aas-repository-v3.0.1',
    },
    // Fallback tests: SUBMODEL-3.0 not found, but SUBMODEL-REPOSITORY-3.0 exists
    {
        testId: '3b4c5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'SUBMODEL-REPOSITORY-3.0',
                    protocolInformation: {
                        href: 'http://example.com/submodel-repository',
                    },
                },
            ],
        },
        interfaceShortName: 'SUBMODEL-3.0',
        result: 'http://example.com/submodel-repository',
    },
    // Fallback tests: SUBMODEL-3.0.2 not found, but SUBMODEL-REPOSITORY-3.0.2 exists (multi-part version)
    {
        testId: '4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'SUBMODEL-REPOSITORY-3.0.2',
                    protocolInformation: {
                        href: 'http://example.com/submodel-repository-v3.0.2',
                    },
                },
            ],
        },
        interfaceShortName: 'SUBMODEL-3.0.2',
        result: 'http://example.com/submodel-repository-v3.0.2',
    },
    // Test that exact match takes priority over fallback
    {
        testId: '5d6e7f8a-9b0c-1d2e-3f4a-5b6c7d8e9f0a',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'AAS-3.0',
                    protocolInformation: {
                        href: 'http://example.com/aas-exact',
                    },
                },
                {
                    interface: 'AAS-REPOSITORY-3.0',
                    protocolInformation: {
                        href: 'http://example.com/aas-repository',
                    },
                },
            ],
        },
        interfaceShortName: 'AAS-3.0',
        result: 'http://example.com/aas-exact',
    },
    // Test that exact match takes priority over fallback for SUBMODEL
    {
        testId: '6e7f8a9b-0c1d-2e3f-4a5b-6c7d8e9f0a1b',
        aasDescriptor: {
            endpoints: [
                {
                    interface: 'SUBMODEL-3.0',
                    protocolInformation: {
                        href: 'http://example.com/submodel-exact',
                    },
                },
                {
                    interface: 'SUBMODEL-REPOSITORY-3.0',
                    protocolInformation: {
                        href: 'http://example.com/submodel-repository',
                    },
                },
            ],
        },
        interfaceShortName: 'SUBMODEL-3.0',
        result: 'http://example.com/submodel-exact',
    },
];

describe("DescriptorUtils.ts; Tests for 'extractEndpointHref()'", () => {
    // Tests for extractEndpointHref()
    testData.forEach(function (testDataset) {
        // Define test data
        const aasDescriptor = testDataset.aasDescriptor;
        const interfaceShortName = testDataset.interfaceShortName;
        const result = testDataset.result;

        it(`${testDataset.testId}: extractEndpointHref('${aasDescriptor}', '${interfaceShortName}') === '${result}'`, () => {
            // Perform the assertion
            expect(extractEndpointHref(aasDescriptor, interfaceShortName)).toBe(result);
        });
    });
});
