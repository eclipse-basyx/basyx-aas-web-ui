import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAASStore = defineStore('aasStore', () => {
    //state
    const aasObject = ref({} as any); // holds the AAS object for the currently selected AAS
    const loadingState = ref(false); // loading state of the AAS Treeview Component
    const updatedNode = ref({} as any); // holds the most recently updated Node in the AAS Treeview Component
    const selectedNode = ref({} as any); // holds the currently selected Node in the AAS Treeview Component
    const realTimeObject = ref({} as any); // holds the newest synced SubmodelElement (for the ComponentViasualization)
    const initTreeByReferenceElement = ref(false); // holds the state if the AAS Treeview Component should be initialized because the Jump-Button was clicked on a ReferenceElement

    // getters
    const getSelectedAAS = computed(() => aasObject.value);
    const getLoadingState = computed(() => loadingState.value);
    const getUpdatedNode = computed(() => updatedNode.value);
    const getSelectedNode = computed(() => selectedNode.value);
    const getRealTimeObject = computed(() => realTimeObject.value);
    const getInitTreeByReferenceElement = computed(() => initTreeByReferenceElement.value);

    // actions
    function dispatchSelectedAAS(aasData: object): void {
        aasObject.value = aasData;
        selectedNode.value = {}; // Clear node
    }

    function dispatchLoadingState(state: boolean): void {
        loadingState.value = state;
    }

    function dispatchNode(node: any): void {
        updatedNode.value = node;
        if (!node.isActive) {
            selectedNode.value = {};
        } else {
            selectedNode.value = node;
        }
    }

    function dispatchSelectedNode(node: any): void {
        selectedNode.value = node;
    }

    function dispatchRealTimeObject(node: any): void {
        realTimeObject.value = node;
    }

    function dispatchInitTreeByReferenceElement(initTree: boolean): void {
        initTreeByReferenceElement.value = initTree;
    }

    return {
        getSelectedAAS,
        getLoadingState,
        getUpdatedNode,
        getSelectedNode,
        getRealTimeObject,
        getInitTreeByReferenceElement,
        dispatchSelectedAAS,
        dispatchLoadingState,
        dispatchNode,
        dispatchSelectedNode,
        dispatchRealTimeObject,
        dispatchInitTreeByReferenceElement,
    };
});
