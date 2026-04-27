<template>
  <v-container class="pa-md-12">
    <v-empty-state
      headline="Whoops, 404"
      text="The page you were looking for does not exist"
      title="Page not found"
    >
      <template #media>
        <a href="https://basyx.org/" target="_blank">
          <v-img class="my-15" src="@/assets/BaSyx_Logo.svg" />
        </a>
      </template>

      <v-row class="mt-3">
        <v-col class="d-flex justify-center" cols="12" md="auto">
          <v-btn

            href="https://github.com/eclipse-basyx"
            prepend-icon="mdi-account-group-outline"
            target="_blank"
            text="Community"
            variant="outlined"
          />
        </v-col>

        <v-spacer v-if="mdAndDown" />

        <v-col class="d-flex justify-center" cols="12" md="auto">
          <v-btn

            color="primary"
            elevation="1"
            href="https://basyx.org/"
            prepend-icon="mdi-web"
            target="_blank"
            text="https://basyx.org"
          />
        </v-col>

        <v-spacer v-if="mdAndDown" />

        <v-col class="d-flex justify-center" cols="12" md="auto">
          <v-btn

            href="https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html"
            prepend-icon="mdi-text-box-outline"
            target="_blank"
            text="Documentation"
            variant="outlined"
          />
        </v-col>
      </v-row>
    </v-empty-state>
  </v-container>
</template>

<script lang="ts" setup>
  import { useDisplay } from 'vuetify'

  const { mdAndDown } = useDisplay()
</script>
