<template>
  <v-container>
    <!-- Main App Bar -->
    <v-app-bar class="px-3" color="appBar">
      <v-row align="center" class="mx-0">
        <v-card class="ml-2" color="appBar" flat style="display: flex; align-items: center">
          <!-- Logo in the App Bar -->
          <img alt="Logo" :src="LogoPath" style="min-height: 42px; max-height: 42px">
        </v-card>
        <!-- Home button -->
        <v-btn-group v-if="!isMobile" border class="ml-7" density="compact">
          <v-tooltip location="bottom" open-delay="600">
            <template #activator="{ props }">
              <v-btn
                :active="false"
                icon
                style="padding-right: 20px; padding-left: 20px"
                v-bind="props"
                :to="{ name: currentRoute, query: {} }"
                variant="tonal"
              >
                <v-icon size="small">mdi-home-outline</v-icon>
              </v-btn>
            </template>
            <div class="d-flex flex-column align-center">
              <div class="d-flex align-center mb-1">
                <v-hotkey class="mr-2" :keys="homeCombo" variant="elevated" />
                <span>Home</span>
              </div>
              <span>Clears the current query parameters</span>
            </div>
          </v-tooltip>
          <v-divider inset vertical />
          <!-- Menu Toggle (Desktop) -->
          <v-menu v-model="mainMenu" :close-on-content-click="false" :offset="8">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                append-icon="mdi-menu-down"
                class="text-none"
                size="small"
                variant="tonal"
              >
                {{ menuToggleTitle }}
              </v-btn>
            </template>
            <!-- Main Menu Component -->
            <MainMenu @close-menu="mainMenu = false" />
          </v-menu>
          <v-divider inset vertical />
          <v-tooltip location="bottom" open-delay="600">
            <template #activator="{ props }">
              <v-btn
                icon
                style="padding-right: 20px; padding-left: 20px"
                variant="tonal"
                v-bind="props"
                @click="commandPaletteDialog = true"
              >
                <v-icon size="small">mdi-console-line</v-icon>
              </v-btn>
            </template>
            <span>
              <v-hotkey class="mr-2" :keys="commandPaletteCombo" variant="elevated" />
              Command Palette
            </span>
          </v-tooltip>
        </v-btn-group>
        <v-spacer />
        <!-- Settings (Desktop) -->
        <v-btn-group v-if="!isMobile" border class="mr-3" density="compact">
          <!-- Auto Sync Toggle -->
          <AutoSync v-if="showAutoSync" />
          <v-divider v-if="showAutoSync" inset vertical />
          <!-- Settings Menu -->
          <Settings />
        </v-btn-group>
        <!-- Auto Sync Toggle (Mobile) -->
        <AutoSync v-else />
        <!-- Settings Dialog (Mobile) -->
        <v-dialog
          v-if="isMobile"
          v-model="mainMenu"
          fullscreen
          :transition="false"
          :z-index="9993"
        >
          <template #activator="{ props }">
            <v-btn icon="mdi-cog" v-bind="props" variant="text" />
          </template>
          <v-card color="card">
            <v-toolbar class="mb-3" color="appBar" elevation="3">
              <v-toolbar-title>Settings</v-toolbar-title>
              <v-spacer />
              <v-toolbar-items>
                <v-btn class="mr-3" icon="mdi-close" @click="mainMenu = false" />
              </v-toolbar-items>
            </v-toolbar>
            <!-- Settings in Mobile View -->
            <v-row align="start" justify="center" style="max-height: calc(100vh - 64px); overflow-y: auto">
              <v-col class="text-center px-5" cols="12">
                <ThemeSwitch />
                <v-divider class="mt-2" />
                <InfrastructureSelector
                  v-if="endpointConfigAvailable"
                  @open-manage="openInfrastructureManagement"
                />
                <v-divider v-if="endpointConfigAvailable" class="mt-2" />
              </v-col>
              <v-col class="text-center" cols="12">
                <!-- IDTA Logo -->
                <v-img class="mx-auto" max-width="120px" src="@/assets/IDTA_Logo_Blue_Web_S.svg" />
              </v-col>
            </v-row>
          </v-card>
        </v-dialog>
        <!-- Auth Status with user Menu -->
        <User v-if="!isMobile" />
      </v-row>
    </v-app-bar>

    <!-- global Snackbar -->
    <Snackbar />

    <!-- Command Palette -->
    <CommandPalette v-model="commandPaletteDialog" />

    <!-- App Footer -->
    <v-footer app class="bg-appBar text-center d-flex py-0">
      <v-spacer />
      <v-list-item class="px-1">
        <v-list-item-title>
          <div>{{ new Date().getFullYear() }} — <strong>Eclipse BaSyx™ ©</strong></div>
        </v-list-item-title>
      </v-list-item>
      <v-spacer />
      <!-- IDTA Logo -->
      <a href="https://industrialdigitaltwin.org/" rel="noopener" target="_blank">
        <v-img v-if="!isMobile" class="cursor-pointer" src="@/assets/IDTA_Logo_Blue_Web_S.svg" width="80px" />
      </a>
    </v-footer>

    <!-- left Side Menu with the AAS List -->
    <v-navigation-drawer
      v-if="showAASList && !isMobile"
      v-model="drawerVisibility"
      class="leftMenu"
      color="appNavigation"
      :width="336"
      @update:model-value="updateDrawerState"
    >
      <AASList />
    </v-navigation-drawer>
    <v-btn
      v-if="showAASList && !isMobile && !drawerVisibility"
      icon="mdi-chevron-double-right"
      style="position: fixed; bottom: 50px; left: 10px; z-index: 10"
      @click="extendSidebar()"
    />

    <!-- Mobile Menu -->
    <v-menu
      v-if="showMobileMenu"
      v-model="mobileMenu"
      style="z-index: 9992"
      transition="slide-y-reverse-transition"
    >
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          class="text-buttonText"
          :color="mobileMenu ? 'invertedButton' : 'primary'"
          :icon="mobileMenu ? 'mdi-close' : 'mdi-dots-vertical'"
          style="position: fixed; bottom: 50px; right: 10px; z-index: 9990"
        />
      </template>
      <div class="mr-1 mb-6">
        <!-- Modules -->
        <v-row
          v-for="(moduleRoute, index) in filteredAndOrderedModuleRoutes"
          :key="index"
          align="center"
          justify="end"
        >
          <v-col class="pr-1" cols="auto">
            <v-card
              class="py-1 px-2 text-buttonText"
              :color="isActiveModuleRoute(moduleRoute.path) ? 'primarySurface' : 'primary'"
              :disabled="isActiveModuleRoute(moduleRoute.path)"
              :to="
                moduleRoute?.meta?.preserveRouteQuery === true
                  ? { path: moduleRoute.path, query: route.query }
                  : { path: moduleRoute.path }
              "
            >{{ moduleRoute.name }}</v-card>
          </v-col>
          <v-col class="py-1" cols="auto">
            <v-btn
              :active="isActiveModuleRoute(moduleRoute.path)"
              class="text-buttonText"
              color="primary"
              :disabled="isActiveModuleRoute(moduleRoute.path)"
              icon="mdi-view-module"
              size="small"
              style="z-index: 9990"
              :to="
                moduleRoute?.meta?.preserveRouteQuery === true
                  ? { path: moduleRoute.path, query: route.query }
                  : { path: moduleRoute.path }
              "
            />
          </v-col>
        </v-row>
        <!-- AAS Viewer -->
        <v-row align="center" justify="end">
          <v-col class="pr-1" cols="auto">
            <v-card
              class="py-1 px-2 text-buttonText"
              :color="route.path === '/aaslist' ? 'primarySurface' : 'primary'"
              :disabled="route.path === '/aaslist'"
              to="/aaslist"
            >AAS Viewer</v-card>
          </v-col>
          <v-col class="py-1" cols="auto">
            <v-btn
              :active="route.path === '/aaslist'"
              class="text-buttonText"
              color="primary"
              :disabled="route.path === '/aaslist'"
              icon="mdi-format-list-text"
              size="small"
              style="z-index: 9990"
              to="/aaslist"
            />
          </v-col>
        </v-row>
        <!-- About -->
        <v-row align="center" justify="end">
          <v-col class="pr-1" cols="auto">
            <v-card
              class="py-1 px-2 text-buttonText"
              :color="route.path === '/about' ? 'primarySurface' : 'primary'"
              :disabled="route.path === '/about'"
              to="/about"
            >About</v-card>
          </v-col>
          <v-col class="py-1" cols="auto">
            <v-btn
              :active="route.path === '/about'"
              class="text-buttonText"
              color="primary"
              :disabled="route.path === '/about'"
              icon="mdi-format-list-group"
              size="small"
              style="z-index: 9990"
              to="/about"
            />
          </v-col>
        </v-row>
      </div>
    </v-menu>
  </v-container>
</template>

<script lang="ts" setup>
  import type { AutoSyncType, StatusCheckType } from '@/types/Application'
  import type { RouteRecordRaw } from 'vue-router'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useTheme } from 'vuetify'
  import Snackbar from '@/components/AppNavigation/Snackbar.vue'
  import { useGlobalShortcuts } from '@/composables/Shortcuts/useGlobalShortcuts'
  import { useAASStore } from '@/store/AASDataStore'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  // Vue Router
  const route = useRoute()

  // Stores
  const navigationStore = useNavigationStore()
  const envStore = useEnvStore()
  const aasStore = useAASStore()

  // Vuetify
  const theme = useTheme()

  // Platform detection for hotkey
  const isMac = computed(() => typeof navigator !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent))
  const commandPaletteCombo = computed(() => (isMac.value ? 'cmd+k' : 'ctrl+k'))
  const homeCombo = computed(() => (isMac.value ? 'cmd+shift+h' : 'ctrl+shift+h'))

  // Register global shortcuts with command palette callback
  useGlobalShortcuts(() => {
    commandPaletteDialog.value = true
  })

  // Data
  const mainMenu = ref(false) // Variable to show the Main Menu
  const commandPaletteDialog = ref(false) // Variable to show the Command Palette Dialog

  const mobileMenu = ref(false) // Variable to show the Mobile Menu
  const drawerVisibility = ref(true) // Variable to show the AAS List Drawer

  const infrastructureMenu = ref(false) // Variable to show the Infrastructure Menu
  const infrastructureManagementDialog = ref(false) // Variable to show the Infrastructure Management Dialog

  // Computed Properties
  const currentRoute = computed(() => route.name) // get the current route name
  const isMobile = computed(() => navigationStore.getIsMobile)
  const isDark = computed(() => theme.global.current.value.dark)
  const selectedAas = computed(() => aasStore.getSelectedAAS) // get selected AAS from Store
  const selectedNode = computed(() => aasStore.getSelectedNode) // get selected AAS from Store
  const moduleRoutes = computed(() => navigationStore.getModuleRoutes) // get the module routes
  const endpointConfigAvailable = computed(() => envStore.getEndpointConfigAvailable)
  const menuToggleTitle = computed(() => {
    if (route.path.startsWith('/modules/')) {
      const parentModuleRoute = route.matched.find(record => record.path.startsWith('/modules/'))
      const parentTitle = parentModuleRoute?.meta?.title
      const parentName = parentModuleRoute?.meta?.name

      if (parentTitle) return parentTitle.toString()
      if (parentName) return parentName.toString()
    }

    if (route.meta?.title) return route.meta.title.toString()
    return route.meta?.name?.toString() || ''
  })

  const filteredAndOrderedModuleRoutes = computed(() => {
    const filteredModuleRoutes = moduleRoutes.value.filter((moduleRoute: RouteRecordRaw) => {
      if (isMobile.value && !moduleRoute?.meta?.isMobileModule) return false
      if (!isMobile.value && !moduleRoute?.meta?.isDesktopModule) return false
      if (
        moduleRoute?.meta?.isOnlyVisibleWithSelectedAas
        && (!selectedAas.value || Object.keys(selectedAas.value).length === 0)
      )
        return false
      if (
        moduleRoute?.meta?.isOnlyVisibleWithSelectedNode
        && (!selectedNode.value || Object.keys(selectedNode.value).length === 0)
      )
        return false
      return moduleRoute?.meta?.isVisibleModule === true || isActiveModuleRoute(moduleRoute.path)
    })
    const filteredAndOrderedModuleRoutes = filteredModuleRoutes.toSorted(
      (moduleRouteA: RouteRecordRaw, moduleRouteB: RouteRecordRaw) => {
        const moduleNameA: string = moduleRouteA?.name?.toString() || ''
        const moduleNameB: string = moduleRouteB?.name?.toString() || ''
        return moduleNameA.localeCompare(moduleNameB)
      },
    )
    return filteredAndOrderedModuleRoutes
  })
  const showAASList = computed(() => ['AASViewer', 'AASEditor', 'AASSubmodelViewer'].includes(route.name as string))
  const drawerState = computed(() => navigationStore.getDrawerState)
  const LogoPath = computed(() => {
    const basePath = import.meta.env.MODE === 'production' ? envStore.getEnvBasePath : import.meta.env.BASE_URL

    let logoFolder = '/Logo/'
    if (basePath && basePath.trim() !== '' && !basePath.includes('PLACEHOLDER')) {
      const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/'
      logoFolder = `${normalizedBasePath}Logo/`
    }

    if (isDark.value && envStore.getEnvLogoDarkPath.trim().length > 0) {
      return validURL(envStore.getEnvLogoDarkPath)
        ? envStore.getEnvLogoDarkPath
        : logoFolder + envStore.getEnvLogoDarkPath
    } else {
      return validURL(envStore.getEnvLogoLightPath)
        ? envStore.getEnvLogoLightPath
        : logoFolder + envStore.getEnvLogoLightPath
    }
  })
  const showMobileMenu = computed(() => isMobile.value && !mainMenu.value)
  const showAutoSync = computed(() => {
    return [
      'AASViewer',
      'AASList',
      'SubmodelList',
      'ComponentVisualization',
      'Visualization',
      'AASEditor',
      'AASSubmodelViewer',
      'AASCommander',
    ].includes(route.name as string)
  })

  watch(
    () => drawerState.value,
    () => {
      drawerVisibility.value = drawerState.value
    },
  )

  onMounted(async () => {
    applyTheme()

    // Get auto-sync object from the lcoal storage
    const autoSyncToDispatch = JSON.parse(localStorage.getItem('autoSync') || '{}') as AutoSyncType
    if (autoSyncToDispatch && Object.keys(autoSyncToDispatch).length > 0) {
      navigationStore.dispatchAutoSync(autoSyncToDispatch)
    }

    // Get status-check object from the lcoal storage
    const statusCheckToDispatch = JSON.parse(localStorage.getItem('statusCheck') || '{}') as StatusCheckType
    if (statusCheckToDispatch && Object.keys(statusCheckToDispatch).length > 0) {
      navigationStore.dispatchStatusCheck(statusCheckToDispatch)
    }
  })

  function applyTheme (): void {
    // check the local storage for a saved theme preference
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme) {
      if (storedTheme === 'dark' || storedTheme === 'light') {
        theme.change(storedTheme)
      } else {
        // sets the Theme according to the Users preferred Theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          theme.change('dark')
        } else {
          theme.change('light')
        }
      }
    } else {
      // sets the Theme according to the Users preferred Theme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme.change('dark')
      } else {
        theme.change('light')
      }
    }
  }

  function extendSidebar (): void {
    drawerVisibility.value = true
    navigationStore.dispatchDrawerState(true)
  }

  function updateDrawerState (value: boolean): void {
    // console.log('updateDrawerState: ', value);
    navigationStore.dispatchDrawerState(value)
  }

  function openInfrastructureManagement (): void {
    infrastructureMenu.value = false
    infrastructureManagementDialog.value = true
  }

  function validURL (str: string): boolean {
    try {
      const url = new URL(str)
      // Ensure we only accept web protocols (http/https)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  function isActiveModuleRoute (routePath: string): boolean {
    return route.path === routePath || route.path.startsWith(`${routePath}/`)
  }
</script>
