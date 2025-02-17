import { computed } from 'vue';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { keyTypes } from '@/utils/AAS/KeyTypesUtil';

export function useReferenceUtils() {
    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Composables
    const { isAvailableById: aasIsAvailableById, getAasEndpointById: getAasEndpointByIdFromRepo } =
        useAASRepositoryClient();
    const {
        isAvailableById: smIsAvailableById,
        fetchSme,
        getSmEndpointById: getSmEndpointByIdFromRepo,
    } = useSMRepositoryClient();
    const { checkIdShort } = useReferableUtils();

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
                    return (await aasIsAvailableById(aasId)) && (await smIsAvailableById(smId));
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
                    if (submodelIds.includes(smId)) return true;

                    // Second check: (General) Availability of submodel
                    return await smIsAvailableById(smId);
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
            let referenceKeys = reference.keys;

            if (Array.isArray(referenceKeys) && referenceKeys.length > 0) {
                let aasEndpoint = '';
                let smEndpoint = '';
                let smePath = '';

                if (reference?.keys[0]?.type === 'AssetAdministrationShell') {
                    const aasId = reference?.keys[0].value.trim();
                    aasEndpoint = getAasEndpointByIdFromRepo(aasId);
                    if (reference?.keys[1]?.type === 'Submodel') {
                        const smId = reference?.keys[1].value.trim();
                        smEndpoint = getSmEndpointByIdFromRepo(smId);
                        referenceKeys = referenceKeys.slice(1);
                    }
                    referenceKeys = referenceKeys.slice(1);
                }

                if (reference?.keys[0]?.type === 'Submodel') {
                    // TODO determine aasEndpoint
                    const smId = reference?.keys[0].value.trim();
                    smEndpoint = getSmEndpointByIdFromRepo(smId);
                    referenceKeys = referenceKeys.slice(1);
                }

                if (smEndpoint && smEndpoint.trim() !== '') {
                    smePath = smEndpoint + '/submodel-elements/';

                    referenceKeys.forEach(async (key: any, index: number) => {
                        if (index > 0 && referenceKeys[index - 1].type == 'SubmodelElementList') {
                            const sml = await fetchSme(smePath);
                            const index = sml.value.findIndex((sme: any) => checkIdShort(sme, key.value, false, true));

                            if (index !== -1) {
                                smePath += encodeURIComponent('[') + index + encodeURIComponent(']');
                            }
                        } else if (index > 0 && referenceKeys[index - 1].type == 'SubmodelElementCollection') {
                            if (!smePath.endsWith('/submodel-elements/')) smePath += '.';
                            smePath += key.value;
                        } else {
                            if (!smePath.endsWith('/submodel-elements/')) smePath += '.';
                            smePath += key.value;
                        }
                    });
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

    /**
     * Extracts the ID (Key) from a Reference object based on the given Key Type name.
     *
     * @param {Object} reference - The Reference object containing ID/Key information.
     * @param {string} keyType - The Key Type name.
     * @returns {string} The ID (Key) of the matching Key Type name if found, otherwise an empty string.
     */
    function extractId(reference: any, keyType: string): string {
        const failResponse = '';

        if (!reference.keys || !Array.isArray(reference.keys) || reference.keys.length === 0 || keyType.trim() === '') {
            return '';
        }

        keyType = keyType.trim();

        if (!keyTypes.some((keyTypeOfKeyTypes: any) => keyTypeOfKeyTypes.name === keyType)) {
            return failResponse;
        }

        const keys = reference.keys;
        // find the key based on the key type name
        const key = keys.find((key: any) => {
            return key?.type === keyType;
        });

        return key?.value && key.value.trim() !== '' ? key.value.trim() : failResponse;
    }

    return { referenceTypes, checkReference, getEndpoints, extractId };
}
