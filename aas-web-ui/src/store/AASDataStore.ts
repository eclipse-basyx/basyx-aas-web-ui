import { defineStore } from 'pinia';

export const useAASStore = defineStore({
    id: 'aasStore',
    state: () => ({
        aasObject: {} as any, // holds the AAS object for the currently selected AAS
        loadingState: false, // loading state of the AAS Treeview Component
        selectedNode: {} as any, // holds the currently selected Node in the AAS Treeview Component
        initTreeByReferenceElement: false, // holds the state if the AAS Treeview Component should be initialized because the Jump-Button was clicked on a ReferenceElement
    }),
    getters: {
        getSelectedAAS: (state) => state.aasObject,
        getLoadingState: (state) => state.loadingState,
        getSelectedNode: (state) => state.selectedNode,
        getInitTreeByReferenceElement: (state) => state.initTreeByReferenceElement,
    },
    actions: {
        dispatchSelectedAAS(aasData: object) {
            this.aasObject = aasData;
            this.selectedNode = {}; // Clear node
        },
        dispatchLoadingState(loadingState: boolean) {
            this.loadingState = loadingState;
        },
        dispatchSelectedNode(node: any) {
            this.selectedNode = node;
        },
        dispatchInitTreeByReferenceElement(initTreeByReferenceElement: boolean) {
            this.initTreeByReferenceElement = initTreeByReferenceElement;
        },
    },
});
