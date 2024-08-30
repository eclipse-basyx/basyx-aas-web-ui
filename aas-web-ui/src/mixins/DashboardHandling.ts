import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';

import { useAASStore } from '@/store/AASDataStore';
import { useEnvStore } from '@/store/EnvironmentStore';

import RequestHandling from '@/mixins/RequestHandling';
import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

export default defineComponent({
    name: 'DashboardHandling',
    mixins: [RequestHandling, SubmodelElementHandling],

    setup() {
        const aasStore = useAASStore();
        const envStore = useEnvStore();
        const route = useRoute();

        return {
            aasStore, // AASStore Object
            envStore, // EnvironmentStore Object
            route, // Route Object
        };
    },

    computed: {
        // Get the selected Treeview Node (SubmodelElement) from the store
        SelectedNode() {
            return this.aasStore.getSelectedNode;
        },

        // check if plugin is in dashboard
        hideSettings() {
            if (this.route.name === 'DashboardGroup') {
                return true;
            } else {
                return false;
            }
        },

        // get selected AAS from Store
        SelectedAAS() {
            return this.aasStore.getSelectedAAS;
        },

        // get the dashboard api path from the environment store
        dashboardServicePath() {
            return this.envStore.getEnvDashboardServicePath;
        },
    },

    methods: {
        async dashboardAdd(item: any) {
            // console.log(item)
            let group = await this.getAAS();
            // console.log(group);
            let dashboardObj = {
                title: item.title,
                endpoint: this.SelectedNode.path,
                group: {
                    groupName: group.idShort,
                    groupId: group.id,
                },
                configObject: {
                    semanticId: this.SelectedNode.semanticId.keys[0].value,
                    chartType: item.chartType,
                    chartOptions: item.chartOptions,
                    timeVal: item.timeValue,
                    yvals: item.yValues,
                    segment: item.segment,
                    apiToken: item.apiToken,
                },
                visibility: true,
            };
            // console.log('Add Element to Dasboard: ', dashboardObj);
            // construct the request
            let path = this.dashboardServicePath + '/addElement';
            let headers: Headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('accept', '*/*');
            let content = JSON.stringify(dashboardObj);
            let context = 'adding element to dashboard';
            let disableMessage = false;
            // send the request
            this.postRequest(path, content, headers, context, disableMessage).then((response: any) => {
                if (response.success) {
                    // console.log('Successfully added Element to Dashboard: ', response.data);
                }
            });
        },

        async getGroups() {
            let path = this.dashboardServicePath + '/groups/summary';
            let context = 'fetching all groups';
            let disableMessage = false;
            const response: any = await this.getRequest(path, context, disableMessage);
            if (response.success) {
                // console.log(response.data)
                return response.data;
            }
        },

        async getElements(group: any) {
            let pathGroup = this.URLEncode(group);
            let path = this.dashboardServicePath + '/findGroup/' + pathGroup;
            let context = 'fetching all elements of a group';
            let disableMessage = false;
            const response: any = await this.getRequest(path, context, disableMessage);
            if (response.success) {
                // console.log(response);
                return response.data;
            }
        },

        async deleteGroup(groups: any, groupId: any): Promise<any[]> {
            // console.log(groups)
            let pathGroup = this.URLEncode(groupId);
            let path = this.dashboardServicePath + '/deleteGroup/' + pathGroup;
            let context = 'deleting all elements of a group';
            let disableMessage = false;
            const response: any = await this.deleteRequest(path, context, disableMessage);
            if (response.success) {
                // console.log(response);
                const index = groups.findIndex((element: any) => element.groupId === groupId);
                // console.log(index)
                groups = groups.filter((item: any) => item !== groups[index]);
                // console.log(groups)
                return groups;
            }
            return groups;
        },

        async deleteSingle(elementId: any): Promise<string | undefined> {
            let path = this.dashboardServicePath + '/deleteElement/' + elementId;
            let context = 'deleting one element of a group';
            let disableMessage = false;
            const response: any = await this.deleteRequest(path, context, disableMessage);
            if (response.success) {
                return elementId;
            }
            return undefined;
        },

        async updateElement(element: any): Promise<any | undefined> {
            // console.log(element)
            let path = this.dashboardServicePath + '/updateElement/' + element.id;
            let headers: Headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('accept', '*/*');
            let content = JSON.stringify(element);
            let context = 'adding element to dashboard';
            let disableMessage = false;
            // send the request
            const response: any = await this.putRequest(path, content, headers, context, disableMessage);
            if (response.success) {
                return response.data;
            }
            return undefined;
        },

        async getAAS(): Promise<any> {
            if ((this.SelectedAAS.idShort && this.SelectedAAS.id) != null) {
                // console.log(this.SelectedAAS)
                return this.SelectedAAS;
            } else {
                let path = this.SelectedAAS.endpoints[0].protocolInformation.href;
                let context = 'getting aas from endpoint';
                let disableMessage = false;
                let response = await this.getRequest(path, context, disableMessage);
                if (response && response.success) {
                    return response.data;
                }
                return { idShort: 'new Group', id: this.UUID() };
            }
        },
    },
});
