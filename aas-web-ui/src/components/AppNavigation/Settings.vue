<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-cog" class="ml-3"></v-btn>
        </template>
        <v-card
            min-width="300px"
            :color="isMobile ? 'card' : 'navigationMenu'"
            :style="{ 'border-style': isMobile ? '' : 'solid', 'border-width': isMobile ? '' : '1px' }">
            <v-list nav class="py-0" :class="isMobile ? 'bg-card' : 'bg-navigationMenu'">
                <!-- Switch to change the app theme -->
                <ThemeSwitch></ThemeSwitch>
                <v-divider v-if="endpointConfigAvailable" class="mt-3"></v-divider>
                <!-- Backend Configuration -->
                <BackendConfig v-if="endpointConfigAvailable"></BackendConfig>
                <v-divider class="mt-3"></v-divider>
                <v-list-item class="py-0" density="compact" nav>
                    <v-list-item-title class="text-caption text-medium-emphasis pb-0">
                        <span>Version: </span>
                        <span v-if="versionDisplay.showVersion" class="font-weight-medium">
                            {{ versionDisplay.versionText }}
                        </span>
                        <span v-if="versionDisplay.showVersion && versionDisplay.showSnapshot" class="mx-1">·</span>
                        <span v-if="versionDisplay.showSnapshot">{{ versionDisplay.snapshotText }}</span>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getVersionDisplay } from '@/version';

    const envStore = useEnvStore();
    const navigationStore = useNavigationStore();

    const endpointConfigAvailable = ref(envStore.getEndpointConfigAvailable);

    const isMobile = computed(() => navigationStore.getIsMobile);
    const versionDisplay = getVersionDisplay();
</script>
