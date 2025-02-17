import { defineStore } from 'pinia';

export const useAASStore = defineStore({
    id: 'aasStore',
    state: () => ({
        aasObject: {} as any, // holds the AAS object for the currently selected AAS
        selectedNode: {} as any, // holds the currently selected Node in the SubmodelTree/List Component
        initTreeByReferenceElement: false, // holds the state if the SubmodelTree Component should be initialized (e.g. cause of clicking Jump-Button of a ReferenceElement)
    }),
    getters: {
        getSelectedAAS: (state) => state.aasObject,
        getSelectedNode: (state) => state.selectedNode,
        getInitTreeByReferenceElement: (state) => state.initTreeByReferenceElement,
    },
    actions: {
        dispatchSelectedAAS(aasData: any) {
            if (
                this.aasObject &&
                Object.keys(this.aasObject).length > 0 &&
                this.aasObject?.id &&
                aasData &&
                Object.keys(aasData).length > 0 &&
                aasData?.id
            ) {
                // If existing AAS is replaced by another one, clear selectedNode
                if (this.aasObject?.id !== aasData?.id) this.selectedNode = {};
            }

            if (!aasData || Object.keys(aasData).length === 0) {
                // If empty AAS is dispatched, clear selectedNode
                this.selectedNode = {};
            }

            // If the same AAS is dispatched, nothing happened with the selectedNode

            this.aasObject = aasData;
        },
        dispatchSelectedNode(node: any) {
            this.selectedNode = node;
        },
        dispatchInitTreeByReferenceElement(initTreeByReferenceElement: boolean) {
            this.initTreeByReferenceElement = initTreeByReferenceElement;
        },
    },
});
