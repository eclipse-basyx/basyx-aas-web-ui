<template>
    <v-container fluid class="pt-4 pb-5 px-3">
        <v-card>
            <v-row align="center">
                <v-col cols="auto">
                    <!-- Back Button -->
                    <v-btn class="ml-3" variant="plain" icon="mdi-chevron-left" to="/dashboard"></v-btn>
                </v-col>
                <v-col class="pl-0">
                    <!-- Dashboard Name -->
                    <v-card-title class="pl-0">{{ dashboardName }}</v-card-title>
                </v-col>
                <v-col cols="auto">
                    <!-- Sync Toggle -->
                    <v-btn icon variant="plain" @click="changeSync()">
                        <span :class="syncStatus ? 'custom-loader' : ''">
                            <v-icon light>mdi-cached</v-icon>
                        </span>
                    </v-btn>
                </v-col>
                <v-col cols="auto" class="mr-3">
                    <!-- Visibility Toggle -->
                    <v-switch v-model="show" hide-details label="Show Hidden"></v-switch>
                </v-col>
            </v-row>
        </v-card>
        <v-row justify="start" class="mt-2 px-1">
            <v-col
                v-for="dashboardElement in filteredElements"
                :key="dashboardElement.id"
                class="pa-2"
                cols="12"
                xs="12"
                sm="12"
                md="6"
                lg="6"
                xl="4"
                xxl="3">
                <!-- Single Dashboard Element -->
                <DashboardElement
                    :dashboard-data="dashboardElement"
                    :global-sync-status="syncStatus"
                    @delete-element="updateGroup"
                    @update-element="updateElementVisibility"></DashboardElement>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import DashboardHandling from '@/mixins/DashboardHandling';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import DashboardElement from './DashboardElement.vue';

    export default defineComponent({
        name: 'Dashboard',
        components: {
            DashboardElement,
        },
        mixins: [DashboardHandling],

        setup() {
            const envStore = useEnvStore();
            const route = useRoute();
            const router = useRouter();

            return {
                envStore, // EnvironmentStore Object
                route, // Route Object
                router, // Router Object
            };
        },

        data() {
            return {
                elements: [] as any,
                show: false,
                syncStatus: false,
            };
        },

        computed: {
            filteredElements() {
                if (!this.show) {
                    // console.log(this.elements)
                    const filteredArray = this.elements.filter((item: any) => item.visibility === true);
                    // console.log(filteredArray)
                    return filteredArray;
                } else {
                    // console.log(data)
                    return this.elements;
                }
            },

            dashboardName() {
                let name = 'Dashboard'; // default name
                if (this.elements[0]?.group?.groupName) {
                    name = this.elements[0].group.groupName;
                }
                return name;
            },
        },

        async mounted() {
            // get the group from the query
            // console.log('Dashboard mounted for group with id: ', this.route.query.group);
            // TODO: fetch the group based on the query
            this.show = false;
            let groupElements = await this.getElements(this.route.query.group);
            this.elements = groupElements.slice().sort((a: any, b: any) => a.order - b.order);
            // console.log(this.elements)
        },

        methods: {
            updateGroup(elementId: any) {
                const index = this.elements.findIndex((element: any) => element.id === elementId);
                // console.log(index)
                this.elements = this.elements.filter((item: any) => item !== this.elements[index]);
                // check if the element was the last element in the group
                if (this.elements.length === 0) {
                    // console.log('Group is empty')
                    // navigate back to the dashboard
                    this.router.push({ name: 'Dashboard' });
                }
            },

            updateElementVisibility(data: any) {
                const index = this.elements.findIndex((element: any) => element.id === data.id);
                this.elements[index] = data;
            },

            changeSync() {
                this.syncStatus = !this.syncStatus;
            },
        },
    });
</script>
