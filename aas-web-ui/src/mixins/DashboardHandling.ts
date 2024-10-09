import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import RequestHandling from '@/mixins/RequestHandling';
import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useEnvStore } from '@/store/EnvironmentStore';

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
            const group = await this.getAAS();
            // console.log(group);
            const dashboardObj = {
                title: item.title,
                endpoint: this.SelectedNode.path,
                group: {
                    groupName: group.idShort,
                    groupId: group.id,
                },
                configObject: {
                    semanticId: this.SelectedNode.semanticId,
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
            const path = this.dashboardServicePath + '/addElement';
            const headers: Headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('accept', '*/*');
            const content = JSON.stringify(dashboardObj);
            const context = 'adding element to dashboard';
            const disableMessage = false;
            // send the request
            this.postRequest(path, content, headers, context, disableMessage).then((response: any) => {
                if (response.success) {
                    // console.log('Successfully added Element to Dashboard: ', response.data);
                }
            });
        },

        async getGroups() {
            const path = this.dashboardServicePath + '/groups/summary';
            const context = 'fetching all groups';
            const disableMessage = false;
            const response: any = await this.getRequest(path, context, disableMessage);
            if (response.success) {
                // console.log(response.data)
                return response.data;
            }
        },

        async getElements(group: any) {
            const pathGroup = this.URLEncode(group);
            const path = this.dashboardServicePath + '/findGroup/' + pathGroup;
            const context = 'fetching all elements of a group';
            const disableMessage = false;
            const response: any = await this.getRequest(path, context, disableMessage);
            if (response.success) {
                // console.log(response);
                return response.data;
            }
        },

        async deleteGroup(groups: any, groupId: any): Promise<any[]> {
            // console.log(groups)
            const pathGroup = this.URLEncode(groupId);
            const path = this.dashboardServicePath + '/deleteGroup/' + pathGroup;
            const context = 'deleting all elements of a group';
            const disableMessage = false;
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
            const path = this.dashboardServicePath + '/deleteElement/' + elementId;
            const context = 'deleting one element of a group';
            const disableMessage = false;
            const response: any = await this.deleteRequest(path, context, disableMessage);
            if (response.success) {
                return elementId;
            }
            return undefined;
        },

        async updateElement(element: any): Promise<any | undefined> {
            // console.log(element)
            const path = this.dashboardServicePath + '/updateElement/' + element.id;
            const headers: Headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('accept', '*/*');
            const content = JSON.stringify(element);
            const context = 'adding element to dashboard';
            const disableMessage = false;
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
                const path = this.SelectedAAS.endpoints[0].protocolInformation.href;
                const context = 'getting aas from endpoint';
                const disableMessage = false;
                const response = await this.getRequest(path, context, disableMessage);
                if (response && response.success) {
                    return response.data;
                }
                return { idShort: 'new Group', id: this.UUID() };
            }
        },
    },
});
