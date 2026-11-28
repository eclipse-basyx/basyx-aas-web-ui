<template>
  <v-container class="pa-md-12">
    <v-empty-state
      icon="mdi-folder-open-outline"
      text="This is a test module to showcase child routes with their own requirements."
      :title="moduleName + ' Module'"
    >
      <template #media>
        <v-icon size="64" />
      </template>
    </v-empty-state>

    <router-view />
  </v-container>
</template>

<script lang="ts" setup>

  defineOptions({
    inheritAttrs: false,
  })

  const moduleName = ref('TestChildRoutes')
</script>
