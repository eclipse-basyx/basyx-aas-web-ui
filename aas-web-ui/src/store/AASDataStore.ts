import { defineStore } from 'pinia';

export const useAASStore = defineStore('aasStore', () => {
    // State Variables
    const selectedAas = ref({} as any); // holds the AAS object for the currently selected AAS
    const loadingState = ref(false); // loading state of the AAS Treeview Component
    const selectedNode = ref({} as any); // holds the currently selected Node in the AAS Treeview Component
    const initTreeByReferenceElement = ref(false); // holds the state if the AAS Treeview Component should be initialized because the Jump-Button was clicked on a ReferenceElement

    // Getters
    const getSelectedAAS = computed(() => selectedAas.value);
    const getLoadingState = computed(() => loadingState.value);
    const getSelectedNode = computed(() => selectedNode.value);
    const getInitTreeByReferenceElement = computed(() => initTreeByReferenceElement.value);

    // Actions
    function dispatchSelectedAAS(aasData: any): void {
        if (
            selectedAas.value &&
            Object.keys(selectedAas.value).length > 0 &&
            selectedAas.value?.id &&
            aasData &&
            Object.keys(aasData).length > 0 &&
            aasData?.id
        ) {
            // if existing AAS is replaced by another one, clear selectedNode
            if (selectedAas.value?.id !== aasData?.id) selectedNode.value = {};
        }

        if (!aasData || Object.keys(aasData).length === 0) {
            // empty AAS is dispatched, clear selectedNode
            selectedNode.value = {};
        }

        // If the same AAS is dispatch, nothing happened with the selectedNode

        selectedAas.value = aasData;
    }

    function dispatchLoadingState(loadingStateValue: boolean): void {
        loadingState.value = loadingStateValue;
    }

    function dispatchSelectedNode(node: any): void {
        selectedNode.value = node;
    }

    function dispatchInitTreeByReferenceElement(initTreeByReferenceElementState: boolean): void {
        initTreeByReferenceElement.value = initTreeByReferenceElementState;
    }

    return {
        // Getters
        getSelectedAAS,
        getLoadingState,
        getSelectedNode,
        getInitTreeByReferenceElement,

        // Actions
        dispatchSelectedAAS,
        dispatchLoadingState,
        dispatchSelectedNode,
        dispatchInitTreeByReferenceElement,
    };
});
