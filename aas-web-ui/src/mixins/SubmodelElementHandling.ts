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
        submodelRegistryUrl() {
            return this.navigationStore.getSubmodelRepoURL;
        },

        // Get the Submodel Repository URL from the Store
        aasRepoUrl() {
            return this.navigationStore.getAASRepoURL;
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
            // console.log('checkSemanticId', 'submodelElement', submodelElement, 'semanticId', semanticId);
            if (semanticId.trim() == '') return false;

            if (!Array.isArray(submodelElement?.semanticId?.keys) || submodelElement.semanticId.keys.length == 0)
                return false;

            for (const key of submodelElement.semanticId.keys) {
                // console.log('checkSemanticId: ', 'key of submodelElement', key.value, 'semanticId', semanticId);
                if (key.value.startsWith('0112/')) {
                    return this.checkSemanticIdIecCdd(key.value, semanticId);
                } else if (key.value.startsWith('0173-1#') || key.value.startsWith('0173/1///')) {
                    return this.checkSemanticIdEclassIrdi(key.value, semanticId);
                } else if (key.value.startsWith('https://api.eclass-cdp.com/0173-1')) {
                    return this.checkSemanticIdEclassIrdiUrl(key.value, semanticId);
                } else if (key.value.startsWith('http://') || key.value.startsWith('https://')) {
                    return this.checkSemanticIdIri(key.value, semanticId);
                } else {
                    if (key.value === semanticId) return true;
                }
            }

            return false;
        },

        checkSemanticIdEclassIrdi(keyValue: string, semanticId: string): boolean {
            if (semanticId.trim() == '') return false;

            if (!keyValue.startsWith('0173-1#') && !keyValue.startsWith('0173/1///')) return false;

            if (keyValue.startsWith('0173-1#')) {
                // Eclass IRDI like 0173-1#01-AHF578#001
                if (new RegExp(/\*\d{2}$/).test(keyValue)) {
                    keyValue = keyValue.slice(0, -3);
                    semanticId = semanticId.slice(0, -3);
                }
                if (
                    new RegExp(/[#-]{1}\d{3}$/).test(semanticId) ||
                    new RegExp(/[#-]{1}\d{3}\*\d{1,}$/).test(semanticId)
                ) {
                    return this.getEquivalentEclassSemanticIds(keyValue).includes(semanticId);
                }

                // Eclass IRDI without version; like 0173-1#01-AHF578
                return (
                    this.getEquivalentEclassSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                        return equivalentSemanticId.startsWith(semanticId);
                    }, semanticId) != -1
                );
            } else if (keyValue.startsWith('0173/1///')) {
                if (
                    new RegExp(/[#-]{1}\d{3}$/).test(semanticId) ||
                    new RegExp(/[#-]{1}\d{3}\*\d{1,}$/).test(semanticId)
                ) {
                    // Eclass IRDI with version; like 0173/1///01#AHF578#001
                    return this.getEquivalentEclassSemanticIds(keyValue).includes(semanticId);
                }

                // Eclass IRDI without version; like 0173/1///01#AHF578
                return (
                    this.getEquivalentEclassSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                        return equivalentSemanticId.startsWith(semanticId);
                    }, semanticId) != -1
                );
            }

            return false;
        },

        checkSemanticIdEclassIrdiUrl(keyValue: string, semanticId: string): boolean {
            if (semanticId.trim() == '') return false;

            if (!keyValue.startsWith('https://api.eclass-cdp.com/0173-1')) return false;

            // Eclass URL like https://api.eclass-cdp.com/0173-1-01-AHF578-001
            if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId) || new RegExp(/[#-]{1}\d{3}~\d{1,}$/).test(semanticId)) {
                // Eclass URL with version (like https://api.eclass-cdp.com/0173-1-01-AHF578-001)
                return this.getEquivalentEclassSemanticIds(semanticId).includes(keyValue);
            }

            // Eclass URL without version (like https://api.eclass-cdp.com/0173-1-01-AHF578)
            return (
                this.getEquivalentEclassSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                    return equivalentSemanticId.startsWith(semanticId);
                }, semanticId) != -1
            );
        },

        checkSemanticIdIecCdd(keyValue: string, semanticId: string): boolean {
            if (semanticId.trim() == '') return false;

            if (!semanticId.startsWith('0112/')) return false;
            if (!keyValue.startsWith('0112/')) return false;

            // IEC CDD like 0112/2///61987#ABN590#002
            if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId)) {
                // IEC CDD with version; like 0112/2///61987#ABN590#002
                if (keyValue === semanticId) {
                    return true;
                }
            }

            // IEC CDD without version; like 0112/2///61987#ABN590
            return keyValue.startsWith(semanticId);
        },

        checkSemanticIdIri(keyValue: string, semanticId: string): boolean {
            // console.log('checkSemanticIdIri: ', 'keyValue', keyValue, 'semanticId', semanticId);
            if (semanticId.trim() == '') return false;

            if (!semanticId.startsWith('http://') && !semanticId.startsWith('https://')) return false;
            if (!keyValue.startsWith('http://') && !keyValue.startsWith('https://')) return false;

            if (keyValue.endsWith('/')) keyValue = keyValue.substring(0, keyValue.length - 1);
            if (semanticId.endsWith('/')) semanticId = semanticId.substring(0, semanticId.length - 1);

            if (
                new RegExp(/\/\d{1,}\/\d{1,}\/{0,1}$/).test(semanticId) ||
                new RegExp(/\/\d{1,}\/\d{1,}\//).test(semanticId)
            ) {
                // IRI with version like https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9
                // IRI with version like https://admin-shell.io/zvei/nameplate/1/0/ContactInformations
                return (
                    this.getEquivalentIriSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                        return equivalentSemanticId.toLowerCase() === semanticId.toLowerCase();
                    }, semanticId) != -1
                );
            }

            // IRI without version like https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/
            return (
                this.getEquivalentIriSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                    return equivalentSemanticId.toLowerCase().startsWith(semanticId.toLowerCase());
                }, semanticId) != -1
            );
        },

        getEquivalentEclassSemanticIds(semanticId: string): any[] {
            if (
                semanticId.trim() === '' ||
                (!semanticId.startsWith('0173-1#') &&
                    !semanticId.startsWith('0173/1///') &&
                    !semanticId.startsWith('https://api.eclass-cdp.com/0173-1'))
            )
                return [];

            const semanticIds: any[] = [semanticId];

            if (semanticId.startsWith('0173-1#')) {
                // e.g. 0173-1#01-AHF578#001
                semanticIds.push(semanticId.replace(/-1#(\d{2})-/, '/1///$1#')); // 0173-1#01-AHF578#001 --> 0173/1///01#AHF578#001
                semanticIds.push('https://api.eclass-cdp.com/' + semanticId.replaceAll('#', '-')); // 0173-1#01-AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
            } else if (semanticId.startsWith('0173/1///')) {
                // e.g. 0173/1///01#AHF578#001
                semanticIds.push(semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1#$1-')); // 0173/1///01#AHF578#001 --> 0173-1#01-AHF578#001
                semanticIds.push(
                    'https://api.eclass-cdp.com/' +
                        semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1-$1-').replaceAll('#', '-') // 0173/1///01#AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
                );
            } else if (semanticId.startsWith('https://api.eclass-cdp.com/0173-1')) {
                // e.g. https://api.eclass-cdp.com/0173-1-01-AHF578-001
                semanticIds.push(
                    semanticId
                        .replaceAll('https://api.eclass-cdp.com/', '')
                        .replace(/-1-(\d{2})-/, '-1#$1-')
                        .replace(/-(\d{3})$/, '#$1') // https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173-1#01-AHF578#001
                );
                semanticIds.push(
                    semanticId
                        .replaceAll('https://api.eclass-cdp.com/', '')
                        .replace(/-1-(\d{2})-/, '/1///$1#')
                        .replace(/-(\d{3})$/, '#$1') // https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173/1///01#AHF578#001
                );
            }

            // console.log('getEquivalentEclassSemanticIds', 'semanticId', semanticId, 'semanticIds', semanticIds);
            return semanticIds;
        },

        getEquivalentIriSemanticIds(semanticId: string): any[] {
            if (semanticId.trim() === '' || !(semanticId.startsWith('http://') || semanticId.startsWith('https://')))
                return [];

            const semanticIds: any[] = [semanticId];

            // e.g. IRI
            if (semanticId.endsWith('/')) {
                semanticIds.push(semanticId.substring(0, semanticId.length - 1));
            } else {
                semanticIds.push(semanticId + '/');
            }

            // console.log('getEquivalentIriSemanticIds', 'semanticId', semanticId, 'semanticIds', semanticIds);
            return semanticIds;
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
                this.navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 10000,
                    color: 'warning',
                    btnColor: 'buttonText',
                    text: 'Reference check for ExternalReference not implemented',
                }); // Show Error Snackbar
                return failResponse;
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
                        const checkResponse = await this.checkSmReference(reference, aasDescriptorList, aasDescriptor);
                        if (checkResponse?.success === false) {
                            // Check Reference to exist in other AAS
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

                                    const aasEndpoints = aasDescriptorList.map((aasDescriptor: any) => {
                                        return this.extractEndpointHref(aasDescriptor, 'AAS-3.0');
                                    });

                                    const aasList = await Promise.all(
                                        aasEndpoints.map((aasEndpoint: string) => {
                                            return this.fetchAas(aasEndpoint);
                                        })
                                    );

                                    const submodelId = reference?.keys[0]?.value;

                                    const aas = aasList.find((aas: any) => {
                                        const smRefs = aas.submodels;

                                        if (smRefs) {
                                            const smIds = smRefs.map((smRef: any) => {
                                                return smRef?.keys[0]?.value;
                                            });

                                            if (smIds) {
                                                const smId = smIds.find((smId: string) => {
                                                    return smId === submodelId;
                                                });

                                                if (smId) {
                                                    return true;
                                                }
                                            }
                                        }
                                    });

                                    if (aas) {
                                        return await this.checkSmReference(reference, aasDescriptorList, aas);
                                    }

                                    return failResponse;

                                    // return await this.checkSmReference(
                                    //     reference,
                                    //     aasDescriptorList,
                                    //     currentAasDescriptor
                                    // );
                                }
                                return failResponse;
                            } catch {
                                // handle error
                                return failResponse;
                            }
                        }
                        return checkResponse;
                    } else {
                        return failResponse;
                    }
                }

                return failResponse;
            } else {
                return failResponse;
            }
        },

        // Function to check if AAS of Reference exists
        async checkAasReference(
            aasReference: any,
            aasDescriptorList?: Array<any>
        ): Promise<{ success: boolean; aasDescriptor: object; submodelDescriptor: object }> {
            // console.log('checkAasReference()', 'aasReference', aasReference, 'aasDescriptorList', aasDescriptorList);
            const failResponse = { success: false, aasDescriptor: {}, submodelDescriptor: {} }; // Define once for reuse

            if (aasReference?.keys[0]?.type !== 'AssetAdministrationShell') return failResponse;

            if (!Array.isArray(aasDescriptorList) || aasDescriptorList.length === 0) {
                aasDescriptorList = await this.fetchAasDescriptorList();
            }

            if (aasDescriptorList && Array.isArray(aasDescriptorList) && aasDescriptorList.length > 0) {
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

            // Todo checkSmReference for ExternalReference
            if (smReference.type === 'ExternalReference') {
                this.navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 10000,
                    color: 'warning',
                    btnColor: 'buttonText',
                    text: 'Reference check for ExternalReference not implemented',
                }); // Show Error Snackbar
                return failResponse;
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
                            (submodelRef: any) => submodelRef.keys[0].value === smReference.keys[0].value
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
                // console.log('jumpToReference --> jumpToAasByAasDescriptor', 'aasDescriptor', aasDescriptor);
                this.jumpToAasByAasDescriptor(aasDescriptor);
            }
        },

        jumpToSubmodelElement(reference: any, aasDescriptor: any, smRef: any) {
            // console.log(
            //     'jumpToSubmodelElement()',
            //     'reference',
            //     reference,
            //     'aasDescriptor',
            //     aasDescriptor,
            //     'smRef',
            //     smRef
            // );

            const aasEndpoint = this.extractEndpointHref(aasDescriptor, 'AAS-3.0');
            const smId = smRef?.keys[0]?.value;

            // This is the Submodel layer
            let smRepoUrl = this.submodelRepoUrl;
            smRepoUrl += '/' + this.URLEncode(smId).replace(/%3D/g, '');

            // This is the layer directly under the Submodel
            if (
                Array.isArray(reference?.keys) &&
                reference?.keys.length > 1 &&
                reference?.keys[0]?.type === 'Submodel'
            ) {
                smRepoUrl += '/submodel-elements/' + reference.keys[1].value;
            } else if (
                Array.isArray(reference?.keys) &&
                reference?.keys.length > 2 &&
                reference?.keys[1]?.type === 'Submodel'
            ) {
                smRepoUrl += '/submodel-elements/' + reference.keys[2].value;
            }

            let promise; // Promise to wait for the SubmodelElementList to be requested (if it exists)
            if (
                Array.isArray(reference?.keys) &&
                ((reference?.keys.length > 2 && reference?.keys[0]?.type === 'Submodel') ||
                    (reference?.keys.length > 3 && reference?.keys[1]?.type === 'Submodel'))
            ) {
                // this is the layer under either a SubmodelElementCollection or SubmodelElementList
                promise = new Promise<void>((resolve) => {
                    reference.keys.forEach(async (smeKey: any, index: number) => {
                        if (
                            Array.isArray(reference?.keys) &&
                            ((reference?.keys.length > 2 && reference?.keys[0]?.type === 'Submodel' && index > 1) ||
                                (reference?.keys.length > 3 && reference?.keys[1]?.type === 'Submodel' && index > 2))
                        ) {
                            // check if the type of the SubmodelElement with index - 1 is a SubmodelElementList
                            if (reference.keys[index - 1].type == 'SubmodelElementList') {
                                // check in which position of the list the element is (list needs to be requested to get the position)
                                const smRepoPath = smRepoUrl;
                                const smRepoContext = 'retrieving SML';
                                const disableMessage = false;
                                try {
                                    const smRepoResponse = await this.getRequest(
                                        smRepoPath,
                                        smRepoContext,
                                        disableMessage
                                    );
                                    if (
                                        smRepoResponse?.success &&
                                        smRepoResponse?.data &&
                                        Object.keys(smRepoResponse?.data).length > 0
                                    ) {
                                        const sml = smRepoResponse.data;
                                        const index = sml.value.findIndex((sme: any) =>
                                            this.checkIdShort(sme, smeKey.value, false, true)
                                        );
                                        if (index !== -1) {
                                            smRepoUrl += encodeURIComponent('[') + index + encodeURIComponent(']');
                                        }
                                    }
                                    resolve();
                                } catch {
                                    resolve();
                                }
                            } else if (reference.keys[index - 1].type == 'SubmodelElementCollection') {
                                // check in which position of the list the element is (list needs to be requested to get the position)
                                const smRepoPath = smRepoUrl;
                                const smRepoContext = 'retrieving SMC';
                                const disableMessage = false;
                                try {
                                    const smRepoResponse = await this.getRequest(
                                        smRepoPath,
                                        smRepoContext,
                                        disableMessage
                                    );
                                    if (
                                        smRepoResponse?.success &&
                                        smRepoResponse?.data &&
                                        Object.keys(smRepoResponse?.data).length > 0
                                    ) {
                                        const smc = smRepoResponse.data;
                                        const sme = smc.value.find((sme: any) =>
                                            this.checkIdShort(sme, smeKey.value, false, true)
                                        );
                                        if (sme && Object.keys(sme).length > 0) {
                                            smRepoUrl += '.' + smeKey.value;
                                        }
                                    }
                                    resolve();
                                } catch {
                                    resolve();
                                }
                            } else {
                                smRepoUrl += '.' + smeKey.value;
                            }
                        }
                    });
                    if (
                        reference.keys.every(
                            (SubmodelElement: any, index: number) =>
                                index <= 1 || reference.keys[index - 1].type != 'SubmodelElementList'
                        )
                    ) {
                        resolve(); // Resolve immediately if none of the elements are SubmodelElementList
                    }
                });
            } else {
                promise = Promise.resolve();
            }

            promise
                .then(async () => {
                    // console.log('jumpToSubmodelElement()', 'aasEndPoint', aasEndpoint, 'smRepoUrl', smRepoUrl);
                    // check if mobile device
                    if (this.navigationStore.getIsMobile) {
                        this.router.push({ name: 'SubmodelList', query: { aas: aasEndpoint, path: smRepoUrl } });
                    } else {
                        // set the AAS Endpoint and SubmodelElement path in the aas and path query parameters using the router
                        this.router.push({ query: { aas: aasEndpoint, path: smRepoUrl } });
                    }
                    // dispatch the AAS set by the ReferenceElement to the store
                    await this.fetchAndDispatchAas(aasEndpoint);
                    this.navigationStore.dispatchTriggerAASListScroll();
                    // Request the referenced SubmodelElement
                    const elementPath = smRepoUrl;
                    const context = 'retrieving SubmodelElement';
                    const disableMessage = true;
                    this.getRequest(elementPath, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            const node = response.data;
                            node.timestamp = this.formatDate(new Date()); // add timestamp to the SubmodelElement Data
                            node.path = smRepoUrl; // add the path to the SubmodelElement Data
                            node.isActive = true; // add the isActive Property to the SubmodelElement Data
                            this.aasStore.dispatchNode(node); // set the updatedNode in the AASStore
                            this.aasStore.dispatchInitTreeByReferenceElement(true); // set the initTreeByReferenceElement in the AASStore to true to init + expand the Treeview on the referenced Element
                        } else {
                            // execute if the Request failed
                            if (response?.data && Object.keys(response?.data).length === 0) {
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
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        },

        ////////////////////////////////////////////////// AAS Stuff //////////////////////////////////////////////////

        // Fetch List of all available AAS Descriptors
        async fetchAasDescriptorList(): Promise<Array<any>> {
            // console.log('fetchAasDescriptorList()');

            const failResponse = [] as Array<any>;

            let aasRegistryUrl = this.aasRegistryUrl;
            if (aasRegistryUrl.trim() === '') return failResponse;
            if (!aasRegistryUrl.includes('/shell-descriptors')) {
                aasRegistryUrl += '/shell-descriptors';
            }

            const aasRegistryPath = aasRegistryUrl;
            const aasRegistryContext = 'retrieving all AAS Descriptors';
            const disableMessage = false;
            try {
                const aasRegistryResponse = await this.getRequest(aasRegistryPath, aasRegistryContext, disableMessage);
                if (
                    aasRegistryResponse.success &&
                    aasRegistryResponse.data.result &&
                    aasRegistryResponse.data.result.length > 0
                ) {
                    return aasRegistryResponse.data.result;
                }
            } catch {
                // handle error
                return failResponse;
            }

            return failResponse;
        },

        // Fetch List of all available AAS
        async fetchAasList(): Promise<Array<any>> {
            // console.log('fetchAasList()');

            const failResponse = [] as Array<any>;

            let aasRepoUrl = this.aasRepoUrl;
            if (aasRepoUrl.trim() === '') return failResponse;
            if (!aasRepoUrl.includes('/shells')) {
                aasRepoUrl += '/shells';
            }

            const aasRepoPath = aasRepoUrl;
            const aasRepoContext = 'retrieving all AAS';
            const disableMessage = false;
            try {
                const aasRepoResponse = await this.getRequest(aasRepoPath, aasRepoContext, disableMessage);
                if (aasRepoResponse.success && aasRepoResponse.data.result && aasRepoResponse.data.result.length > 0) {
                    return aasRepoResponse.data.result;
                }
            } catch {
                // handle error
                return failResponse;
            }
            return failResponse;
        },

        // Fetch AAS Descriptor by AAS ID with AAS Registry
        async fetchAasDescriptorById(aasId: string): Promise<any> {
            // console.log('fetchAasDescriptorById()', aasId);

            const failResponse = {} as any;

            let aasRegistryUrl = this.aasRegistryUrl;
            if (aasRegistryUrl.trim() === '') return failResponse;
            if (!aasRegistryUrl.includes('/shell-descriptors')) {
                aasRegistryUrl += '/shell-descriptors';
            }

            const aasRegistryPath = aasRegistryUrl + '/' + this.URLEncode(aasId);
            const aasRegistryContext = 'retrieving AAS Descriptor';
            const disableMessage = false;
            try {
                const aasRegistryResponse = await this.getRequest(aasRegistryPath, aasRegistryContext, disableMessage);
                if (
                    aasRegistryResponse?.success &&
                    aasRegistryResponse?.data &&
                    Object.keys(aasRegistryResponse?.data).length > 0
                ) {
                    return aasRegistryResponse.data;
                }
            } catch {
                // handle error
                return failResponse;
            }
            return failResponse;
        },

        // Fetch AAS from AAS Repo (with the help of the AAS Registry)
        async fetchAasById(aasId: string): Promise<any> {
            // console.log('fetchAasById()', aasId);
            const failResponse = {} as any;

            if (aasId.trim() === '') return failResponse;

            const aasDescriptor = await this.fetchAasDescriptorById(aasId);

            if (aasDescriptor && Object.keys(aasDescriptor).length > 0) {
                const aasEndpoint = this.extractEndpointHref(aasDescriptor, 'AAS-3.0');
                return this.fetchAas(aasEndpoint);
            }

            return failResponse;
        },

        // Fetch AAS from (AAS Repo) Endpoint
        async fetchAas(aasEndpoint: string): Promise<any> {
            // console.log('fetchAas()', aasEndpoint);
            const failResponse = {} as any;

            if (aasEndpoint.trim() === '') return failResponse;

            const aasRepoPath = aasEndpoint;
            const aasRepoContext = 'retrieving AAS Data';
            const disableMessage = true;
            try {
                const aasRepoResponse = await this.getRequest(aasRepoPath, aasRepoContext, disableMessage);
                if (
                    aasRepoResponse?.success &&
                    aasRepoResponse?.data &&
                    Object.keys(aasRepoResponse?.data).length > 0
                ) {
                    const aas = aasRepoResponse.data;
                    // console.log('fetchAas()', aasEndpoint, 'aas', aas);

                    // Add endpoint to AAS
                    aas.endpoints = [{ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' }];

                    return aas;
                }
            } catch {
                return failResponse;
            }

            return failResponse;
        },

        // Fetch and Dispatch AAS from (AAS Repo) Endpoint
        async fetchAndDispatchAas(aasEndpoint: string) {
            // console.log('fetchAndDispatchAas()', aasEndpoint);
            if (aasEndpoint.trim() === '') return;

            const aas = await this.fetchAas(aasEndpoint);
            // console.log('fetchAndDispatchAas()', aasEndpoint, 'aas', aas);

            this.aasStore.dispatchSelectedAAS(aas);
        },

        // Checks weather an AAS is available
        // Checks availability in AAS Repo
        // Checks availability in AAS Registry and AAS Repo if AAS Registry is available
        async aasIsAvailableById(aasId: string): Promise<boolean> {
            // console.log('aasIsAvailableById()', aasId);
            const failResponse = false;

            if (aasId.trim() === '') return failResponse;

            const aasDescriptorList = await this.fetchAasDescriptorList();
            const aasList = await this.fetchAasList();

            if (aasList && Array.isArray(aasList) && aasList.length > 0) {
                // Check availability of AAS in AAS Repo
                const aasFound = aasList.find((aas: any) => {
                    return aas.id == aasId;
                });

                if (aasFound && Object.keys(aasFound).length > 0) {
                    if (aasDescriptorList && Array.isArray(aasDescriptorList) && aasDescriptorList.length > 0) {
                        // Check availability of AAS in AAS Registry
                        const aasDescriptorFound = aasDescriptorList.find((aasDescriptor: any) => {
                            return aasDescriptor.id == aasId;
                        });

                        if (aasDescriptorFound && Object.keys(aasDescriptorFound).length > 0) {
                            return true; // AAS found in AAS Registry and AAS Repo
                        }

                        return failResponse;
                    }
                    return true; // AAS only found in AAS Repo (AAS Registry not available)
                }
            }

            return failResponse;
        },

        // Checks weather AAS is available in AAS Repo
        async aasIsAvailable(aasEndpoint: string): Promise<boolean> {
            // console.log('aasIsAvailable()', aasEndpoint);
            const failResponse = false;

            if (aasEndpoint.trim() === '') return failResponse;

            const aas = await this.fetchAas(aasEndpoint);
            // console.log('aasIsAvailable()', aasEndpoint, 'aas', aas);

            if (aas && Object.keys(aas).length > 0) return true;

            return failResponse;
        },

        // Checks weather referenced AAS is available
        async aasReferenceIsAvailable(aasReference: any): Promise<boolean> {
            // console.log('aasIsAvailable()', aasEndpoint);
            const failResponse = false;

            if (
                !aasReference ||
                Object.keys(aasReference).length === 0 ||
                !aasReference?.keys ||
                !Array.isArray(aasReference?.keys) ||
                aasReference?.keys.length === 0 ||
                !aasReference?.keys[0]?.type ||
                aasReference?.keys[0]?.type !== 'AssetAdministrationShell' ||
                !aasReference?.keys[0]?.value ||
                aasReference?.keys[0]?.value.trim() === ''
            ) {
                return failResponse;
            }

            const aasId = aasReference?.keys[0]?.value.trim();

            return this.aasIsAvailableById(aasId);
        },

        // Jumps to AAS by AAS Descriptor
        async jumpToAasByAasDescriptor(aasDescriptor: any) {
            // console.log('jumpToAasByAasDescriptor()', aasDescriptor);
            const aasEndpoint = this.extractEndpointHref(aasDescriptor, 'AAS-3.0');
            // console.log('jumpToAasByAasDescriptor() --> jumpToAasBy()', aasEndpoint);
            this.jumpToAas(aasEndpoint);
        },

        // Jumps to AAS by AAS ID
        async jumpToAasById(aasId: string) {
            if (!this.aasIsAvailableById(aasId)) return;

            const aas = await this.fetchAasById(aasId);
            const aasEndpoint = this.extractEndpointHref(aas, 'AAS-3.0');

            this.jumpToAas(aasEndpoint);
        },

        // Jumps to AAS by AAS Endpoint
        async jumpToAas(aasEndpoint: string) {
            // console.log('jumpToAasBy()', aasEndpoint);
            if (aasEndpoint.trim() === '') return;

            if (this.navigationStore.getIsMobile) {
                this.router.push({ name: 'SubmodelList', query: { aas: aasEndpoint } });
            } else {
                this.router.push({ query: { aas: aasEndpoint } });
            }
            await this.fetchAndDispatchAas(aasEndpoint);
            this.navigationStore.dispatchTriggerAASListScroll();
        },

        ////////////////////////////////////////////////// SM Stuff //////////////////////////////////////////////////

        // Fetch List of all available SM Descriptors
        async fetchSmDescriptorList(): Promise<Array<any>> {
            // console.log('fetchSmDescriptorList()');

            const failResponse = [] as Array<any>;

            let smRegistryUrl = this.submodelRegistryUrl;
            if (smRegistryUrl.trim() === '') return failResponse;
            if (!smRegistryUrl.includes('/submodel-descriptors')) {
                smRegistryUrl += '/submodel-descriptors';
            }

            const smRegistryPath = smRegistryUrl;
            const smRegistryContext = 'retrieving all SM Descriptors';
            const disableMessage = false;
            try {
                const smRegistryResponse = await this.getRequest(smRegistryPath, smRegistryContext, disableMessage);
                if (
                    smRegistryResponse.success &&
                    smRegistryResponse.data.result &&
                    smRegistryResponse.data.result.length > 0
                ) {
                    return smRegistryResponse.data.result;
                }
            } catch {
                // handle error
                return failResponse;
            }
            return failResponse;
        },

        // Fetch List of all available SM
        async fetchSmList(): Promise<Array<any>> {
            // console.log('fetchAasList()');

            const failResponse = [] as Array<any>;

            let smRepoUrl = this.submodelRepoUrl;
            if (smRepoUrl.trim() === '') return failResponse;
            if (!smRepoUrl.includes('/shells')) {
                smRepoUrl += '/shells';
            }

            const smRepoPath = smRepoUrl;
            const smRepoContext = 'retrieving all SMs';
            const disableMessage = false;
            try {
                const smRepoResponse = await this.getRequest(smRepoPath, smRepoContext, disableMessage);
                if (smRepoResponse.success && smRepoResponse.data.result && smRepoResponse.data.result.length > 0) {
                    return smRepoResponse.data.result;
                }
            } catch {
                // handle error
                return failResponse;
            }
            return failResponse;
        },

        // Fetch SM Descriptor by SM ID with SM Registry
        async fetchSmDescriptorById(smId: string): Promise<any> {
            // console.log('fetchSmDescriptorById()', smId);

            const failResponse = {} as any;

            let smRegistryUrl = this.submodelRegistryUrl;
            if (smRegistryUrl.trim() === '') return failResponse;
            if (!smRegistryUrl.includes('/shell-descriptors')) {
                smRegistryUrl += '/shell-descriptors';
            }

            const smRegistryPath = smRegistryUrl + '/' + this.URLEncode(smId);
            const smRegistryContext = 'retrieving SM Descriptor';
            const disableMessage = false;
            try {
                const smRegistryResponse = await this.getRequest(smRegistryPath, smRegistryContext, disableMessage);
                if (
                    smRegistryResponse?.success &&
                    smRegistryResponse?.data &&
                    Object.keys(smRegistryResponse?.data).length > 0
                ) {
                    return smRegistryResponse.data;
                }
            } catch {
                // handle error
                return failResponse;
            }
            return failResponse;
        },

        // Fetch SM from SM Repo (with the help of the SM Registry)
        async fetchSmById(smId: string): Promise<any> {
            // console.log('fetchAasById()', aasId);
            const failResponse = {} as any;

            if (smId.trim() === '') return failResponse;

            const smDescriptor = await this.fetchSmDescriptorById(smId);

            if (smDescriptor && Object.keys(smDescriptor).length > 0) {
                const smEndpoint = this.extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');
                return this.fetchSm(smEndpoint);
            }

            return failResponse;
        },

        // Fetch SM from (SM Repo) Endpoint
        async fetchSm(smEndpoint: string): Promise<any> {
            // console.log('fetchSm()', aasEndpoint);
            const failResponse = {} as any;

            if (smEndpoint.trim() === '') return failResponse;

            const smRepoPath = smEndpoint;
            const smRepoContext = 'retrieving SM Data';
            const disableMessage = true;
            try {
                const smRepoResponse = await this.getRequest(smRepoPath, smRepoContext, disableMessage);
                if (smRepoResponse?.success && smRepoResponse?.data && Object.keys(smRepoResponse?.data).length > 0) {
                    const sm = smRepoResponse.data;
                    // console.log('fetchSm()', smEndpoint, 'sm', sm);

                    // Add endpoint to AAS
                    sm.endpoints = [{ protocolInformation: { href: smEndpoint }, interface: 'SUBMODEL-3.0' }];

                    return sm;
                }
            } catch {
                return failResponse;
            }

            return failResponse;
        },

        // Checks weather a SM is available
        // Checks availability in SM Repo
        // Checks availability in SM Registry and SM Repo if SM Registry is available
        async smIsAvailableById(smId: string): Promise<boolean> {
            // console.log('smIsAvailableById()', smId);
            const failResponse = false;

            if (smId.trim() === '') return failResponse;

            const smDescriptorList = await this.fetchSmDescriptorList();
            const smList = await this.fetchSmList();

            if (smList && Array.isArray(smList) && smList.length > 0) {
                // Check availability of SM in SM Repo
                const smFound = smList.find((sm: any) => {
                    return sm.id == smId;
                });

                if (smFound && Object.keys(smFound).length > 0) {
                    if (smDescriptorList && Array.isArray(smDescriptorList) && smDescriptorList.length > 0) {
                        // Check availability of SM in SM Registry
                        const smDescriptorFound = smDescriptorList.find((smDescriptor: any) => {
                            return smDescriptor.id == smId;
                        });

                        if (smDescriptorFound && Object.keys(smDescriptorFound).length > 0) {
                            return true; // SM found in SM Registry and SM Repo
                        }

                        return failResponse;
                    }
                    return true; // SM only found in SM Repo (SM Registry not available)
                }
            }

            return failResponse;
        },

        // Checks weather SM is available in SM Repo
        async smIsAvailable(smEndpoint: string): Promise<boolean> {
            // console.log('aasIsAvailable()', smEndpoint);
            const failResponse = false;

            if (smEndpoint.trim() === '') return failResponse;

            const sm = await this.fetchSm(smEndpoint);
            // console.log('smIsAvailable()', smEndpoint, 'sm', sm);

            if (sm && Object.keys(sm).length > 0) return true;

            return failResponse;
        },

        // Checks weather referenced SM is available
        async smReferenceIsAvailable(smReference: any): Promise<boolean> {
            // console.log('aasIsAvailable()', aasEndpoint);
            const failResponse = false;

            if (
                !smReference ||
                Object.keys(smReference).length === 0 ||
                !smReference?.keys ||
                !Array.isArray(smReference?.keys) ||
                smReference?.keys.length === 0 ||
                !smReference?.keys[0]?.type
            ) {
                return failResponse;
            }

            if (
                smReference?.keys[0]?.type === 'AssetAdministrationShell' &&
                (!smReference?.keys[1]?.type ||
                    smReference?.keys[1]?.type !== 'Submodel' ||
                    !smReference?.keys[1]?.value ||
                    smReference?.keys[1]?.value.trim() === '')
            ) {
                return failResponse; //
            }

            if (
                smReference?.keys[0]?.type === 'Submodel' &&
                (!smReference?.keys[0]?.value || smReference?.keys[0]?.value.trim() === '')
            ) {
                return failResponse; //
            }

            let smId = '';
            if (
                smReference?.keys[0]?.type === 'AssetAdministrationShell' &&
                smReference?.keys[1]?.type !== 'Submodel'
            ) {
                smId = smReference?.keys[1]?.value;
            } else if (smReference?.keys[0]?.type === 'Submodel') {
                smId = smReference?.keys[0]?.value;
            }

            if (smId.trim() !== '') {
                return this.smIsAvailableById(smId);
            }
            return failResponse;
        },

        ////////////////////////////////////////////////// OTHER STUFF //////////////////////////////////////////////////

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
            if (!this.conceptDescriptionRepoUrl || this.conceptDescriptionRepoUrl === '') {
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
                if (
                    semanticId.startsWith('0173-1#') ||
                    semanticId.startsWith('0173/1///') ||
                    semanticId.startsWith('https://api.eclass-cdp.com/0173-1')
                ) {
                    semanticIdsToFetch.push(...this.getEquivalentEclassSemanticIds(semanticId));
                } else if (semanticId.startsWith('http://') || semanticId.startsWith('https://')) {
                    semanticIdsToFetch.push(...this.getEquivalentIriSemanticIds(semanticId));
                }
            });

            const semanticIdsUniqueToFetch = semanticIdsToFetch.filter(
                (value: string, index: number, self: string) => self.indexOf(value) === index
            );

            const cdPromises = semanticIdsUniqueToFetch.map((semanticId: string) => {
                const path = this.conceptDescriptionRepoUrl + '/' + this.URLEncode(semanticId);
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
        async calculateSubmodelElementPaths(parent: any, startPath: string): Promise<any> {
            parent.path = startPath;
            parent.id = this.UUID();
            parent.conceptDescriptions = await this.getConceptDescriptions(parent);

            if (parent.submodelElements && parent.submodelElements.length > 0) {
                for (const element of parent.submodelElements) {
                    await this.calculateSubmodelElementPaths(
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
                    await this.calculateSubmodelElementPaths(element, startPath + '.' + element.idShort);
                }
            } else if (
                parent.value &&
                Array.isArray(parent.value) &&
                parent.value.length > 0 &&
                parent.modelType == 'SubmodelElementList'
            ) {
                for (const [index, element] of parent.value.entries()) {
                    await this.calculateSubmodelElementPaths(
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
                    await this.calculateSubmodelElementPaths(element, startPath + '.' + element.idShort);
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
        // NOTE copied to ReferableUtils
        nameToDisplay(referable: any, language = 'en', defaultNameToDisplay = '') {
            if (referable && referable?.displayName) {
                const displayNameEn = referable.displayName.find((displayName: any) => {
                    return displayName.language === language && displayName.text !== '';
                });
                if (displayNameEn && displayNameEn.text) return displayNameEn.text;
            }
            return !defaultNameToDisplay && referable?.idShort ? referable.idShort : defaultNameToDisplay;
        },

        // NOTE copied to ReferableUtils
        descriptionToDisplay(referable: any, language = 'en', defaultNameToDisplay = '') {
            if (referable && referable?.description) {
                const descriptionEn = referable.description.find(
                    (description: any) => description && description.language === language && description.text !== ''
                );
                if (descriptionEn && descriptionEn.text) return descriptionEn.text;
            }
            return defaultNameToDisplay;
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
