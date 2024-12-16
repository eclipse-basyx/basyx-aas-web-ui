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
        aasDiscoveryURLMixin() {
            return this.navigationStore.getAASDiscoveryURL;
        },

        // get AAS Registry URL from Store
        aasRegistryURLMixin() {
            return this.navigationStore.getAASRegistryURL;
        },

        // Get the Submodel Repository URL from the Store
        submodelRepoURL() {
            return this.navigationStore.getSubmodelRepoURL;
        },

        // Get the Concept Description Repository URL from the Store
        conceptDescriptionRepoURL() {
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

            if (new RegExp(/\/\d{1,}\/\d{1,}$/).test(semanticId)) {
                // IRI with version like https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9/
                return this.getEquivalentIriSemanticIds(semanticId).includes(keyValue);
            }

            // IRI without version like https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/
            return (
                this.getEquivalentIriSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                    return equivalentSemanticId.startsWith(semanticId);
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
            referenceValue: Array<any>
        ): Promise<{ success: boolean; aas?: object; submodel?: object }> {
            // console.log('Reference Value: ', referenceValue);
            // check if aasRegistryURL includes "/shell-descriptors" and add id if not (backward compatibility)
            if (!this.aasRegistryURLMixin.includes('/shell-descriptors')) {
                this.aasRegistryURLMixin += '/shell-descriptors';
            }
            const path = this.aasRegistryURLMixin;
            const context = 'retrieving AAS Data';
            const disableMessage = false;
            try {
                const response = await this.getRequest(path, context, disableMessage);
                // console.log('Response: ', response);
                if (response.success && response.data.result && response.data.result.length > 0) {
                    const aasList = response.data.result;
                    if (referenceValue[0].type == 'AssetAdministrationShell') {
                        return await this.checkReferenceAAS(aasList, referenceValue);
                    }
                    if (referenceValue[0].type == 'Submodel') {
                        return await this.checkReferenceSubmodel(aasList, referenceValue);
                    }
                }
                return { success: false, aas: {}, submodel: {} };
            } catch {
                // handle error
                return { success: false, aas: {}, submodel: {} };
            }
        },

        // Function to check if the referenced AAS exists
        async checkReferenceAAS(
            aasList: Array<any>,
            referenceValue: Array<any>
        ): Promise<{ success: boolean; aas?: object; submodel?: object }> {
            try {
                aasList.forEach((aas: any) => {
                    if (aas.id == referenceValue[0].value) {
                        // console.log('AAS found. AAS: ', { success: true, aas: aas, submodel: {} });
                        throw { success: true, aas: aas, submodel: {} };
                    }
                });
            } catch (result: any) {
                if (result.success) {
                    return result;
                } else {
                    throw result; // re-throw if it's an actual error
                }
            }
            return { success: false, aas: {}, submodel: {} };
        },

        // Function to check if the referenced Submodel (+ SubmodelElement) exists
        async checkReferenceSubmodel(
            aasList: Array<any>,
            referenceValue: Array<any>
        ): Promise<{ success: boolean; aas?: object; submodel?: object }> {
            const promises = aasList.map(async (aas: any) => {
                const shellHref = this.extractEndpointHref(aas, 'AAS-3.0');
                const path = shellHref + '/submodel-refs';
                const context = 'retrieving Submodel References';
                const disableMessage = false;

                const response = await this.getRequest(path, context, disableMessage);
                if (response.success) {
                    const submodelList = response.data.result;
                    const foundSubmodel = submodelList.find(
                        (submodel: any) => submodel.keys[0].value == referenceValue[0].value
                    );
                    if (foundSubmodel) {
                        return { success: true, aas: aas, submodel: foundSubmodel };
                    }
                }
                return null; // null signifies that this particular iteration didn't find what it was looking for
            });

            const results = await Promise.all(promises);
            const foundResult = results.find((result) => result !== null);

            if (foundResult) {
                return foundResult; // One of the iterations was successful
            } else {
                return { success: false, aas: {}, submodel: {} }; // None of the iterations were successful
            }
        },

        // Function to jump to a referenced Element
        jumpToReferencedElement(referencedAAS: any, referenceValue: Array<any>, referencedSubmodel?: any) {
            // console.log('jumpToReferencedElement. AAS: ', referencedAAS, 'Submodel: ', referencedSubmodel);
            const shellHref = this.extractEndpointHref(referencedAAS, 'AAS-3.0');
            const endpoint = shellHref;
            if (referencedSubmodel && Object.keys(referencedSubmodel).length > 0) {
                // if the referenced Element is a Submodel or SubmodelElement
                this.jumpToSubmodelElement(referencedSubmodel, referenceValue, referencedAAS, endpoint);
            } else {
                // if the referenced Element is an AAS
                this.jumpToAAS(referencedAAS, endpoint);
            }
        },

        jumpToSubmodelElement(
            referencedSubmodel: any,
            referenceValue: Array<any>,
            referencedAAS: any,
            endpoint: string
        ) {
            let path =
                this.submodelRepoURL + '/' + this.URLEncode(referencedSubmodel.keys[0].value).replace(/%3D/g, '');
            if (referenceValue.length > 1) {
                // this is the layer directly under the Submodel
                path += '/submodel-elements/' + referenceValue[1].value;
            }
            let promise; // Promise to wait for the SubmodelElementList to be requested (if it exists)
            if (referenceValue.length > 2) {
                // this is the layer under either a SubmodelElementCollection or SubmodelElementList
                promise = new Promise<void>((resolve, reject) => {
                    referenceValue.forEach((SubmodelElement: any, index: number) => {
                        if (index > 1) {
                            // check if the type of the SubmodelElement with index - 1 is a SubmodelElementList
                            if (referenceValue[index - 1].type == 'SubmodelElementList') {
                                // console.log('SubmodelElementList: ', this.referenceValue[index - 1])
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
                        referenceValue.every(
                            (SubmodelElement: any, index: number) =>
                                index <= 1 || referenceValue[index - 1].type != 'SubmodelElementList'
                        )
                    ) {
                        resolve(); // Resolve immediately if none of the elements are SubmodelElementList
                    }
                });
            } else {
                promise = Promise.resolve();
            }

            promise
                .then(() => {
                    // check if mobile device
                    if (this.navigationStore.getIsMobile) {
                        this.router.push({ name: 'SubmodelList', query: { aas: endpoint, path: path } });
                    } else {
                        // set the AAS Endpoint and SubmodelElement path in the aas and path query parameters using the router
                        this.router.push({ query: { aas: endpoint, path: path } });
                    }
                    // dispatch the AAS set by the ReferenceElement to the store
                    this.aasStore.dispatchSelectedAAS(referencedAAS);
                    this.navigationStore.dispatchTriggerAASSelected();
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
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        },

        jumpToAAS(aas: any, endpoint: string) {
            // check if mobile device
            if (this.navigationStore.getIsMobile) {
                this.router.push({ name: 'SubmodelList', query: { aas: endpoint } });
            } else {
                // set the AAS Endpoint in the aas query parameter using the router
                this.router.push({ query: { aas: endpoint } });
            }
            // dispatch the AAS set by the ReferenceElement to the store
            // console.log('AAS:', aas, 'Endpoint:', endpoint);
            this.aasStore.dispatchSelectedAAS(aas);
            this.navigationStore.dispatchTriggerAASSelected();
            this.navigationStore.dispatchTriggerAASListScroll();
            this.aasStore.dispatchNode({});
        },

        // Function to check if the assetId can be found in the AAS Discovery Service (and if it exists in the AAS Registry)
        async checkAssetId(assetId: string): Promise<{ success: boolean; aas?: object; submodel?: object }> {
            const failResponse = { success: false, aas: {}, submodel: {} }; // Define once for reuse
            // check if aasDiscoveryURL includes "/lookup/shells" and add id if not (backward compatibility)
            if (!this.aasDiscoveryURLMixin.includes('/lookup/shells')) {
                this.aasDiscoveryURLMixin += '/lookup/shells';
            }
            // construct the assetId Object
            const assetIdObject = JSON.stringify({ name: 'globalAssetId', value: assetId });
            const path = `${this.aasDiscoveryURLMixin}?assetIds=${this.URLEncode(assetIdObject)}`; // Use template literal and encodeURIComponent
            const context = 'retrieving AASID by AssetID';
            const disableMessage = true;
            try {
                const discoveryResponse = await this.getRequest(path, context, disableMessage);
                // console.log('Discovery Response:', discoveryResponse);
                if (discoveryResponse.success && discoveryResponse.data.result?.length > 0) {
                    const aasIds = discoveryResponse.data.result;
                    // take the first aasId from the list and check if it exists in the AAS Registry
                    const aasId = aasIds[0];
                    // console.log('AAS ID:', aasId);
                    // check if aasRegistryURL includes "/shell-descriptors" and add id if not (backward compatibility)
                    if (!this.aasRegistryURLMixin.includes('/shell-descriptors')) {
                        this.aasRegistryURLMixin += '/shell-descriptors';
                    }
                    const registryPath = `${this.aasRegistryURLMixin}/${this.URLEncode(aasId)}`;
                    const registryContext = 'retrieving AAS Data';
                    try {
                        const aasRegistryResponse = await this.getRequest(
                            registryPath,
                            registryContext,
                            disableMessage
                        );
                        if (aasRegistryResponse.success) {
                            const aas = aasRegistryResponse.data;
                            // console.log('AAS:', aas);
                            return { success: true, aas: aas, submodel: {} };
                        }
                        return failResponse;
                    } catch {
                        return failResponse;
                    }
                }
                return failResponse;
            } catch {
                return failResponse;
            }
        },

        // Get all ConceptDescriptions for the SubmodelElement from the ConceptDescription Repository
        async getConceptDescriptions(SelectedNode: any) {
            let conceptDescriptionRepoURL = '';
            if (this.conceptDescriptionRepoURL && this.conceptDescriptionRepoURL != '') {
                conceptDescriptionRepoURL = this.conceptDescriptionRepoURL;
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
                const path = conceptDescriptionRepoURL + '/' + this.URLEncode(semanticId);
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
            const authorizationError = messages.some((message: any) => message.code === "403" || message.code === "401");

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
