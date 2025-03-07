import { defineStore } from 'pinia';

export const useAASStore = defineStore('aasStore', () => {
    // States
    const aasObject = ref({} as any); // holds the AAS object for the currently selected AAS
    const selectedNode = ref({} as any); // holds the currently selected Node in the SubmodelTree/List Component
    const initTreeByReferenceElement = ref(false); // holds the state if the SubmodelTree Component should be initialized (e.g. cause of clicking Jump-Button of a ReferenceElement)

    // Getters
    const getSelectedAAS = computed(() => aasObject.value);
    const getSelectedNode = computed(() => selectedNode.value);
    const getInitTreeByReferenceElement = computed(() => initTreeByReferenceElement.value);

    // Actions
    function dispatchSelectedAAS(aasValue: any): void {
        if (
            aasObject.value &&
            Object.keys(aasObject.value).length > 0 &&
            aasObject.value?.id &&
            aasValue &&
            Object.keys(aasValue).length > 0 &&
            aasValue?.id
        ) {
            // If existing AAS is replaced by another one, clear selectedNode
            if (aasObject.value?.id !== aasValue?.id) selectedNode.value = {};
        }

        if (!aasValue || Object.keys(aasValue).length === 0) {
            // If empty AAS is dispatched, clear selectedNode
            selectedNode.value = {};
        }

        // If the same AAS is dispatched, nothing happened with the selectedNode

        aasObject.value = aasValue;
    }

    function dispatchSelectedNode(selectedNodeValue: any): void {
        selectedNode.value = selectedNodeValue;
    }

    function dispatchInitTreeByReferenceElement(initTreeByReferenceElementValue: boolean): void {
        initTreeByReferenceElement.value = initTreeByReferenceElementValue;
    }

    return {
        // Getters
        getSelectedAAS,
        getSelectedNode,
        getInitTreeByReferenceElement,

        // Actions
        dispatchSelectedAAS,
        dispatchSelectedNode,
        dispatchInitTreeByReferenceElement,
    };
});
