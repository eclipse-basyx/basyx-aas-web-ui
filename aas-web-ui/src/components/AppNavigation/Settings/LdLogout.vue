<template>
    <v-list-item>
        <v-list-item>
            <v-list-item-title class="text-subtitle-2"> User </v-list-item-title>
            <v-label>{{ email }}</v-label>
        </v-list-item>
        <v-btn color="primary" variant="outlined" @click="logOut()">Log out</v-btn>
    </v-list-item>
</template>

<script lang="ts">
    import { UserManager } from 'oidc-client-ts';
    import { defineComponent } from 'vue';
    import { OIDC_CONFIG } from '@/constants/oidc-config';

    export default defineComponent({
        name: 'LdLogout',

        setup() {
            return {};
        },

        data() {
            return {
                email: '',
            };
        },

        computed: {},

        mounted() {
            const userManager = new UserManager(OIDC_CONFIG);
            userManager.getUser().then((user) => {
                this.email = user?.profile.email ?? '';
            });
        },

        methods: {
            logOut() {
                const userManager = new UserManager(OIDC_CONFIG);
                userManager.metadataService.getMetadata().then((metadata) => {
                    metadata.end_session_endpoint = metadata.logout_endpoint;
                    userManager.signoutRedirect();
                });
            },
        },
    });
</script>
