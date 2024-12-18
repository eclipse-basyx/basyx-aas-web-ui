<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-cog" class="ml-3"></v-btn>
        </template>
        <v-card
            min-width="300px"
            :color="isMobile ? 'card' : 'navigationMenu'"
            :style="{ 'border-style': isMobile ? '' : 'solid', 'border-width': isMobile ? '' : '1px' }">
            <v-list nav class="pt-0 pb-2" :class="isMobile ? 'bg-card' : 'bg-navigationMenu'">
                <!-- Switch to change the app theme -->
                <ThemeSwitch></ThemeSwitch>
            </v-list>
        </v-card>
    </v-menu>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';
    import ThemeSwitch from './Settings/ThemeSwitch.vue';

    const navigationStore = useNavigationStore();

    const isMobile = computed(() => navigationStore.getIsMobile);
</script>
