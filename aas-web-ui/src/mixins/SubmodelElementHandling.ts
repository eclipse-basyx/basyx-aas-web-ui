import md5 from 'md5';
import { v4 as uuidv4 } from 'uuid';
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import RequestHandling from '@/mixins/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';

export default defineComponent({
    name: 'SubmodelElementHandling',
    mixins: [RequestHandling],

    setup() {
        const aasStore = useAASStore();
        const navigationStore = useNavigationStore();
        const router = useRouter();

        return {
            aasStore, // AASStore Object
            navigationStore, // NavigationStore Object
            router, // Router Object
        };
    },

    computed: {
        // get AAS Discovery URL from Store
        aasDiscoveryUrl() {
            return this.navigationStore.getAASDiscoveryURL;
        },

        // get AAS Registry URL from Store
        aasRegistryUrl() {
            return this.navigationStore.getAASRegistryURL;
        },

        // Get the Submodel Repository URL from the Store
        submodelRepoUrl() {
            return this.navigationStore.getSubmodelRepoURL;
        },

        // Get the Concept Description Repository URL from the Store
        conceptDescriptionRepoUrl() {
            return this.navigationStore.getConceptDescriptionRepoURL;
        },

        // Get the Selected AAS from the Store
        selectedAAS() {
            return this.aasStore.getSelectedAAS;
        },
    },

    methods: {
        // converts AAS identification to UTF8 BASE64 encoded URL
        URLEncode(aasId: string) {
            const base64Id = btoa(unescape(encodeURIComponent(aasId)));
            const urlSafeBase64Id = base64Id.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '%3D');
            return urlSafeBase64Id;
        },

        // generate a unique ID (UUID)
        UUID() {
            return uuidv4();
        },

        // generate a unique ID (UUID) from a given string
        generateUUIDFromString(str: any): string {
            // create md5 hash from string
            const hash = md5(str);
            // create UUID from hash
            const guid =
                hash.substring(0, 8) +
                '-' +
                hash.substring(8, 12) +
                '-' +
                hash.substring(12, 16) +
                '-' +
                hash.substring(16, 20) +
                '-' +
                hash.substring(20, 32);
            return guid;
        },

        // convert date element to digits
        padTo2Digits(num: number) {
            return num.toString().padStart(2, '0');
        },

        // convert js date object to string
        formatDate(date: Date) {
            return (
                [date.getFullYear(), this.padTo2Digits(date.getMonth() + 1), this.padTo2Digits(date.getDate())].join(
                    '-'
                ) +
                ' ' +
                [
                    this.padTo2Digits(date.getHours()),
                    this.padTo2Digits(date.getMinutes()),
                    this.padTo2Digits(date.getSeconds()),
                ].join(':')
            );
        },

        // Function to capitalize the first letter of a string
        capitalizeFirstLetter(string: string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        // Function to check if the idShort of a SubmodelElement matches the given idShort
        checkIdShort(referable: any, idShort: string, startsWith: boolean = false, strict: boolean = false): boolean {
            if (idShort.trim() === '') return false;

            if (!referable || !referable.idShort || referable.idShort.length === 0) return false;

            if (startsWith) {
                // For matching e.g. ProductImage{00} with idShort ProductImage
                if (strict) {
                    return referable.idShort.startsWith(idShort);
                } else {
                    return referable.idShort.toLowerCase().startsWith(idShort.toLowerCase());
                }
            } else {
                if (strict) {
                    return referable.idShort === idShort;
                } else {
                    return referable.idShort.toLowerCase() === idShort.toLowerCase();
                }
            }
        },

        // Function to check if the SemanticID of a SubmodelElement matches the given SemanticID
        checkSemanticId(submodelElement: any, semanticId: string): boolean {
            if (semanticId.trim() == '') return false;

            if (
                !submodelElement.semanticId ||
                !submodelElement.semanticId.keys ||
                submodelElement.semanticId.keys.length == 0
            )
                return false;

            for (const key of submodelElement.semanticId.keys) {
                if (key.value.startsWith('0173-1#')) {
                    // Eclass IRDI like 0173-1#01-AHF578#001
                    // console.log('key.value', '0173-1#...');
                    // console.log('key.value', key.value);
                    // console.log('(1) ', semanticId);
                    // console.log('(2) ', semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1#$1-'));
                    // console.log(
                    //     '(3) ',
                    //     semanticId
                    //         .replace('https://api.eclass-cdp.com/', '')
                    //         .replace(/-1-(\d{2})-/, '-1#$1-')
                    //         .replace(/-(\d{3})$/, '#$1')
                    // );
                    if (new RegExp(/\*\d{2}$/).test(key.value)) {
                        key.value = key.value.slice(0, -3);
                    }
                    if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId)) {
                        // Eclass IRDI with version; like 0173-1#01-AHF578#001
                        // console.log('semanticId --> with version', semanticId);
                        if (
                            key.value === semanticId || // e.g.0173-1#01-AHF578#001
                            key.value === semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1#$1-') || // e.g. semanticId 0173/1///01#AHF578#001 --> 0173-1#01-AHF578#001
                            key.value ===
                                semanticId
                                    .replace('https://api.eclass-cdp.com/', '')
                                    .replace(/-1-(\d{2})-/, '-1#$1-')
                                    .replace(/-(\d{3})$/, '#$1') // e.g. semanticId https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173-1#01-AHF578#001
                        ) {
                            // console.log('--> with version: true');
                            return true;
                        }
                    } else {
                        // Eclass IRDI without version; like 0173-1#01-AHF578
                        // console.log('semanticId --> without version', semanticId);
                        if (
                            key.value.startsWith(semanticId) || // e.g. semanticId 0173-1#01-AHF578#001
                            key.value.startsWith(semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1#$1-')) || // e.g. semanticId0173/1///01#AHF578#001 --> 0173-1#01-AHF578#001
                            key.value.startsWith(
                                semanticId
                                    .replace('https://api.eclass-cdp.com/', '')
                                    .replace(/-1-(\d{2})-/, '-1#$1-')
                                    .replace(/-(\d{3})$/, '#$1')
                            ) // e.g. semanticId https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173-1#01-AHF578#001
                        ) {
                            // console.log('--> without version: true');
                            return true;
                        }
                    }
                } else if (key.value.startsWith('0173/1///')) {
                    // Eclass IRDI like 0173/1///01#AHF578#001
                    // console.log('key.value', '0173/1///...');
                    // console.log('key.value', key.value);
                    // console.log('semanticId', semanticId);
                    // console.log('(1) ', semanticId);
                    // console.log('(2) ', semanticId.replace(/-1#(\d{2})-/, '/1///$1#'));
                    // console.log(
                    //     '(3) ',
                    //     semanticId
                    //         .replace('https://api.eclass-cdp.com/', '')
                    //         .replace(/-1-(\d{2})-/, '/1///$1#')
                    //         .replace(/-(\d{3})$/, '#$1')
                    // );
                    if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId)) {
                        // Eclass IRDI with version; like 0173/1///01#AHF578#001
                        // console.log('semanticId --> with version', semanticId);
                        if (
                            key.value === semanticId || // e.g. semanticId 0173/1///01#AHF578#001
                            key.value === semanticId.replace(/-1#(\d{2})-/, '/1///$1#') || // e.g. semanticId 0173-1#01-AHF578#001 --> 0173/1///01#AHF578#001
                            key.value ===
                                semanticId
                                    .replace('https://api.eclass-cdp.com/', '')
                                    .replace(/-1-(\d{2})-/, '/1///$1#')
                                    .replace(/-(\d{3})$/, '#$1') // semanticId https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173/1///01#AHF578#001
                        ) {
                            // console.log('--> with version: true');
                            return true;
                        }
                    } else {
                        // Eclass IRDI without version; like 0173/1///01#AHF578
                        // console.log('semanticId --> without version', semanticId);
                        if (
                            key.value.startsWith(semanticId) || // e.g. semanticId 0173/1///01#AHF578#001
                            key.value.startsWith(semanticId.replace(/-1#(\d{2})-/, '/1///$1#')) || // e.g. semanticId 0173-1#01-AHF578#001 --> 0173/1///01#AHF578#001
                            key.value.startsWith(
                                semanticId
                                    .replace('https://api.eclass-cdp.com/', '')
                                    .replace(/-1-(\d{2})-/, '/1///$1#')
                                    .replace(/-(\d{3})$/, '#$1')
                            ) // semanticId https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173/1///01#AHF578#001
                        ) {
                            // console.log('--> without version: true');
                            return true;
                        }
                    }
                } else if (key.value.startsWith('https://api.eclass-cdp.com/0173-1')) {
                    // Eclass URL like https://api.eclass-cdp.com/0173-1-01-AHF578-001
                    // console.log('key.value', 'https://api.eclass-cdp.com/0173-1...');
                    // console.log('key.value', key.value);
                    // console.log('semanticId', semanticId);
                    // console.log('(1) ', semanticId);
                    // console.log(
                    //     '(2) ',
                    //     'https://api.eclass-cdp.com/' + semanticId.replace(/-1#(\d{2})-/, '-1-$1-').replaceAll('#', '-')
                    // );
                    // console.log(
                    //     '(3) ',
                    //     'https://api.eclass-cdp.com/' +
                    //         semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1-$1-').replaceAll('#', '-')
                    // );
                    if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId)) {
                        // Eclass URL with version (like https://api.eclass-cdp.com/0173-1-01-AHF578-001)
                        // console.log('semanticId --> with version', semanticId);
                        if (
                            key.value === semanticId || // e.g. semanticId https://api.eclass-cdp.com/0173-1-01-AHF578-001
                            key.value ===
                                'https://api.eclass-cdp.com/' +
                                    semanticId.replace(/-1#(\d{2})-/, '-1-$1-').replaceAll('#', '-') || // e.g. semanticId 0173-1#01-AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
                            key.value ===
                                'https://api.eclass-cdp.com/' +
                                    semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1-$1-').replaceAll('#', '-') // e.g. semanticId 0173/1///01#AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
                        ) {
                            // console.log('--> with version: true');
                            return true;
                        }
                    } else {
                        // Eclass URL without version (like https://api.eclass-cdp.com/0173-1-01-AHF578)
                        // console.log('semanticId --> without version', semanticId);
                        if (
                            key.value.startsWith(semanticId) || // e.g. semanticId https://api.eclass-cdp.com/0173-1-01-AHF578-001
                            key.value.startsWith(
                                'https://api.eclass-cdp.com/' +
                                    semanticId.replace(/-1#(\d{2})-/, '-1-$1-').replaceAll('#', '-')
                            ) || // e.g. semanticId 0173-1#01-AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
                            key.value.startsWith(
                                'https://api.eclass-cdp.com/' +
                                    semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1-$1-').replaceAll('#', '-')
                            ) // e.g. semanticId 0173/1///01#AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
                        ) {
                            // console.log('--> without version: true');
                            return true;
                        }
                    }
                } else if (key.value.startsWith('http://') || key.value.startsWith('https://')) {
                    // e.g. IDTA IRI like
                    if (new RegExp(/\/\d\/\d\/{1}/).test(semanticId)) {
                        if (key.value === semanticId) return true;
                    } else {
                        if (semanticId.startsWith(key.value)) return true;
                    }
                } else {
                    if (key.value === semanticId) return true;
                }
            }
            // console.log('--> false');
            return false;
        },

        // Function to check if the valueType is a number
        isNumber(valueType: any) {
            if (!valueType) return false;
            // List of all number types
            const numberTypes = [
                'double',
                'float',
                'integer',
                'int',
                'nonNegativeInteger',
                'positiveInteger',
                'unsignedLong',
                'unsignedInt',
                'unsignedShort',
                'unsignedByte',
                'nonPositiveInteger',
                'negativeInteger',
                'long',
                'short',
                'decimal',
                'byte',
            ];
            // strip xs: from the property if it exists
            if (valueType.includes('xs:')) {
                valueType = valueType.replace('xs:', '');
            }
            // check if the property is a number
            if (numberTypes.includes(valueType)) {
                return true;
            } else {
                return false;
            }
        },

        // Function to download a JSON File
        downloadJson(obj: any, fileName: string) {
            const jsonStr = JSON.stringify(obj, null, 4);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        // Function to download a binary File
        downloadFile(filename: string, fileContent: Blob) {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(fileContent);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        // Function to check if the referenced Element exists
        async checkReference(
            reference: any,
            currentAasDescriptor?: any
        ): Promise<{ success: boolean; aasDescriptor?: object; submodelRef?: object }> {
            // console.log(
            //     'checkReference (' + reference.type + '): ',
            //     'reference',
            //     reference,
            //     'currentAasDescriptor',
            //     currentAasDescriptor
            // );
            // TODO This check just works down to SM level. It is not working for checking the availability of a specific SME!
            const failResponse = { success: false, aasDescriptor: {}, submodelRef: {} }; // Define once for reuse

            if (reference.type === 'ExternalReference') {
                // Check ExternalReference
                let aasRegistryUrl = this.aasRegistryUrl;
                if (!aasRegistryUrl.includes('/shell-descriptors')) {
                    aasRegistryUrl += '/shell-descriptors';
                }
                const aasRegistryPath = aasRegistryUrl;
                const aasRegistryContext = 'retrieving AAS Descriptors';
                const disableMessage = false;
                try {
                    const aasRegistryResponse = await this.getRequest(
                        aasRegistryPath,
                        aasRegistryContext,
                        disableMessage
                    );
                    if (
                        aasRegistryResponse.success &&
                        aasRegistryResponse.data.result &&
                        aasRegistryResponse.data.result.length > 0
                    ) {
                        const aasDescriptorList = aasRegistryResponse.data.result;

                        if (reference?.keys[0]?.type === 'AssetAdministrationShell') {
                            if (reference?.keys[1]?.type === 'Submodel') {
                                return await this.checkSmReference(reference, aasDescriptorList);
                            }
                            return await this.checkAasReference(reference, aasDescriptorList);
                        } else if (reference?.keys[0]?.type === 'Submodel') {
                            return await this.checkSmReference(reference, aasDescriptorList, currentAasDescriptor);
                        } else {
                            return failResponse;
                        }
                    }
                    return failResponse;
                } catch {
                    // handle error
                    return failResponse;
                }
            } else if (reference.type === 'ModelReference') {
                // Check ModelReference
                let aasDescriptor = {};
                if (reference?.keys[0]?.type === 'AssetAdministrationShell') {
                    aasDescriptor = await this.checkAasReference(reference).then(({ aasDescriptor }) => {
                        return aasDescriptor;
                    });
                } else if (Object.keys(currentAasDescriptor).length > 0) {
                    aasDescriptor = currentAasDescriptor;
                }

                if (Object.keys(aasDescriptor).length > 0) {
                    const aasDescriptorList = [aasDescriptor];

                    if (reference?.keys[0]?.type === 'AssetAdministrationShell') {
                        if (reference?.keys[1]?.type === 'Submodel') {
                            return await this.checkSmReference(reference, aasDescriptorList, aasDescriptor);
                        }
                        return await this.checkAasReference(reference, aasDescriptorList);
                    } else if (reference?.keys[0]?.type === 'Submodel') {
                        return await this.checkSmReference(reference, aasDescriptorList, aasDescriptor);
                    }
                }
                return failResponse;
            } else {
                return failResponse;
            }
        },

        // Function to check if the referenced AAS exists
        async checkAasReference(
            aasReference: any,
            aasDescriptorList?: Array<any>
        ): Promise<{ success: boolean; aasDescriptor: object; submodelDescriptor: object }> {
            // console.log('checkAasReference', 'aasReference', aasReference, 'aasDescriptorList', aasDescriptorList);
            const failResponse = { success: false, aasDescriptor: {}, submodelDescriptor: {} }; // Define once for reuse

            if (aasReference?.keys[0]?.type !== 'AssetAdministrationShell') return failResponse;

            if (!Array.isArray(aasDescriptorList) || aasDescriptorList.length === 0) {
                let aasRegistryUrl = this.aasRegistryUrl;
                if (!aasRegistryUrl.includes('/shell-descriptors')) {
                    aasRegistryUrl += '/shell-descriptors';
                }
                const aasRegistryPath = aasRegistryUrl;
                const aasRegistryContext = 'retrieving AAS Descriptors';
                const disableMessage = false;
                try {
                    const aasRegistryResponse = await this.getRequest(
                        aasRegistryPath,
                        aasRegistryContext,
                        disableMessage
                    );
                    if (
                        aasRegistryResponse.success &&
                        aasRegistryResponse.data.result &&
                        aasRegistryResponse.data.result.length > 0
                    ) {
                        aasDescriptorList = aasRegistryResponse.data.result;
                    }
                } catch {
                    // handle error
                    return failResponse;
                }
            }

            if (Array.isArray(aasDescriptorList) && aasDescriptorList.length > 0) {
                const aasDescriptor = aasDescriptorList.find((aasDescriptor: any) => {
                    return aasDescriptor.id == aasReference?.keys[0]?.value;
                });

                return {
                    success: aasDescriptor ? true : false,
                    aasDescriptor: aasDescriptor ? aasDescriptor : {},
                    submodelDescriptor: {},
                };
            }

            return failResponse;
        },

        // Function to check if the referenced Submodel (+ SubmodelElement) exists (in aasDescriptor)
        async checkSmReference(
            smReference: any,
            aasDescriptorList: Array<any>,
            currentAasDescriptor?: any
        ): Promise<{ success: boolean; aasDescriptor?: object; submodelRef?: object }> {
            // console.log(
            //     'checkSmReference (' + smReference.type + '): ',
            //     'smReference',
            //     smReference,
            //     'aasDescriptorList (#' + (Array.isArray(aasDescriptorList) ? aasDescriptorList.length : 0) + ')',
            //     aasDescriptorList,
            //     'currentAasDescriptor',
            //     currentAasDescriptor
            // );
            const failResponse = { success: false, aasDescriptor: {}, submodelRef: {} }; // Define once for reuse
            if (smReference.type === 'ExternalReference') {
                // Check ExternalReference
                const promises = aasDescriptorList.map(async (aasDescriptor: any) => {
                    const aasEndpoint = this.extractEndpointHref(aasDescriptor, 'AAS-3.0');
                    const aasRepoPath = aasEndpoint + '/submodel-refs';
                    const aasRepoContext = 'retrieving Submodel References';
                    const disableMessage = false;

                    const aasRepoResponse = await this.getRequest(aasRepoPath, aasRepoContext, disableMessage);
                    if (aasRepoResponse.success) {
                        const submodelRefList = aasRepoResponse.data.result;
                        let foundSubmodelRef = {};
                        if (smReference?.keys[0]?.type === 'Submodel') {
                            foundSubmodelRef = submodelRefList.find(
                                (submodelRef: any) => submodelRef.keys[0].value == smReference.keys[0].value
                            );
                        } else if (
                            smReference?.keys[0]?.type === 'AssetAdministrationShell' &&
                            smReference?.keys[0].value === aasDescriptor?.id &&
                            smReference?.keys[1]?.type === 'Submodel'
                        ) {
                            foundSubmodelRef = submodelRefList.find(
                                (submodelRef: any) => submodelRef.keys[0].value == smReference.keys[1].value
                            );
                        }
                        if (Object.keys(foundSubmodelRef).length > 0) {
                            return { success: true, aasDescriptor: aasDescriptor, submodelRef: foundSubmodelRef };
                        }
                    }
                    return null; // null signifies that this particular iteration didn't find what it was looking for
                });

                const results = await Promise.all(promises);
                const result = results.find((result) => result !== null);

                if (result) return result; // One of the ieterations was successful
                return { success: false, aasDescriptor: {}, submodelRef: {} }; // None of the iterations were successful
            } else if (smReference.type === 'ModelReference') {
                // Check ModelReference
                let aasDescriptor = {};

                if (smReference?.keys[0]?.type === 'AssetAdministrationShell') {
                    aasDescriptor = await this.checkAasReference(smReference).then(({ aasDescriptor }) => {
                        return aasDescriptor;
                    });
                } else if (Object.keys(currentAasDescriptor).length > 0) {
                    aasDescriptor = currentAasDescriptor;
                }

                if (
                    smReference?.keys[0]?.type === 'AssetAdministrationShell' &&
                    smReference?.keys[1]?.type === 'Submodel'
                ) {
                    const promises = aasDescriptorList.map(async (aasDescriptor: any) => {
                        const aasEndpoint = this.extractEndpointHref(aasDescriptor, 'AAS-3.0');
                        const aasRepoPath = aasEndpoint + '/submodel-refs';
                        const aasRepoContext = 'retrieving Submodel References';
                        const disableMessage = false;

                        const aasRepoResponse = await this.getRequest(aasRepoPath, aasRepoContext, disableMessage);
                        if (aasRepoResponse.success) {
                            const submodelRefList = aasRepoResponse.data.result;
                            let foundSubmodelRef = {};
                            // if (
                            //     smReference?.keys[0]?.type === 'AssetAdministrationShell' &&
                            //     smReference?.keys[0].value === aasDescriptor?.id &&
                            //     smReference?.keys[1]?.type === 'Submodel'
                            // ) {
                            foundSubmodelRef = submodelRefList.find(
                                (submodelRef: any) => submodelRef.keys[0].value == smReference.keys[1].value
                            );
                            // }
                            if (foundSubmodelRef && Object.keys(foundSubmodelRef).length > 0) {
                                return {
                                    success: true,
                                    aasDescriptor: aasDescriptor,
                                    submodelRef: foundSubmodelRef,
                                };
                            }
                        }
                        return null; // null signifies that this particular iteration didn't find what it was looking for
                    });

                    const results = await Promise.all(promises);
                    const result = results.find((result) => result !== null);

                    if (result) return result; // One of the ieterations was successful
                    return { success: false, aasDescriptor: {}, submodelRef: {} }; // None of the iterations were successful
                } else if (Object.keys(aasDescriptor).length > 0 && smReference?.keys[0]?.type === 'Submodel') {
                    const aasEndpoint = this.extractEndpointHref(aasDescriptor, 'AAS-3.0');
                    const aasRepoPath = aasEndpoint + '/submodel-refs';
                    const aasRepoContext = 'retrieving Submodel References';
                    const disableMessage = false;

                    const aasRepoResponse = await this.getRequest(aasRepoPath, aasRepoContext, disableMessage);
                    if (aasRepoResponse.success) {
                        const submodelRefList = aasRepoResponse.data.result;
                        const foundSubmodelRef = submodelRefList.find(
                            (submodelRef: any) => submodelRef.keys[0].value == smReference.keys[0].value
                        );
                        if (foundSubmodelRef && Object.keys(foundSubmodelRef).length > 0) {
                            return {
                                success: true,
                                aasDescriptor: aasDescriptor,
                                submodelRef: foundSubmodelRef,
                            };
                        }
                    }
                }

                return { success: false, aasDescriptor: aasDescriptor, submodelRef: {} };
            } else {
                return failResponse;
            }
        },

        // Function to jump to a referenced Element
        jumpToReference(reference: any, aasDescriptor?: any, smRef?: any) {
            // console.log('jumpToReference', 'reference', reference, 'aasDescriptor', aasDescriptor, 'smRef', smRef);
            if (smRef && Object.keys(smRef).length > 0) {
                // if the referenced Element is a Submodel or SubmodelElement
                // console.log(
                //     'jumpToReference --> jumpToSubmodelElement',
                //     'reference',
                //     reference,
                //     'aasDescriptor',
                //     aasDescriptor,
                //     'smRef',
                //     smRef
                // );
                this.jumpToSubmodelElement(reference, aasDescriptor, smRef);
            } else if (aasDescriptor && Object.keys(aasDescriptor).length > 0) {
                // if the referenced Element is an AAS
                // console.log('jumpToReference --> jumpToAas', 'aasDescriptor', aasDescriptor);
                this.jumpToAas(aasDescriptor);
            }
        },

        jumpToSubmodelElement(reference: any, aasDescriptor: any, smRef: any) {
            console.log(
                'jumpToSubmodelElement: ',
                'reference',
                reference,
                'aasDescriptor',
                aasDescriptor,
                'smRef',
                smRef
            );
            // TODO seicke!!!
            return;

            const aasEndpoint = this.extractEndpointHref(aasDescriptor, 'AAS-3.0');

            let path = this.submodelRepoUrl + '/' + this.URLEncode(smRef.keys[0].value).replace(/%3D/g, '');

            if (reference.value.keys.length > 1) {
                // this is the layer directly under the Submodel
                path += '/submodel-elements/' + reference.value.keys[1].value;
            }
            let promise; // Promise to wait for the SubmodelElementList to be requested (if it exists)
            if (reference.value.keys.length > 2) {
                // this is the layer under either a SubmodelElementCollection or SubmodelElementList
                promise = new Promise<void>((resolve, reject) => {
                    reference.value.keys.forEach((SubmodelElement: any, index: number) => {
                        if (index > 1) {
                            // check if the type of the SubmodelElement with index - 1 is a SubmodelElementList
                            if (reference.value.keys[index - 1].type == 'SubmodelElementList') {
                                // check in which position of the list the element is (list needs to be requested to get the position)
                                const listPath = path;
                                const context = 'retrieving SubmodelElementList';
                                const disableMessage = false;
                                this.getRequest(listPath, context, disableMessage)
                                    .then((response: any) => {
                                        if (response.success) {
                                            // execute if the Request was successful
                                            const list = response.data;
                                            list.value.forEach((element: any, i: number) => {
                                                if (this.checkIdShort(element, SubmodelElement.value, false, true)) {
                                                    path += encodeURIComponent('[') + i + encodeURIComponent(']');
                                                }
                                            });
                                            resolve();
                                        }
                                    })
                                    .catch((error: any) => {
                                        // console.error('Error with getRequest:', error);
                                        reject(error);
                                    });
                            } else {
                                path += '.' + SubmodelElement.value;
                            }
                        }
                    });
                    if (
                        reference.value.keys.every(
                            (SubmodelElement: any, index: number) =>
                                index <= 1 || reference.value.keys[index - 1].type != 'SubmodelElementList'
                        )
                    ) {
                        resolve(); // Resolve immediately if none of the elements are SubmodelElementList
                    }
                });
            } else {
                promise = Promise.resolve();
            }

            promise.then(() => {
                // check if mobile device
                if (this.navigationStore.getIsMobile) {
                    this.router.push({ name: 'SubmodelList', query: { aas: aasEndpoint, path: path } });
                } else {
                    // set the AAS Endpoint and SubmodelElement path in the aas and path query parameters using the router
                    this.router.push({ query: { aas: aasEndpoint, path: path } });
                }
                // dispatch the AAS set by the ReferenceElement to the store
                this.loadAndDispatchAas(aasEndpoint);
                this.navigationStore.dispatchTriggerAASListScroll();
                // Request the referenced SubmodelElement
                const elementPath = path;
                const context = 'retrieving SubmodelElement';
                const disableMessage = true;
                this.getRequest(elementPath, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // execute if the Request was successful
                        response.data.timestamp = this.formatDate(new Date()); // add timestamp to the SubmodelElement Data
                        response.data.path = path; // add the path to the SubmodelElement Data
                        response.data.isActive = true; // add the isActive Property to the SubmodelElement Data
                        // console.log('SubmodelElement Data: ', response.data)
                        // dispatch the SubmodelElementPath set by the URL to the store
                        this.aasStore.dispatchNode(response.data); // set the updatedNode in the AASStore
                        this.aasStore.dispatchInitTreeByReferenceElement(true); // set the initTreeByReferenceElement in the AASStore to true to init + expand the Treeview on the referenced Element
                    } else {
                        // execute if the Request failed
                        if (Object.keys(response.data).length == 0) {
                            // don't copy the static SubmodelElement Data if no Node is selected or Node is invalid
                            this.navigationStore.dispatchSnackbar({
                                status: true,
                                timeout: 60000,
                                color: 'error',
                                btnColor: 'buttonText',
                                text: 'No valid SubmodelElement under the given Path',
                            }); // Show Error Snackbar
                            return;
                        }
                        this.aasStore.dispatchNode({});
                    }
                });
            });
            // .catch((error) => {
            //     console.error('Error:', error);
            // });
        },

        async loadAndDispatchAas(aasEndpoint: string) {
            const path = aasEndpoint;
            const context = 'retrieving AAS Data';
            const disableMessage = true;
            this.getRequest(path, context, disableMessage).then((response: any) => {
                if (response.success) {
                    const aas = response.data as any;
                    const endpoints = [];
                    endpoints.push({ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' });
                    aas.endpoints = endpoints;
                    this.aasStore.dispatchSelectedAAS(aas);
                } else {
                    this.aasStore.dispatchSelectedAAS({});
                }
            });
        },

        async jumpToAas(aasDescriptor: any) {
            // console.log('jumpToAas', aasDescriptor);
            const aasEndpoint = this.extractEndpointHref(aasDescriptor, 'AAS-3.0');
            // check if mobile device
            if (this.navigationStore.getIsMobile) {
                this.router.push({ name: 'SubmodelList', query: { aas: aasEndpoint } });
            } else {
                // set the AAS Endpoint in the aas query parameter using the router
                this.router.push({ query: { aas: aasEndpoint } });
            }
            // dispatch the AAS set by the ReferenceElement to the store
            // console.log('AAS:', aas, 'Endpoint:', endpoint);
            await this.loadAndDispatchAas(aasEndpoint);
            this.navigationStore.dispatchTriggerAASListScroll();
        },

        // Function to check if the assetId can be found in the AAS Discovery Service (and if it exists in the AAS Registry)
        async checkAssetId(globalAssetId: string): Promise<{ success: boolean; aasDescriptor?: object }> {
            // console.log('checkAssetId', 'globalAssetId', globalAssetId);
            const failResponse = { success: false, aasDescriptor: {} }; // Define once for reuse
            // check if aasDiscoveryUrl includes "/lookup/shells" and add id if not (backward compatibility)
            let aasDiscoveryUrl = this.aasDiscoveryUrl;
            if (!aasDiscoveryUrl.includes('/lookup/shells')) {
                aasDiscoveryUrl += '/lookup/shells';
            }
            // construct the assetId Object
            const assetIdObject = JSON.stringify({ name: 'globalAssetId', value: globalAssetId });
            const aasDiscoveryPath = `${aasDiscoveryUrl}?assetIds=${this.URLEncode(assetIdObject)}`; // Use template literal and encodeURIComponent
            const aasDiscoveryContext = 'retrieving AAS ID by AssetID';
            const disableMessage = true;
            try {
                const aasDiscoveryResponse = await this.getRequest(
                    aasDiscoveryPath,
                    aasDiscoveryContext,
                    disableMessage
                );
                // console.log('discoveryContext', discoveryPath, 'discoveryResponse', discoveryResponse);
                if (aasDiscoveryResponse?.success && aasDiscoveryResponse?.data?.result?.length > 0) {
                    const aasIds = aasDiscoveryResponse.data.result;

                    // Take the first aasId from the list and check if it exists in the AAS Registry
                    const aasId = aasIds[0];
                    let aasRegistryUrl = this.aasRegistryUrl;
                    if (!aasRegistryUrl.includes('/shell-descriptors')) {
                        aasRegistryUrl += '/shell-descriptors';
                    }
                    const aasRegistryPath = `${aasRegistryUrl}/${this.URLEncode(aasId).replace(/%3D/g, '')}`;
                    const aasRegistryContext = 'retrieving AAS Descriptor';

                    const aasRegistryResponse = await this.getRequest(
                        aasRegistryPath,
                        aasRegistryContext,
                        disableMessage
                    );
                    if (aasRegistryResponse?.success && Object.keys(aasRegistryResponse?.data).length > 0) {
                        // console.log('registryContext', registryPath, 'registryResponse', registryResponse);
                        const aasDescriptor = aasRegistryResponse.data;
                        return { success: true, aasDescriptor: aasDescriptor };
                    }
                }

                return failResponse;
            } catch {
                return failResponse;
            }
        },

        // Get all ConceptDescriptions for the SubmodelElement from the ConceptDescription Repository
        async getConceptDescriptions(SelectedNode: any) {
            let conceptDescriptionRepoUrl = '';
            if (this.conceptDescriptionRepoUrl && this.conceptDescriptionRepoUrl != '') {
                conceptDescriptionRepoUrl = this.conceptDescriptionRepoUrl;
            } else {
                return Promise.resolve([]); // Return an empty object wrapped in a resolved promise
            }

            // return if no SemanticID is available
            if (!SelectedNode.semanticId || !SelectedNode.semanticId.keys || SelectedNode.semanticId.keys.length == 0) {
                return Promise.resolve([]);
            }

            const semanticIdsToFetch = SelectedNode.semanticId.keys.map((key: any) => {
                return key.value;
            });

            semanticIdsToFetch.forEach((semanticId: string) => {
                if (semanticId.startsWith('0173-1#')) {
                    // e.g. 0173-1#01-AHF578#001
                    semanticIdsToFetch.push(semanticId.replace(/-1#(\d{2})-/, '/1///$1#')); // 0173-1#01-AHF578#001 --> 0173/1///01#AHF578#001
                    semanticIdsToFetch.push('https://api.eclass-cdp.com/' + semanticId.replaceAll('#', '-')); // 0173-1#01-AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
                } else if (semanticId.startsWith('0173/1///')) {
                    // e.g. 0173/1///01#AHF578#001
                    semanticIdsToFetch.push(semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1#$1-')); // 0173/1///01#AHF578#001 --> 0173-1#01-AHF578#001
                    semanticIdsToFetch.push(
                        'https://api.eclass-cdp.com/' +
                            semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1-$1-').replaceAll('#', '-') // 0173/1///01#AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
                    );
                } else if (semanticId.startsWith('https://api.eclass-cdp.com/0173-1')) {
                    // e.g. https://api.eclass-cdp.com/0173-1-01-AHF578-001
                    semanticIdsToFetch.push(
                        semanticId
                            .replaceAll('https://api.eclass-cdp.com/', '')
                            .replace(/-1-(\d{2})-/, '-1#$1-')
                            .replace(/-(\d{3})$/, '#$1') // https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173-1#01-AHF578#001
                    );
                    semanticIdsToFetch.push(
                        semanticId
                            .replaceAll('https://api.eclass-cdp.com/', '')
                            .replace(/-1-(\d{2})-/, '/1///$1#')
                            .replace(/-(\d{3})$/, '#$1') // https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173/1///01#AHF578#001
                    );
                }
            });

            const cdPromises = semanticIdsToFetch.map((semanticId: string) => {
                const path = conceptDescriptionRepoUrl + '/' + this.URLEncode(semanticId).replace(/%3D/g, '');
                const context = 'retrieving ConceptDescriptions';
                const disableMessage = true;

                return this.getRequest(path, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // console.log('ConceptDescription Data: ', response.data);
                        const conceptDescription = response.data;
                        conceptDescription.path = path;
                        // Check if ConceptDescription has data to be displayed
                        if (
                            (conceptDescription.displayName && conceptDescription.displayName.length > 0) ||
                            (conceptDescription.description && conceptDescription.description.length > 0) ||
                            (conceptDescription.embeddedDataSpecifications &&
                                conceptDescription.embeddedDataSpecifications.length > 0)
                        ) {
                            return conceptDescription;
                        }
                        return {};
                    } else {
                        return {};
                    }
                });
            });

            let conceptDescriptions = await Promise.all(cdPromises);
            conceptDescriptions = conceptDescriptions.filter(
                (conceptDescription: any) => Object.keys(conceptDescription).length !== 0
            ); // Filter empty Objects
            return conceptDescriptions;
        },

        // calculate the pathes of the SubmodelElements in a provided Submodel/SubmodelElement
        async calculateSubmodelElementPathes(parent: any, startPath: string): Promise<any> {
            parent.path = startPath;
            parent.id = this.UUID();
            parent.conceptDescriptions = await this.getConceptDescriptions(parent);

            if (parent.submodelElements && parent.submodelElements.length > 0) {
                for (const element of parent.submodelElements) {
                    await this.calculateSubmodelElementPathes(
                        element,
                        startPath + '/submodel-elements/' + element.idShort
                    );
                }
            } else if (
                parent.value &&
                Array.isArray(parent.value) &&
                parent.value.length > 0 &&
                parent.modelType == 'SubmodelElementCollection'
            ) {
                for (const element of parent.value) {
                    await this.calculateSubmodelElementPathes(element, startPath + '.' + element.idShort);
                }
            } else if (
                parent.value &&
                Array.isArray(parent.value) &&
                parent.value.length > 0 &&
                parent.modelType == 'SubmodelElementList'
            ) {
                for (const [index, element] of parent.value.entries()) {
                    await this.calculateSubmodelElementPathes(
                        element,
                        startPath + encodeURIComponent('[') + index + encodeURIComponent(']')
                    );
                }
            } else if (
                parent.statements &&
                Array.isArray(parent.statements) &&
                parent.statements.length > 0 &&
                parent.modelType == 'Entity'
            ) {
                for (const element of parent.value) {
                    await this.calculateSubmodelElementPathes(element, startPath + '.' + element.idShort);
                }
            }

            return parent;
        },

        // Function to calculate the local path (used for files)
        getLocalPath(path: string, selectedNode: any): string {
            if (!path) return '';
            try {
                new URL(path);
                // If no error is thrown, path is a valid URL
                return path;
            } catch {
                // If error is thrown, path is not a valid URL
                return `${selectedNode.path}/attachment`;
            }
        },

        // Get the Unit from the EmbeddedDataSpecification of the ConceptDescription of the Property (if available)
        unitSuffix(prop: any) {
            if (!prop.conceptDescriptions) {
                this.getConceptDescriptions(prop).then((conceptDescriptions) => {
                    prop.conceptDescriptions = conceptDescriptions;
                });
            }
            if (!prop.conceptDescriptions || prop.conceptDescriptions.length == 0) {
                return '';
            }
            for (const conceptDescription of prop.conceptDescriptions) {
                if (!conceptDescription.embeddedDataSpecifications) {
                    continue;
                }
                for (const embeddedDataSpecification of conceptDescription.embeddedDataSpecifications) {
                    if (
                        embeddedDataSpecification.dataSpecificationContent &&
                        embeddedDataSpecification.dataSpecificationContent.unit
                    ) {
                        return embeddedDataSpecification.dataSpecificationContent.unit;
                    }
                }
            }
            return '';
        },

        // Get the Definition from the EmbeddedDataSpecification of the ConceptDescription of the Property (if available)
        cdDefinition(prop: any) {
            if (!prop.conceptDescriptions) {
                this.getConceptDescriptions(prop).then((conceptDescriptions) => {
                    prop.conceptDescriptions = conceptDescriptions;
                });
            }
            if (!prop.conceptDescriptions || prop.conceptDescriptions.length == 0) {
                return '';
            }
            for (const conceptDescription of prop.conceptDescriptions) {
                if (!conceptDescription.embeddedDataSpecifications) {
                    continue;
                }
                for (const embeddedDataSpecification of conceptDescription.embeddedDataSpecifications) {
                    if (
                        embeddedDataSpecification.dataSpecificationContent &&
                        embeddedDataSpecification.dataSpecificationContent.definition
                    ) {
                        const definitionEn = embeddedDataSpecification.dataSpecificationContent.definition.find(
                            (definition: any) => {
                                return definition.language === 'en' && definition.text !== '';
                            }
                        );
                        if (definitionEn && definitionEn.text) {
                            return definitionEn.text;
                        }
                    } else {
                        return '';
                    }
                }
            }
            return '';
        },

        // Name to be displayed
        nameToDisplay(sme: any, defaultNameToDisplay = '') {
            if (sme.displayName) {
                const displayNameEn = sme.displayName.find((displayName: any) => {
                    return displayName.language === 'en' && displayName.text !== '';
                });
                if (displayNameEn && displayNameEn.text) return displayNameEn.text;
            }
            return !defaultNameToDisplay && sme.idShort ? sme.idShort : defaultNameToDisplay;
        },

        descriptionToDisplay(referable: any) {
            if (referable && referable?.description) {
                const descriptionEn = referable.description.find(
                    (description: any) => description && description.language === 'en' && description.text !== ''
                );
                if (descriptionEn && descriptionEn.text) return descriptionEn.text;
            }
            return '';
        },

        valueToDisplay(submodelElement: any) {
            if (submodelElement && submodelElement.modelType) {
                switch (submodelElement.modelType) {
                    case 'Property':
                        if (!submodelElement.value) return '';
                        return (
                            submodelElement.value +
                            (this.unitSuffix(submodelElement) ? ' ' + this.unitSuffix(submodelElement) : '')
                        );
                    case 'MultiLanguageProperty': {
                        const valueEn = submodelElement.value.find((value: any) => {
                            return value && value.language === 'en' && value.text !== '';
                        });
                        const valueDe = submodelElement.value.find((value: any) => {
                            return value && value.language === 'de' && value.text !== '';
                        });
                        if (valueEn && valueEn.text) return valueEn.text;
                        if (valueDe && valueDe.text) return valueDe.text;
                        return '';
                    }
                    case 'File':
                    case 'Blob':
                        if (submodelElement.value.startsWith('http')) return submodelElement.value;
                        return submodelElement.path + '/attachment';
                    case 'Operation': // TODO
                    case 'ReferenceElement': // TODO
                    case 'Range': // TODO
                    case 'Entity': // TODO
                    case 'RelationshipElement': // TODO
                    case 'AnnotatedRelationshipElement': // TODO
                        return '';
                    default:
                        return '';
                }
            }
            return '';
        },

        // Extract the right endpoints href from a descriptor
        extractEndpointHref(descriptor: any, interfaceShortName: string): string {
            const interfaceShortNames = [
                'AAS',
                'SUBMODEL',
                'SERIALIZE',
                'DESCRIPTION',
                'AASX-FILE',
                'AAS-REGISTRY',
                'SUBMODEL-REGISTRY',
                'AAS-REPOSITORY',
                'SUBMODEL-REPOSITORY',
                'CD-REPOSITORY',
                'AAS-DISCOVERY',
            ];
            if (!interfaceShortNames.some((iShortName) => interfaceShortName.startsWith(`${iShortName}-`))) {
                return '';
            }
            if (
                !Array.isArray(descriptor?.endpoints) ||
                descriptor?.endpoints.length === 0 ||
                interfaceShortName === ''
            ) {
                return '';
            }
            const endpoints = descriptor.endpoints;
            // find the right endpoint based on the interfaceShortName (has to match endpoint.interface)
            const endpoint = endpoints.find((endpoint: any) => {
                return endpoint?.interface === interfaceShortName;
            });
            return endpoint?.protocolInformation?.href ? endpoint.protocolInformation.href : '';
        },

        smNotFound(response: any, submodelId: string, path: string, text: string): any {
            // Check if response contains a "messages" array with a "403" or "401" code
            const messages = response.data?.messages || [];
            const authorizationError = messages.some(
                (message: any) => message.code === '403' || message.code === '401'
            );

            if (authorizationError) {
                const submodel = {
                    id: submodelId,
                    idShort: 'Submodel Not Authorized!',
                    modelType: 'Submodel',
                    semanticId: null,
                    description: [],
                    displayName: [],
                    submodelElements: [],
                    isActive: false,
                    path: path,
                    authorizationError: true,
                };

                return submodel;
            }

            if (text.trim().length > 0) {
                this.navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 60000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: text,
                });
            }
            const submodel = {
                id: submodelId,
                idShort: 'Submodel not found',
                modelType: 'Submodel',
                semanticId: null,
                description: [],
                displayName: [],
                submodelElements: [],
                isActive: false,
                path: path,
                authorizationError: false,
            };
            return submodel;
        },
    },
});
