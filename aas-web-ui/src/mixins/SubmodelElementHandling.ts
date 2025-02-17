import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
import { useJumpHandling } from '@/composables/JumpHandling';
import RequestHandling from '@/mixins/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { formatDate } from '@/utils/DateUtils';

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

    methods: {},
});
