<template>
    <v-container class="pa-md-8">
        <v-card class="pa-4 mb-4" rounded="lg" border>
            <v-card-title class="text-h5">Module Routing Showcase</v-card-title>
            <v-card-text>
                This module demonstrates nested module routes that stay under
                <strong>/modules/moduleroutingshowcase/**</strong>.
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary" variant="tonal" :to="{ path: '/modules/moduleroutingshowcase' }">Home</v-btn>
                <v-btn color="primary" variant="tonal" :to="{ path: '/modules/moduleroutingshowcase/overview' }"
                    >Overview</v-btn
                >
                <v-btn color="primary" variant="tonal" :to="{ path: '/modules/moduleroutingshowcase/details' }"
                    >Details</v-btn
                >
            </v-card-actions>
        </v-card>

        <router-view />
    </v-container>
</template>

<script lang="ts" setup>
    defineOptions({
        inheritAttrs: false,
        moduleTitle: 'Module Routing Showcase',
        preserveRouteQuery: true,
    });
</script>