<template>
    <v-container fluid class="pa-0">
        <v-empty-state
            headline="Whoops, 404"
            title="Page not found"
            text="The page you were looking for does not exist">
            <template #media>
                <a href="https://basyx.org/" target="_blank">
                    <v-img src="Basyx_Logo.svg" class="my-15">
                        <template #sources>
                            <source srcset="@/assets/BaSyx_Logo.svg" />
                        </template>
                    </v-img>
                </a>
            </template>
            <template #actions>
                <v-btn
                    class="text-none"
                    variant="outlined"
                    text="Community"
                    href="https://github.com/eclipse-basyx"
                    target="_blank">
                    <template #prepend>
                        <v-icon>mdi-account-group-outline</v-icon>
                    </template>
                </v-btn>

                <v-btn
                    class="text-none"
                    color="primary"
                    elevation="1"
                    text="https://basyx.org"
                    href="https://basyx.org/"
                    target="_blank">
                    <template #prepend>
                        <v-icon>mdi-web</v-icon>
                    </template>
                </v-btn>

                <v-btn
                    class="text-none"
                    variant="outlined"
                    text="Documentation"
                    href="https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html"
                    target="_blank">
                    <template #prepend>
                        <v-icon>mdi-text-box-outline</v-icon>
                    </template>
                </v-btn>
            </template>
        </v-empty-state>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'Page404',
    });
</script>
