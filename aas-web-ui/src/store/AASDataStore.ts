import { defineStore } from 'pinia';

export const useAASStore = defineStore({
    id: 'aasStore',
    state: () => ({
        aasObject: {} as any, // holds the AAS object for the currently selected AAS
        loadingState: false, // loading state of the AAS Treeview Component
        updatedNode: {} as any, // holds the most recently updated Node in the AAS Treeview Component
        selectedNode: {} as any, // holds the currently selected Node in the AAS Treeview Component
        realTimeObject: {} as any, // holds the newest synced SubmodelElement (for the ComponentViasualization)
        initTreeByReferenceElement: false, // holds the state if the AAS Treeview Component should be initialized because the Jump-Button was clicked on a ReferenceElement
    }),
    getters: {
        getSelectedAAS: (state) => state.aasObject,
        getLoadingState: (state) => state.loadingState,
        getUpdatedNode: (state) => state.updatedNode,
        getSelectedNode: (state) => state.selectedNode,
        getRealTimeObject: (state) => state.realTimeObject,
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
        dispatchNode(node: any) {
            this.updatedNode = node;
            if (!node.isActive) {
                this.selectedNode = {};
            } else {
                this.selectedNode = node;
            }
        },
        dispatchSelectedNode(node: any) {
            this.selectedNode = node;
        },
        dispatchRealTimeObject(realTimeObject: any) {
            this.realTimeObject = realTimeObject;
        },
        dispatchInitTreeByReferenceElement(initTreeByReferenceElement: boolean) {
            this.initTreeByReferenceElement = initTreeByReferenceElement;
        },
    },
});
