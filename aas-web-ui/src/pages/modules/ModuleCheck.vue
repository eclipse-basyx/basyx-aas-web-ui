<template>
  <v-container class="pa-md-8">
    <v-card border rounded="lg">
      <v-card-title class="text-h5">Module Check</v-card-title>
      <v-card-subtitle>Availability and visibility of all Test* modules</v-card-subtitle>

      <v-card-text>
        <template v-if="moduleChecks.length > 0">
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Module</th>
                <th />
                <th />
                <th class="text-right">Link</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="moduleCheck in moduleChecks" :key="moduleCheck.name">
                <td>
                  <div>{{ moduleCheck.title }}</div>

                  <div v-if="moduleCheck.title !== moduleCheck.name" class="text-caption text-medium-emphasis">
                    {{ moduleCheck.name }}
                  </div>
                </td>

                <td>
                  <v-chip
                    :color="moduleCheck.isAvailable ? 'success' : 'error'"
                    :prepend-icon="moduleCheck.isAvailable ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
                    size="small"
                    variant="tonal"
                  >
                    {{ moduleCheck.isAvailable ? 'Available' : 'Not available' }}
                  </v-chip>
                </td>

                <td>
                  <v-chip
                    :color="moduleCheck.isVisible ? 'success' : undefined"
                    :prepend-icon="moduleCheck.isVisible ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                    size="small"
                    variant="tonal"
                  >
                    {{ moduleCheck.isVisible ? 'Visible' : 'Hidden' }}
                  </v-chip>
                </td>

                <td class="text-right">
                  <v-btn
                    v-if="moduleCheck.routeLocation"
                    append-icon="mdi-arrow-right"
                    color="primary"
                    size="small"
                    :to="moduleCheck.routeLocation"
                    variant="tonal"
                  >Open</v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>

          <div class="mt-4 text-label-small font-weight-regular font-italic text-medium-emphasis">
            <div><strong>Available</strong>: the module can be opened in the current state. Only available modules are linked.</div>
            <div><strong>Visible</strong>: the module is also listed in the module navigation on this page.</div>
          </div>
        </template>

        <v-empty-state
          v-else
          icon="mdi-folder-open-outline"
          text="There are no modules whose name starts with &quot;Test&quot;."
          title="No Test* modules found"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ModuleNavigationRoute } from '@/types/Application'
  import { useModuleHandling } from '@/composables/ModuleHandling'
  import { useNavigationStore } from '@/store/NavigationStore'

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'Module Check',
    isMobileModule: true,
  })

  const checkedModuleNamePrefix = 'Test'

  // Stores
  const navigationStore = useNavigationStore()

  // Composables
  const { isModuleAvailable, isModuleVisible, getModuleRouteLocation } = useModuleHandling()

  // Computed Properties
  const moduleChecks = computed(() => navigationStore.getModuleRoutes
    .filter((moduleRoute: ModuleNavigationRoute) => moduleRoute.name?.toString().startsWith(checkedModuleNamePrefix))
    .map((moduleRoute: ModuleNavigationRoute) => {
      const name = moduleRoute.name!.toString()
      return {
        name,
        title: moduleRoute.meta?.title?.toString() || name,
        isAvailable: isModuleAvailable(name),
        isVisible: isModuleVisible(name),
        routeLocation: getModuleRouteLocation(name),
      }
    })
    .toSorted((moduleCheckA, moduleCheckB) => moduleCheckA.name.localeCompare(moduleCheckB.name)))
</script>
