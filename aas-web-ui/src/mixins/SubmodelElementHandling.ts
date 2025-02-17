import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
import { useJumpHandling } from '@/composables/JumpHandling';
import RequestHandling from '@/mixins/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { getEquivalentEclassSemanticIds, getEquivalentIriSemanticIds } from '@/utils/AAS/SemanticIdUtils';
import { formatDate } from '@/utils/DateUtils';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

export default defineComponent({
    name: 'SubmodelElementHandling',
    mixins: [RequestHandling],

    setup() {
        const aasStore = useAASStore();
        const navigationStore = useNavigationStore();
        const router = useRouter();
        const { checkIdShort } = useReferableUtils();
        const { jumpToAasByAasDescriptor } = useJumpHandling();

        return {
            aasStore, // AASStore Object
            navigationStore, // NavigationStore Object
            router, // Router Object
            checkIdShort,
            jumpToAasByAasDescriptor,
            formatDate,
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
        // Get all ConceptDescriptions for the SubmodelElement from the ConceptDescription Repository
        // TODO Replace usage of this function with ConceptDescriptionHandling.ts/fetchCds()
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
                    semanticIdsToFetch.push(...getEquivalentEclassSemanticIds(semanticId));
                } else if (semanticId.startsWith('http://') || semanticId.startsWith('https://')) {
                    semanticIdsToFetch.push(...getEquivalentIriSemanticIds(semanticId));
                }
            });

            const semanticIdsUniqueToFetch = semanticIdsToFetch.filter(
                (value: string, index: number, self: string) => self.indexOf(value) === index
            );

            const cdPromises = semanticIdsUniqueToFetch.map((semanticId: string) => {
                const path = this.conceptDescriptionRepoUrl + '/' + base64Encode(semanticId);
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

        // Function to calculate the local path (used for files)
        // TODO Transfer to Util resp. Composable
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
    },
});
