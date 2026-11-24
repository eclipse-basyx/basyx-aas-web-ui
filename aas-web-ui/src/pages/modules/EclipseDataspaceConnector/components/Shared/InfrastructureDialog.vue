<template>
  <v-dialog v-model="dialog" height="90%" max-width="1920" width="90%">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        {{ title }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0 overflow-y-auto flex-grow-1">

        <v-layout :style="{ 'height': fullHeight }">

          <!-- InfrastructureSelectionDrawers and further drawers -->
          <slot name="drawers" />

          <v-main class="py-0">
            <v-container class="ma-0 pa-0 d-flex flex-column" fluid :style="{ 'height': fullHeight }">

              <!-- Offset by the drawer header, so the empty state aligns with the one of the Submodel List -->
              <div
                v-if="showEmptyState"
                class="d-flex align-center justify-center"
                :style="{ 'height': fullHeight, 'padding-top': drawerHeaderHeight }"
              >
                <slot name="empty-state" />
              </div>

              <slot v-else />

            </v-container>
          </v-main>

        </v-layout>

      </v-card-text>

      <v-divider />

      <v-card-actions>
        <!-- Status next to the buttons, e.g. a warning -->
        <slot name="status" />

        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="dialog = false"
        />

        <slot name="actions" />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  /**
   * Layout of a dialog working on an AAS selected in the InfrastructureSelectionDrawers:
   * the drawers on the left, the content or an empty state on the right, Cancel and further actions at the bottom.
   */
  defineProps<{
    title: string
    showEmptyState: boolean // Instead of the content, e.g. while no AAS is selected
  }>()

  // Data
  const dialog = defineModel<boolean>({ required: true })
  const fullHeight = 'calc(90vh - 52px - 52px - 2px)' // dialog - dialog header - dialog footer - 2x divider
  const drawerHeaderHeight = '121px' // selection field (8px + 40px) + list title bar (72px) + divider (1px)
</script>
