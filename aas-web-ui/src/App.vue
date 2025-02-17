<template>
    <v-app>
        <!-- App Navigation and it's sub-Components (AASList, etc.) -->
        <AppNavigation />
        <v-main style="padding-top: 33px">
            <!-- App Content (eg. AASViewer, AASEditor, etc.) -->
            <router-view v-slot="{ Component }">
                <keep-alive :include="['AASList', 'SubmodelTree', 'SubmodelList']">
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
    import { onBeforeUnmount, onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';

    // Vue Router
    const router = useRouter();

    // Data
    const mediaQueryList = window.matchMedia('(max-width: 600px)');
    const matchesMobile = ref(mediaQueryList.matches);

    onMounted(() => {
        mediaQueryList.addEventListener('change', handleMediaChange);
    });

    onBeforeUnmount(() => {
        mediaQueryList.removeEventListener('change', handleMediaChange);
    });

    function handleMediaChange(event: MediaQueryListEvent): void {
        if (matchesMobile.value !== event.matches) {
            router.go(0); // This reloads the current route
        }
    }
</script>
