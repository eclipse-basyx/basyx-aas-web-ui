<template>
    <v-app>
        <!-- App Navigation and it's sub-Components (AASList, etc.) -->
        <AppNavigation />
        <v-main style="padding-top: 33px">
            <!-- App Content (eg. MainWindow, etc.) -->
            <router-view v-slot="{ Component }">
                <keep-alive :include="['AASList', 'SubmodelList']">
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </v-main>
    </v-app>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import AppNavigation from '@/components/AppNavigation/AppNavigation.vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    interface AASType {
        endpoints: Array<{
            protocolInformation: {
                href: string;
            };
        }>;
    }

    export default defineComponent({
        name: 'App',
        components: {
            RequestHandling, // Mixin to handle the requests to the AAS
            SubmodelElementHandling, // Mixin to handle the SubmodelElements

            AppNavigation,
        },
        mixins: [RequestHandling, SubmodelElementHandling],

        setup() {
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();
            const route = useRoute();
            const router = useRouter();

            return {
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
                route, // Route Object
                router, // Router Object
            };
        },

        mounted() {
            let mobile = this.$vuetify.display.mobile;
            // include IPad as mobile device
            if (this.$vuetify.display.platform.mac && this.$vuetify.display.platform.touch) {
                mobile = true;
            }
            if (this.$vuetify.display.platform.ios) {
                mobile = true;
            }
            if (this.$vuetify.display.platform.android) {
                mobile = true;
            }
            // console.log('Mobile: ', mobile);
            this.navigationStore.dispatchIsMobile(mobile);
            this.navigationStore.dispatchPlatform(this.$vuetify.display.platform);

            // check if the aas and path Queries are set in the URL and include them in the URL when switching to the mobile view
            const searchParams = new URL(window.location.href).searchParams;
            const aasEndpoint = searchParams.get('aas');
            const submodelElementPath = searchParams.get('path');

            // check which platform is used and change the fitting view
            if (mobile) {
                if (this.route.name === 'MainWindow') {
                    if (aasEndpoint && submodelElementPath) {
                        this.router.push({ name: 'AASList', query: { aas: aasEndpoint, path: submodelElementPath } });
                    } else if (aasEndpoint && !submodelElementPath) {
                        this.router.push({ name: 'AASList', query: { aas: aasEndpoint } });
                    } else {
                        this.router.push({ name: 'AASList' });
                    }
                } else if (this.route.name === 'ComponentVisualization') {
                    if (!aasEndpoint && !submodelElementPath) {
                        this.router.push({ name: 'AASList' });
                    } else if (aasEndpoint && !submodelElementPath) {
                        this.router.push({ name: 'SubmodelList', query: { aas: aasEndpoint } });
                    }
                }
            } else {
                // change to MainWindow when the platform is not android or ios
                if (this.route.name === 'AASList' || this.route.name === 'SubmodelList') {
                    if (aasEndpoint && submodelElementPath)
                        this.router.push({
                            name: 'MainWindow',
                            query: { aas: aasEndpoint, path: submodelElementPath },
                        });
                    else if (aasEndpoint && !submodelElementPath)
                        this.router.push({ name: 'MainWindow', query: { aas: aasEndpoint } });
                    else this.router.push({ name: 'MainWindow' });
                } else if (this.route.name === 'ComponentVisualization') {
                    if (aasEndpoint && !submodelElementPath)
                        this.router.push({ name: 'MainWindow', query: { aas: aasEndpoint } });
                    else if (!aasEndpoint && !submodelElementPath) this.router.push({ name: 'MainWindow' });
                } else {
                    if (aasEndpoint && submodelElementPath)
                        this.router.push({ query: { aas: aasEndpoint, path: submodelElementPath } });
                    else if (aasEndpoint && !submodelElementPath) this.router.push({ query: { aas: aasEndpoint } });
                }
            }

            if (aasEndpoint) {
                // console.log('AAS Query is set: ', aasEndpoint);
                let aas = {} as AASType;
                let endpoints = [];
                endpoints.push({ protocolInformation: { href: aasEndpoint } });
                aas.endpoints = endpoints;
                // dispatch the AAS set by the URL to the store
                this.aasStore.dispatchSelectedAAS(aas);
            }

            if (aasEndpoint && submodelElementPath) {
                // console.log('AAS and Path Queries are set: ', submodelElementPath);
                // Request the selected SubmodelElement
                let path = submodelElementPath;
                let context = 'retrieving SubmodelElement';
                let disableMessage = true;
                this.getRequest(path, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // execute if the Request was successful
                        response.data.timestamp = this.formatDate(new Date()); // add timestamp to the SubmodelElement Data
                        response.data.path = submodelElementPath; // add the path to the SubmodelElement Data
                        response.data.isActive = true; // add the isActive Property to the SubmodelElement Data
                        // console.log('SubmodelElement Data: ', response.data)
                        // dispatch the SubmodelElementPath set by the URL to the store
                        this.aasStore.dispatchNode(response.data); // set the updatedNode in the AASStore
                    } else {
                        // execute if the Request failed
                        if (Object.keys(response.data).length == 0) {
                            // don't copy the static SubmodelElement Data if no Node is selected or Node is invalid
                            this.navigationStore.dispatchSnackbar({
                                status: true,
                                timeout: 60000,
                                color: 'error',
                                btnColor: 'buttonText',
                                text: 'No valid SubmodelElement under the given Path',
                            }); // Show Error Snackbar
                            return;
                        }
                        this.aasStore.dispatchNode({});
                    }
                });
            }
        },
    });
</script>

<style>
    @import '../node_modules/@fontsource/roboto/index.css';

    html {
        overflow-y: auto;
    }
</style>
