import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { getEquivalentEclassSemanticIds, getEquivalentIriSemanticIds } from '@/utils/SemanticIdUtils';

export function useConceptDescriptionHandling() {
    const { getRequest } = useRequestHandling();

    const navigationStore = useNavigationStore();

    const CDRepoURL = computed(() => {
        return navigationStore.getConceptDescriptionRepoURL;
    });

    // Get the Unit from the EmbeddedDataSpecification of the ConceptDescription of the Property (if available)
    function unitSuffix(prop: any) {
        if (!prop.conceptDescriptions) {
            getConceptDescriptions(prop).then((conceptDescriptions) => {
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
    }

    // Get all ConceptDescriptions for the SubmodelElement from the ConceptDescription Repository
    async function getConceptDescriptions(SelectedNode: any) {
        let conceptDescriptionRepoURL = '';
        if (CDRepoURL.value && CDRepoURL.value != '') {
            conceptDescriptionRepoURL = CDRepoURL.value;
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
                semanticIdsToFetch.push(...getEquivalentEclassSemanticIds(semanticId));
            } else if (semanticId.startsWith('http://') || semanticId.startsWith('https://')) {
                semanticIdsToFetch.push(...getEquivalentIriSemanticIds(semanticId));
            }
        });

        const semanticIdsUniqueToFetch = semanticIdsToFetch.filter(
            (value: string, index: number, self: string) => self.indexOf(value) === index
        );

        const cdPromises = semanticIdsUniqueToFetch.map((semanticId: string) => {
            const path = conceptDescriptionRepoURL + '/' + base64Encode(semanticId);
            const context = 'retrieving ConceptDescriptions';
            const disableMessage = true;

            return getRequest(path, context, disableMessage).then((response: any) => {
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
    }

    // Get the Definition from the EmbeddedDataSpecification of the ConceptDescription of the Property (if available)
    function cdDefinition(prop: any) {
        if (!prop.conceptDescriptions) {
            getConceptDescriptions(prop).then((conceptDescriptions) => {
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
    }

    return {
        unitSuffix,
        getConceptDescriptions,
        cdDefinition,
    };
}
