<template>
  <v-container class="pa-0" fluid>
    <v-card
      border
      class="pa-2"
      color="navigationMenu"
      :min-width="620"
      rounded="lg"
    >
      <v-container>
        <v-sheet
          class="overflow-hidden mx-auto mb-4"
          :elevation="smViewerEditor || filteredAndOrderedModuleRoutes.length > 0 ? 2 : 0"
          min-width="450"
          rounded="lg"
        >
          <template v-if="smViewerEditor || filteredAndOrderedModuleRoutes.length > 0">
            <v-tabs v-model="currentTab" color="primary" grow>
              <v-tab class="text-none" text="AAS" value="aas" />

              <v-divider vertical />

              <v-tab v-if="smViewerEditor" class="text-none" text="Submodel" value="submodel" />

              <v-divider vertical />

              <v-tab
                v-if="filteredAndOrderedModuleRoutes.length > 0"
                class="text-none"
                text="Modules"
                value="modules"
              />
            </v-tabs>
            <v-divider />
          </template>
          <div class="pa-2">
            <v-list-item
              v-if="currentTab === 'aas'"
              :active="false"
              :border="isActiveRoutePath('/aasviewer')"
              class="py-2"
              nav
              subtitle="View Asset Administration Shells"
              title="AAS Viewer"
              :to="isActiveRoutePath('/aasviewer') ? '' : { path: '/aasviewer', query: route.query }"
              @click="closeMenu"
            >
              <template #prepend>
                <v-avatar color="surface-light" icon="custom:aasIcon" rounded>
                  <v-icon color="medium-emphasis" />
                </v-avatar>
              </template>
            </v-list-item>
            <v-list-item
              v-if="allowEditing && currentTab === 'aas'"
              :active="false"
              :border="isActiveRoutePath('/aaseditor')"
              class="mt-3 py-2"
              nav
              subtitle="Edit Asset Administration Shells"
              title="AAS Editor"
              :to="isActiveRoutePath('/aaseditor') ? '' : { path: '/aaseditor', query: route.query }"
              @click="closeMenu"
            >
              <template #prepend>
                <v-avatar color="surface-light" icon="mdi-pencil" rounded>
                  <v-icon color="medium-emphasis" />
                </v-avatar>
              </template>
            </v-list-item>
            <v-list-item
              v-if="currentTab === 'aas'"
              :active="false"
              :border="isActiveRoutePath('/aassmviewer')"
              class="mt-3 py-2"
              nav
              subtitle="View Submodel Visualizations of Asset Administration Shells"
              title="AAS SM Visualizations"
              :to="isActiveRoutePath('/aassmviewer') ? '' : { path: '/aassmviewer', query: route.query }"
              @click="closeMenu"
            >
              <template #prepend>
                <v-avatar color="surface-light" icon="mdi-group" rounded>
                  <v-icon color="medium-emphasis" />
                </v-avatar>
              </template>
            </v-list-item>
            <v-list-item
              v-if="smViewerEditor && currentTab === 'submodel'"
              :active="false"
              :border="isActiveRoutePath('/smviewer')"
              class="py-2"
              nav
              subtitle="View Submodels"
              title="SM Viewer"
              :to="isActiveRoutePath('/smviewer') ? '' : { path: '/smviewer', query: route.query }"
              @click="closeMenu"
            >
              <template #prepend>
                <v-avatar color="surface-light" icon="mdi-ungroup" rounded>
                  <v-icon color="medium-emphasis" />
                </v-avatar>
              </template>
            </v-list-item>
            <v-list-item
              v-if="smViewerEditor && allowEditing && currentTab === 'submodel'"
              :active="false"
              :border="isActiveRoutePath('/smeditor')"
              class="mt-3 py-2"
              nav
              subtitle="Edit Submodels"
              title="SM Editor"
              :to="isActiveRoutePath('/smeditor') ? '' : { path: '/smeditor', query: route.query }"
              @click="closeMenu"
            >
              <template #prepend>
                <v-avatar color="surface-light" icon="mdi-pencil" rounded>
                  <v-icon color="medium-emphasis" />
                </v-avatar>
              </template>
            </v-list-item>
            <v-list-item
              v-if="selectedNode && Object.keys(selectedNode).length > 0 && currentTab === 'submodel'"
              :active="false"
              :border="isActiveRoutePath('/visu')"
              class="mt-3 py-2"
              nav
              subtitle="Visualize Submodels/Submodel Elements"
              title="Visualization"
              :to="isActiveRoutePath('/visu') ? '' : { path: '/visu', query: route.query }"
              @click="closeMenu"
            >
              <template #prepend>
                <v-avatar color="surface-light" icon="mdi-chart-line" rounded>
                  <v-icon color="medium-emphasis" />
                </v-avatar>
              </template>
            </v-list-item>
            <v-list
              v-if="currentTab === 'modules'"
              class="pa-0 overflow-y-auto"
              :max-height="52 * 5 + 'px'"
              nav
              style="display: flex; flex-direction: column"
            >
              <v-virtual-scroll
                ref="virtualScrollRef"
                class="bg-navigationMenu"
                :item-height="52"
                :items="filteredAndOrderedModuleRoutes"
              >
                <template #default="{ item }">
                  <v-list-item
                    :active="false"
                    :border="isActiveRoutePath(item.path)"
                    class="my-1 mx-1"
                    nav
                    slim
                    :subtitle="item.path"
                    :title="
                      item.meta?.title ? item.meta.title.toString() : item.meta?.name?.toString()
                    "
                    :to="
                      item?.meta?.preserveRouteQuery === true
                        ? { path: item.path, query: route.query }
                        : { path: item.path }
                    "
                    @click="closeMenu"
                  />
                </template>
              </v-virtual-scroll>
            </v-list>
          </div>
        </v-sheet>
      </v-container>
      <template #actions>
        <v-btn
          class="text-none"
          color="primary"
          text="About"
          :to="isActiveRoutePath('/about') ? '' : '/about'"
          @click="closeMenu"
        />

        <v-divider inset vertical />

        <v-btn
          append-icon="custom:aasIcon"
          class="text-none"
          color="primary"
          href="https://basyx.org"
          target="_blank"
          text="Get Started"
        />

        <v-spacer />

        <v-img :height="42" :max-width="126" src="@/assets/PoweredByBaSyx.svg" />
      </template>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ComponentPublicInstance, Ref } from 'vue'
  import type { RouteRecordRaw } from 'vue-router'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAASStore } from '@/store/AASDataStore'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Vue Router
  const route = useRoute()

  // Stores
  const aasStore = useAASStore()
  const envStore = useEnvStore()
  const navigationStore = useNavigationStore()

  // Emit
  const emit = defineEmits<{
    (e: 'closeMenu'): void
  }>()

  // Data
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component
  const currentTab: Ref<string> = ref('aas') // Current Tab Index

  // Computed Properties
  const isMobile = computed(() => navigationStore.getIsMobile) // Check if the current Device is a Mobile Device
  const currentRoutePath = computed(() => route.path) // get the current route path
  const allowEditing = computed(() => envStore.getAllowEditing) // Check if the current environment allows showing the AAS resp. SM Editor
  const smViewerEditor = computed(() => envStore.getSmViewerEditor) // Check the current environment allows showing the SM Viewer/Editor
  const moduleRoutes = computed(() => navigationStore.getModuleRoutes) // get the module routes
  const selectedAas = computed(() => aasStore.getSelectedAAS) // get selected AAS from Store
  const selectedNode = computed(() => aasStore.getSelectedNode) // get selected AAS from Store
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
      return moduleRoute?.meta?.isVisibleModule === true || isActiveRoutePath(moduleRoute.path)
    })

    const filteredAndOrderedModuleRoutes = filteredModuleRoutes.sort(
      (moduleRouteA: RouteRecordRaw, moduleRouteB: RouteRecordRaw) => {
        const moduleNameA: string = moduleRouteA?.name?.toString() || ''
        const moduleNameB: string = moduleRouteB?.name?.toString() || ''

        return moduleNameA.localeCompare(moduleNameB)
      },
    )
    return filteredAndOrderedModuleRoutes
  })

  onMounted(async () => {
    scrollToSelectedModule()
    setTabByRoutePath()
  })

  function closeMenu (): void {
    emit('closeMenu')
  }

  function isActiveRoutePath (routePath: string): boolean {
    return currentRoutePath.value === routePath || currentRoutePath.value.startsWith(`${routePath}/`)
  }

  // Function to scroll to the active module
  function scrollToSelectedModule (): void {
    // Find the index of the selected item
    const index = filteredAndOrderedModuleRoutes.value.findIndex((moduleRoute: RouteRecordRaw) =>
      isActiveRoutePath(moduleRoute.path),
    )

    if (index !== -1) {
      const intervalId = setInterval(() => {
        if (
          virtualScrollRef.value
          && virtualScrollRef.value?.$el.querySelector('.v-virtual-scroll__container').children.length > 0
        ) {
          // Access the scrollable container
          virtualScrollRef.value.scrollToIndex(index)
          clearInterval(intervalId)
        }
      }, 50)
    }
  }

  function setTabByRoutePath (): void {
    if (isActiveRoutePath('/aasviewer') || isActiveRoutePath('/aaseditor') || isActiveRoutePath('/aassmviewer')) {
      currentTab.value = 'aas'
    } else if (isActiveRoutePath('/smviewer') || isActiveRoutePath('/smeditor') || isActiveRoutePath('/visu')) {
      currentTab.value = 'submodel'
    } else {
      currentTab.value = 'modules'
    }
  }
</script>
