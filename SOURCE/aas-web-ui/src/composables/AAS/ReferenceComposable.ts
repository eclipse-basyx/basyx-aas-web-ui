import { computed } from 'vue';
import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useSMEHandling } from '@/composables/AAS/SMEHandling';
import { useSMHandling } from '@/composables/AAS/SMHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractId } from '@/utils/AAS/ReferenceUtil';

export function useReferenceComposable() {
    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Composables
    const { aasIsAvailableById, getAasEndpointById } = useAASHandling();
    const { smIsAvailableById, getSmEndpointById } = useSMHandling();
    const { fetchSme } = useSMEHandling();

    // Computed Properties
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store

    /**
     * @constant {Array<Object>} referenceTypes
     * @description Enumeration of Reference Types as specified in IDTA 01001-3-0-1, page 81.
     */
    const referenceTypes = ['ExternalReference', 'ModelReference'];

    /**
     * Checks if the referenced key/id exists based on the provided reference object.
     *
     * This function currently supports checking for references of type 'ModelReference'
     * and 'Submodel', but does not implement functionality for 'ExternalReference'.
     *
     * For 'ModelReference':
     * - If the reference contains an Asset Administration Shell (AAS) and a Submodel,
     *   it checks the availability of both.
     * - If only an AAS is provided, it checks the availability of the AAS.
     * - If only a Submodel is provided, it checks the availability of the Submodel.
     *
     * For 'ExternalReference':
     * - A warning is dispatched indicating that reference checking for ExternalReference
     *   is not implemented.
     *
     * Note: This check just works down to SM level. It is not working for checking
     * the availability of a specific Submodel Element (SME)!
     *
     * @param {any} reference - The reference object to check. It must conform to a structure
     * that includes a 'type' and 'keys' array.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether
     * the referenced element exists or not.
     */
    async function checkReference(reference: any): Promise<boolean> {
        const failResponse = false;

        if (!referenceTypes.includes(reference.type)) return failResponse;

        if (reference.type === 'ModelReference') {
            if (reference?.keys[0]?.type === 'AssetAdministrationShell') {
                const aasId = reference?.keys[0].value.trim();
                let smId = '';

                if (reference?.keys[1]?.type === 'Submodel') {
                    smId = reference?.keys[1]?.value.trim();
                }

                if (aasId && aasId.trim() !== '' && smId && smId.trim() !== '') {
                    const isReferenceAvailable = (await aasIsAvailableById(aasId)) && (await smIsAvailableById(smId));

                    if (!isReferenceAvailable) return failResponse;

                    if (Array.isArray(reference.keys) && reference.keys.length > 2) {
                        const { smePath } = await getEndpoints(reference);

                        if (!smePath || smePath.trim() === '') return failResponse;

                        const sme = await fetchSme(smePath);

                        return !!sme && Object.keys(sme).length > 0;
                    }

                    return isReferenceAvailable;
                } else if (aasId && aasId.trim() !== '') {
                    return await aasIsAvailableById(aasId);
                }

                return failResponse;
            } else if (reference?.keys[0]?.type === 'Submodel') {
                const smId = reference?.keys[0].value.trim();

                if (smId && smId.trim() !== '') {
                    // First check: Availability of submodel in selected AAS
                    const submodelRefs = selectedAAS.value.submodels;
                    const submodelIds = submodelRefs.map((submodelRef: any) => {
                        return extractId(submodelRef, 'Submodel');
                    });
                    const isSubmodelInSelectedAAS = submodelIds.includes(smId);

                    if (isSubmodelInSelectedAAS) {
                        if (Array.isArray(reference.keys) && reference.keys.length > 1) {
                            const { smePath } = await getEndpoints(reference);

                            if (!smePath || smePath.trim() === '') return failResponse;

                            const sme = await fetchSme(smePath);

                            return !!sme && Object.keys(sme).length > 0;
                        }

                        return true;
                    }

                    // Second check: (General) Availability of submodel
                    const isSubmodelAvailable = await smIsAvailableById(smId);

                    if (!isSubmodelAvailable) return failResponse;

                    if (Array.isArray(reference.keys) && reference.keys.length > 1) {
                        const { smePath } = await getEndpoints(reference);

                        if (!smePath || smePath.trim() === '') return failResponse;

                        const sme = await fetchSme(smePath);

                        return !!sme && Object.keys(sme).length > 0;
                    }

                    return isSubmodelAvailable;
                }

                return failResponse;
            } else if (reference?.keys[0]?.type === 'ConceptDescription') {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 10000,
                    color: 'warning',
                    btnColor: 'buttonText',
                    text: 'Reference check for ConceptDescription is not implemented',
                });
                return failResponse;
            }
        } else if (reference.type === 'ExternalReference') {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 10000,
                color: 'warning',
                btnColor: 'buttonText',
                text: 'Reference check for ExternalReference is not implemented',
            });
            return failResponse;
        } else {
            return failResponse;
        }
        return failResponse;
    }

    /**
     * Retrieves the AAS endpoint and SME path based on the provided reference.
     *
     * @async
     * @param {any} reference - The reference object containing type and keys. The reference must have a type of 'ModelReference' or 'ExternalReference'.
     * @returns {Promise<{ aasEndpoint: string, smePath: string }>} A promise that resolves to an object containing:
     *          - `aasEndpoint`: The AAS endpoint URL corresponding to the reference.
     *          - `smePath`: The path to the submodel elements or an empty string if not found.
     */
    async function getEndpoints(reference: any): Promise<{ aasEndpoint: string; smEndpoint: string; smePath: string }> {
        const failResponse = { aasEndpoint: '', smEndpoint: '', smePath: '' };

        if (!referenceTypes.includes(reference.type)) return failResponse;

        if (reference.type === 'ModelReference') {
            let referenceKeys = [...reference.keys];

            if (Array.isArray(referenceKeys) && referenceKeys.length > 0) {
                let aasEndpoint = '';
                let smEndpoint = '';
                let smePath = '';

                if (referenceKeys[0]?.type === 'AssetAdministrationShell') {
                    const aasId = referenceKeys[0].value.trim();
                    aasEndpoint = await getAasEndpointById(aasId);
                    referenceKeys = referenceKeys.slice(1);
                }

                if (referenceKeys[0]?.type === 'Submodel') {
                    const smId = referenceKeys[0].value.trim();

                    if (smId.trim() !== '') {
                        smEndpoint = await getSmEndpointById(smId);
                    }

                    referenceKeys = referenceKeys.slice(1);
                }

                if (smEndpoint && smEndpoint.trim() !== '' && referenceKeys.length > 0) {
                    smePath = smEndpoint + '/submodel-elements/';

                    for (let i = 0; i < referenceKeys.length; i++) {
                        const currentKey = referenceKeys[i];
                        const previousKey = i > 0 ? referenceKeys[i - 1] : null;

                        if (previousKey?.type === 'SubmodelElementList') {
                            const listIndex = Number.parseInt(String(currentKey.value), 10);

                            if (!Number.isInteger(listIndex) || String(listIndex) !== String(currentKey.value).trim()) {
                                return failResponse;
                            }

                            const sml = await fetchSme(smePath);
                            const listElements = sml?.value;

                            if (!Array.isArray(listElements) || listIndex < 0 || listIndex >= listElements.length) {
                                return failResponse;
                            }

                            smePath += encodeURIComponent('[') + listIndex + encodeURIComponent(']');
                        } else {
                            if (!smePath.endsWith('/submodel-elements/')) smePath += '.';
                            smePath += currentKey.value;
                        }
                    }
                }

                return { aasEndpoint: aasEndpoint, smEndpoint: smEndpoint, smePath: smePath };
            }
        } else if (reference.type === 'ExternalReference') {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 10000,
                color: 'warning',
                btnColor: 'buttonText',
                text: 'Endpoint determination for ExternalReference is not implemented',
            });
            return failResponse;
        } else {
            return failResponse;
        }
        return failResponse;
    }

    return { referenceTypes, checkReference, getEndpoints };
}
