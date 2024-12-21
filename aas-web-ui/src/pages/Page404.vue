<template>
    <v-container class="pa-md-12">
        <v-empty-state
            headline="Whoops, 404"
            title="Page not found"
            text="The page you were looking for does not exist">
            <template #media>
                <a href="https://basyx.org/" target="_blank">
                    <v-img src="@/assets/BaSyx_Logo.svg" class="my-15"></v-img>
                </a>
            </template>
            <v-row class="mt-3">
                <v-col class="d-flex justify-center" cols="12" md="auto">
                    <v-btn
                        class="text-none"
                        prepend-icon="mdi-account-group-outline"
                        variant="outlined"
                        text="Community"
                        href="https://github.com/eclipse-basyx"
                        target="_blank" />
                </v-col>
                <v-spacer v-if="mdAndDown"></v-spacer>
                <v-col class="d-flex justify-center" cols="12" md="auto">
                    <v-btn
                        class="text-none"
                        prepend-icon="mdi-web"
                        color="primary"
                        elevation="1"
                        text="https://basyx.org"
                        href="https://basyx.org/"
                        target="_blank" />
                </v-col>
                <v-spacer v-if="mdAndDown"></v-spacer>
                <v-col class="d-flex justify-center" cols="12" md="auto">
                    <v-btn
                        class="text-none"
                        prepend-icon="mdi-text-box-outline"
                        variant="outlined"
                        text="Documentation"
                        href="https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html"
                        target="_blank" />
                </v-col>
            </v-row>
        </v-empty-state>
    </v-container>
</template>

<script lang="ts" setup>
    import { useDisplay } from 'vuetify';

    const { mdAndDown } = useDisplay();
</script>
