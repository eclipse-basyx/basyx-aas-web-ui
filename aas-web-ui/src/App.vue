<template>
    <v-app>
        <!-- App Navigation and it's sub-Components (AASList, etc.) -->
        <AppNavigation />
        <v-main style="padding-top: 33px">
            <!-- App Content (eg. AASViewer, AASEditor, etc.) -->
            <router-view v-slot="{ Component }">
                <keep-alive :include="['AASList', 'AASTreeview', 'SubmodelList']">
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
    import { onMounted } from 'vue';
    import { useDisplay } from 'vuetify';
    import { useNavigationStore } from './store/NavigationStore';

    // Stores
    const navigationStore = useNavigationStore();

    // Vuetify
    const { mobile } = useDisplay();
    const { platform } = useDisplay();

    onMounted(async () => {
        // Check if the platform is a mobile device
        let showMobileVersion = false;
        if (
            mobile.value ||
            // include IPad as mobile device
            (platform.value.mac && platform.value.touch) ||
            // IOS and Android are mobile platforms
            platform.value.ios ||
            platform.value.android
        ) {
            showMobileVersion = true;
        }
        // Dispatch the mobile status to the store
        navigationStore.dispatchIsMobile(showMobileVersion);
        navigationStore.dispatchPlatform(platform.value);
    });
</script>
