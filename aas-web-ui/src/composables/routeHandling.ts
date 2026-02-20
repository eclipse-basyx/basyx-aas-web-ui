import type { LocationQuery, RouteLocationNormalizedGeneric, RouteLocationRaw } from 'vue-router';
import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useSMHandling } from '@/composables/AAS/SMHandling';
import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
import { base64Decode } from '@/utils/EncodeDecodeUtils';

export function useRouteHandling() {
    // Composables
    const { getAasId } = useAASDiscoveryClient();
    const { getAasEndpointById } = useAASHandling();
    const { getSmEndpointById } = useSMHandling();

    /**
     * Handles the redirection of `globalAssetId`, `aasId` and `smId` query parameter from the given route location.
     *
     * @async
     * @function idRedirectHandled
     * @param {RouteLocationNormalizedGeneric} to - The target route to navigate to, which contains query parameters.
     * @param {string[]} possibleIdQueryParameter - The possible query parameter names for the `globalAssetId`.
     * @param {string[]} possibleGloBalAssetIdQueryParameter - The possible query parameter names for the `globalAssetId`.
     * @param {string[]} possibleAasIdQueryParameter - The possible query parameter names for the `aasId`.
     * @param {string[]} possibleSmIdQueryParameter - The possible query parameter names for the `smId`.
     * @returns {Promise<RouteLocationRaw | null>} Returns a redirect location if a redirection is needed, otherwise null.
     */
    async function idRedirectHandled(
        to: RouteLocationNormalizedGeneric,
        possibleIdQueryParameter: string[],
        possibleGloBalAssetIdQueryParameter: string[],
        possibleAasIdQueryParameter: string[],
        possibleSmIdQueryParameter: string[]
    ): Promise<RouteLocationRaw | null> {
        // Note: Query parameter are handled case sensitive!
        if (possibleIdQueryParameter.some((queryParamater) => Object.hasOwn(to.query, queryParamater))) {
            const globalAssetRedirect = await globalAssetIdRedirectHandled(to, possibleGloBalAssetIdQueryParameter);
            if (globalAssetRedirect) return globalAssetRedirect;

            const aasOrSmRedirect = await aasIdSmIdRedirectHandled(
                to,
                possibleAasIdQueryParameter,
                possibleSmIdQueryParameter
            );
            if (aasOrSmRedirect) return aasOrSmRedirect;
        }
        return null;
    }

    /**
     * Handles the redirection of `globalAssetId` query parameter from the given route location.
     * It resolves the `globalAssetId` to an `aasId` and finally to an `aasEndpoint`, and updates the route query.
     *
     * @async
     * @function globalAssetIdRedirectHandled
     * @param {RouteLocationNormalizedGeneric} to - The target route to navigate to, which contains query parameters.
     * @param {string[]} possibleGloBalAssetIdQueryParameter - The possible query parameter names for the `globalAssetId`.
     * @returns {Promise<RouteLocationRaw | null>} Returns a redirect location if a redirection is needed, otherwise null.
     */
    async function globalAssetIdRedirectHandled(
        to: RouteLocationNormalizedGeneric,
        possibleGloBalAssetIdQueryParameter: string[]
    ): Promise<RouteLocationRaw | null> {
        if (possibleGloBalAssetIdQueryParameter.some((queryParamater) => Object.hasOwn(to.query, queryParamater))) {
            const globalAssetIdBase64Encoded = to.query[possibleGloBalAssetIdQueryParameter[0]]
                ? (to.query[possibleGloBalAssetIdQueryParameter[0]] as string)
                : (to.query[possibleGloBalAssetIdQueryParameter[1]] as string);
            const globalAssetId = base64Decode(globalAssetIdBase64Encoded);
            const aasId = await getAasId(globalAssetId);
            const aasEndpoint = await getAasEndpointById(aasId);
            const query = {} as LocationQuery;

            if (aasEndpoint.trim() !== '') {
                query.aas = aasEndpoint.trim();
                return { path: to.path, query };
            }
        }
        return null;
    }

    /**
     * Handles the redirection of `aasId` and `smId` query parameter from the given route location.
     * It resolves the `aasId`to an `aasEndpoint`, the `smId`to an `smEndpoint` and updates the route query.
     *
     * @async
     * @function aasIdSmIdRedirectHandled
     * @param {RouteLocationNormalizedGeneric} to - The target route to navigate to, which contains query parameters.
     * @param {string[]} possibleAasIdQueryParameter - The possible query parameter names for the `aasId`.
     * @param {string[]} possibleSmIdQueryParameter - The possible query parameter names for the `smId`.
     * @returns {Promise<RouteLocationRaw | null>} Returns a redirect location if a redirection is needed, otherwise null.
     */
    async function aasIdSmIdRedirectHandled(
        to: RouteLocationNormalizedGeneric,
        possibleAasIdQueryParameter: string[],
        possibleSmIdQueryParameter: string[]
    ): Promise<RouteLocationRaw | null> {
        if (
            possibleAasIdQueryParameter.some((queryParamater) => Object.hasOwn(to.query, queryParamater)) ||
            possibleSmIdQueryParameter.some((queryParamater) => Object.hasOwn(to.query, queryParamater))
        ) {
            let aasEndpoint = '';
            let smEndpoint = '';

            if (to.query.aasId) {
                const aasIdBase64Encoded = to.query[possibleAasIdQueryParameter[0]]
                    ? (to.query[possibleAasIdQueryParameter[0]] as string)
                    : (to.query[possibleAasIdQueryParameter[1]] as string);
                const aasId = base64Decode(aasIdBase64Encoded);
                aasEndpoint = await getAasEndpointById(aasId);
            }
            if (to.query.smId) {
                const smIdBase64Encoded = to.query[possibleSmIdQueryParameter[0]]
                    ? (to.query[possibleSmIdQueryParameter[0]] as string)
                    : (to.query[possibleSmIdQueryParameter[1]] as string);
                const smId = base64Decode(smIdBase64Encoded);
                smEndpoint = await getSmEndpointById(smId);
            }

            aasEndpoint = aasEndpoint.trim();
            smEndpoint = smEndpoint.trim();

            if (aasEndpoint !== '' || smEndpoint !== '') {
                const query = {} as LocationQuery;

                if (aasEndpoint !== '') query.aas = aasEndpoint.trim();
                if (smEndpoint !== '') query.path = smEndpoint.trim();

                return { path: to.path, query };
            }
        }
        return null;
    }

    return { idRedirectHandled };
}
