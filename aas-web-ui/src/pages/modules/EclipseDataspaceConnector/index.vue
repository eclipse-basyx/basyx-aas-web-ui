<template>
  <v-container class="pa-0 ma-0" fluid style="height: 100%">

    <div class="d-flex align-center">
      <div class="pl-4 d-flex align-center">
        <v-icon class="mr-2" icon="custom:edcIcon" size="18" />
        <span class="text-body-medium">Eclipse Dataspace Connector</span>
      </div>

      <v-tabs
        v-model="tabs"
        align-tabs="center"
        class="flex-grow-1"
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
    </div>

    <v-divider />

    <!-- One router view for all tabs: a view per tab would render the current tab several times -->
    <div :style="{ 'height': fullHeight}">
      <router-view />
    </div>

  </v-container>
</template>

<script lang="ts" setup>
  import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router'
  import routes from './routes'

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'Eclipse Dataspace Connector',
    isDesktopModule: true,
    isMobileModule: false,
    supportedInfrastructureTemplates: ['catena-x'],
    preserveRouteQuery: true,
  })

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Data
  const initialTab = route.path.split('/').findLast(Boolean) || 'assets'
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
    const currentTab = route.path.split('/').findLast(Boolean)
    if (currentTab) tabs.value = currentTab
  })

  async function onTabChange (tab: string): Promise<void> {
    const query = { ...route.query } as LocationQueryRaw
    const path = '/modules/eclipsedataspaceconnector/' + tab

    await router.push({ path, query })
    return
  }

</script>
