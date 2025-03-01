import { computed } from 'vue';
import { useIDUtils } from '@/composables/IDUtils';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useEnvStore } from '@/store/EnvironmentStore';
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

export function useDashboardHandling() {
    const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling();

    // Composables
    const { generateUUID } = useIDUtils();

    const aasStore = useAASStore();

    const SelectedNode = computed(() => {
        return aasStore.getSelectedNode;
    });

    const SelectedAAS = computed(() => {
        return aasStore.getSelectedAAS;
    });

    const dashboardServicePath = computed(() => {
        return useEnvStore().getEnvDashboardServicePath;
    });

    async function checkDashboardAvailability(): Promise<boolean> {
        if (!dashboardServicePath.value || dashboardServicePath.value === '') return false;

        const path = dashboardServicePath.value.replace('/api/elements', '/test');
        const context = 'checking if dashboard is available';
        const disableMessage = true;

        try {
            const response = await getRequest(path, context, disableMessage);
            if (response.success) return true;
            return false;
        } catch (e) {
            console.warn(e);
            return false;
        }
    }

    async function dashboardAdd(item: any) {
        // console.log(item)
        const group = await getAAS();
        // console.log(group);
        const dashboardObj = {
            title: item.title,
            endpoint: SelectedNode.value.path,
            group: {
                groupName: group.idShort,
                groupId: group.id,
            },
            configObject: {
                semanticId: SelectedNode.value.semanticId,
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
        const path = dashboardServicePath.value + '/addElement';
        const headers: Headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('accept', '*/*');
        const content = JSON.stringify(dashboardObj);
        const context = 'adding element to dashboard';
        const disableMessage = false;
        // send the request
        postRequest(path, content, headers, context, disableMessage).then((response: any) => {
            if (response.success) {
                // console.log('Successfully added Element to Dashboard: ', response.data);
            }
        });
    }

    async function getGroups() {
        const path = dashboardServicePath.value + '/groups/summary';
        const context = 'fetching all groups';
        const disableMessage = false;
        const response: any = await getRequest(path, context, disableMessage);
        if (response.success) {
            // console.log(response.data)
            return response.data;
        }
    }

    async function getElements(group: any) {
        const pathGroup = base64Encode(group);
        const path = dashboardServicePath.value + '/findGroup/' + pathGroup;
        const context = 'fetching all elements of a group';
        const disableMessage = false;
        const response: any = await getRequest(path, context, disableMessage);
        if (response.success) {
            // console.log(response);
            return response.data;
        }
    }

    async function deleteGroup(groups: any, groupId: any): Promise<any[]> {
        // console.log(groups)
        const pathGroup = base64Encode(groupId);
        const path = dashboardServicePath.value + '/deleteGroup/' + pathGroup;
        const context = 'deleting all elements of a group';
        const disableMessage = false;
        const response: any = await deleteRequest(path, context, disableMessage);
        if (response.success) {
            // console.log(response);
            const index = groups.findIndex((element: any) => element.groupId === groupId);
            // console.log(index)
            groups = groups.filter((item: any) => item !== groups[index]);
            // console.log(groups)
            return groups;
        }
        return groups;
    }

    async function deleteSingle(elementId: any): Promise<string | undefined> {
        const path = dashboardServicePath.value + '/deleteElement/' + elementId;
        const context = 'deleting one element of a group';
        const disableMessage = false;
        const response: any = await deleteRequest(path, context, disableMessage);
        if (response.success) {
            return elementId;
        }
        return undefined;
    }

    async function updateElement(element: any): Promise<any | undefined> {
        // console.log(element)
        const path = dashboardServicePath.value + '/updateElement/' + element.id;
        const headers: Headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('accept', '*/*');
        const content = JSON.stringify(element);
        const context = 'adding element to dashboard';
        const disableMessage = false;
        // send the request
        const response: any = await putRequest(path, content, headers, context, disableMessage);
        if (response.success) {
            return response.data;
        }
        return undefined;
    }

    async function getAAS(): Promise<any> {
        if ((SelectedAAS.value.idShort && SelectedAAS.value.id) != null) {
            // console.log(this.SelectedAAS)
            return SelectedAAS.value;
        } else {
            const shellHref = extractEndpointHref(SelectedAAS.value, 'AAS-3.0');
            const path = shellHref;
            const context = 'getting aas from endpoint';
            const disableMessage = false;
            const response = await getRequest(path, context, disableMessage);
            if (response && response.success) {
                return response.data;
            }
            return { idShort: 'new Group', id: generateUUID() };
        }
    }

    return {
        checkDashboardAvailability,
        dashboardAdd,
        getGroups,
        getElements,
        deleteGroup,
        deleteSingle,
        updateElement,
        getAAS,
    };
}
