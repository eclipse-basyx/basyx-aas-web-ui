<template>
  <v-container class="pa-0 ma-0" fluid style="height: 100%">

    <v-tabs
      v-model="tabs"
      align-tabs="center"
      color="primary"
      @update:model-value="onTabChange"
    >
      <template
        v-for="tabItem in tabItems"
        :key="tabItem.id"
      >
        <v-tab
          :prepend-icon="tabItem.icon"
          :text="tabItem.name"
          :value="tabItem.id"
        />
      </template>
    </v-tabs>

    <v-divider />

    <v-tabs-window v-model="tabs" :style="{ 'height': fullHeight}">
      <v-tabs-window-item
        v-for="tabItem in tabItems"
        :key="tabItem.id"
        :style="{ 'height': fullHeight}"
        :value="tabItem.id"
      >
        <router-view />
      </v-tabs-window-item>
    </v-tabs-window>

  </v-container>
</template>

<script lang="ts" setup>
  import type { YamlEdcConfig } from './types/Edc'
  import yaml from 'js-yaml'
  import { computed, onMounted, ref, watch } from 'vue'
  import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useEdcYamlParser } from './composables/useEdcYamlParser'
  import routes from './routes'
  import { useEdcStore } from './store/EdcStore'

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'Eclipse Dataspace Connector',
    isDesktopModule: true,
    isMobileModule: false,
    preserveRouteQuery: true,
  })

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Composables
  const { validateYamlConfig } = useEdcYamlParser()

  // Stores
  const envStore = useEnvStore()
  const edcStore = useEdcStore()

  // Data
  const initialTab = route.path.split('/').findLast(Boolean) || 'edc'
  const tabs = ref(initialTab)
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px -  2px)') // Full height - header - tabs - footer - border

  const tabItems = computed(() => (routes.children ?? []).map(route => ({
    id: route.path,
    name: (route.meta?.title as string) || route.name || route.path,
    icon: route.meta?.icon as string,
  })))

  // Watcher
  watch(
    () => route.path,
    path => {
      const currentTab = path.split('/').findLast(Boolean)
      if (currentTab) tabs.value = currentTab
    },
  )

  onMounted(async () => {
    await loadEdcConfig()
    const currentTab = route.path.split('/').findLast(Boolean)
    if (currentTab) tabs.value = currentTab
  })

  async function onTabChange (tab: string): Promise<void> {
    const query = { ...route.query } as LocationQueryRaw
    const path = '/modules/eclipsedataspaceconnector/' + tab

    await router.push({ path, query })
    return
  }

  async function loadEdcConfig (): Promise<void> {
    try {
      // Use BASE_URL to support custom base paths
      // In production: use runtime base path from env store
      // In development: use build-time base URL from Vite
      const basePath = import.meta.env.MODE === 'production' ? envStore.getEnvBasePath : import.meta.env.BASE_URL

      let configPath = '/config/'
      if (basePath && basePath.trim() !== '' && !basePath.includes('PLACEHOLDER')) {
        const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/'
        configPath = `${normalizedBasePath}config/`
      }

      const configUrl = `${configPath}edc.yml`
      const response = await fetch(configUrl, {
        method: 'GET',
      })

      // File doesn't exist - fall back to env vars
      if (!response.ok) {
        if (response.status === 404) {
          // No infrastructure config file found - this is normal if using env vars
          return
        }
        console.warn('Failed to fetch EDC configuration:', response.statusText)
        return
      }

      const yamlText = await response.text()
      const yamlConfig = yaml.load(yamlText) as YamlEdcConfig

      // Validate the configuration structure
      if (!validateYamlConfig(yamlConfig)) {
        console.error('Invalid YAML EDC configuration format')
        return
      }

      // Save EDC conf the configuration
      edcStore.saveConfig(yamlConfig)
    } catch (error) {
      console.error('Error loading EDC configuration:', error)
      return
    }
  }

</script>
