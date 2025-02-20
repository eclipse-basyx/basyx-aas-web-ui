<template>
    <v-list-item>
        <v-list-item>
            <v-list-item-title class="text-subtitle-2"> Logged in: </v-list-item-title>
            <v-label>{{ email }}</v-label>
        </v-list-item>
    </v-list-item>
</template>

<script lang="ts">
    import { UserManager } from 'oidc-client-ts';
    import { defineComponent } from 'vue';
    import { OIDC_CONFIG } from '@/constants/oidc-config';

    export default defineComponent({
        name: 'LdUser',

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

        methods: {},
    });
</script>
