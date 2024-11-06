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
            } catch (error) {
                console.error('Error fetching config.json: ', error);
            }
        },
    },
});
