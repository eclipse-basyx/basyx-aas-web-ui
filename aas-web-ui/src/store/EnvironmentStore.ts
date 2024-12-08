import { defineStore } from 'pinia';

export const useEnvStore = defineStore({
    id: 'envStore',
    state: () => ({
        logoLightPath: '',
        logoDarkPath: '',
        basePath: '',
        aasDiscoveryPath: '',
        aasRegistryPath: '',
        submodelRegistryPath: '',
        aasRepoPath: '',
        submodelRepoPath: '',
        conceptDescriptionRepoPath: '',
        dashboardServicePath: '',
        primaryLightColor: '',
        primaryDarkColor: '',
        influxdbToken: '',
        keycloakUrl: '',
        keycloakRealm: '',
        keycloakClientId: '',
        endpointConfigAvailable: true,
        singleAasRedirect: '',
    }),
    getters: {
        getEnvLogoLightPath: (state) => state.logoLightPath,
        getEnvLogoDarkPath: (state) => state.logoDarkPath,
        getEnvBasePath: (state) => state.basePath,
        getEnvAASDiscoveryPath: (state) => state.aasDiscoveryPath,
        getEnvAASRegistryPath: (state) => state.aasRegistryPath,
        getEnvSubmodelRegistryPath: (state) => state.submodelRegistryPath,
        getEnvAASRepoPath: (state) => state.aasRepoPath,
        getEnvSubmodelRepoPath: (state) => state.submodelRepoPath,
        getEnvConceptDescriptionRepoPath: (state) => state.conceptDescriptionRepoPath,
        getEnvDashboardServicePath: (state) => state.dashboardServicePath,
        getEnvPrimaryLightColor: (state) => state.primaryLightColor,
        getEnvPrimaryDarkColor: (state) => state.primaryDarkColor,
        getEnvInfluxdbToken: (state) => state.influxdbToken,
        getKeycloakUrl: (state) => state.keycloakUrl,
        getKeycloakRealm: (state) => state.keycloakRealm,
        getKeycloakClientId: (state) => state.keycloakClientId,
        getEndpointConfigAvailable: (state) => state.endpointConfigAvailable,
        getSingleAasRedirect: (state) => state.singleAasRedirect,
    },
    actions: {
        async fetchConfig() {
            try {
                const configResponse = await fetch('config.json');
                const config = await configResponse.json();
                this.logoLightPath = config.logoLightPath;
                this.logoDarkPath = config.logoDarkPath;
                this.basePath = config.basePath;
                this.aasDiscoveryPath = config.aasDiscoveryPath;
                this.aasRegistryPath = config.aasRegistryPath;
                this.submodelRegistryPath = config.submodelRegistryPath;
                this.aasRepoPath = config.aasRepoPath;
                this.submodelRepoPath = config.submodelRepoPath;
                this.conceptDescriptionRepoPath = config.cdRepoPath;
                this.dashboardServicePath = config.dashboardServicePath;
                this.primaryLightColor = config.primaryLightColor;
                this.primaryDarkColor = config.primaryDarkColor;
                this.influxdbToken = config.influxdbToken;
                this.keycloakUrl = config.keycloakUrl;
                this.keycloakRealm = config.keycloakRealm;
                this.keycloakClientId = config.keycloakClientId;
                this.endpointConfigAvailable =
                    config.endpointConfigAvailable === true || config.endpointConfigAvailable === 'true' ? true : false;
                if (config.singleAasRedirect) {
                    // https://gist.github.com/dperini/729294
                    const expression =
                        /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
                    const regex = new RegExp(expression);
                    if (config.singleAasRedirect.match(regex)) {
                        // If valid URL
                        this.singleAasRedirect = config.singleAasRedirect;
                    } else {
                        this.singleAasRedirect = '';
                    }
                }
            } catch (error) {
                console.error('Error fetching config.json: ', error);
            }
        },
    },
});
