<template>
  <v-list-item
    :active="selected"
    base-color="listItem"
    :border="selected ? 'primary' : 'listItem thin'"
    class="mt-2 mx-0"
    color="primarySurface"
    style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
    :style="{ 'border-color': borderColor }"
    variant="tonal"
    @click="emit('select')"
  >
    <template #prepend>
      <v-btn
        class="ml-n1"
        color="primary"
        :icon="icon"
        size="x-small"
        style="z-index: 9000"
        variant="plain"
        @click.stop
      />
    </template>

    <v-tooltip
      activator="parent"
      open-delay="600"
      transition="slide-x-transition"
    >
      <!-- ID -->
      <div v-if="resource['@id']" class="text-body-small">
        <span class="font-weight-bold">{{ 'ID: ' }}</span>
        {{ resource['@id'] }}
      </div>

      <!-- Created At -->
      <div v-if="resource['createdAt']" class="text-body-small mt-1">
        <span class="font-weight-bold">{{ 'Created: ' }}</span>
        {{ new Date(resource['createdAt']).toISOString() }}
      </div>

      <slot name="tooltip" />
    </v-tooltip>

    <v-list-item-title class="text-primary">
      <slot name="title" />
    </v-list-item-title>

    <v-list-item-subtitle class="text-listItemText">
      <slot name="subtitle" />
    </v-list-item-subtitle>

    <template #append>
      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn
            color="listItemText"
            icon
            size="x-small"
            variant="plain"
            v-bind="menuProps"
            @click.prevent
          >
            <v-icon size="x-small">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-sheet border>
          <v-list class="py-0" dense density="compact" slim>

            <!-- Update -->
            <v-list-item @click="emit('edit')">
              <template #prepend>
                <v-icon size="x-small">mdi-pencil</v-icon>
              </template>

              <v-list-item-subtitle>Edit {{ label }}</v-list-item-subtitle>
            </v-list-item>

            <!-- Delete -->
            <v-list-item @click="emit('delete')">
              <template #prepend>
                <v-icon size="x-small">mdi-delete</v-icon>
              </template>

              <v-list-item-subtitle>Delete {{ label }}</v-list-item-subtitle>
            </v-list-item>

            <v-divider />
            <!-- Copy ID to clipboard -->
            <v-list-item @click.stop="copyId()">
              <template #prepend>
                <v-icon size="x-small">{{ copyIcon }} </v-icon>
              </template>

              <v-list-item-subtitle>Copy {{ label }} ID</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-sheet>
      </v-menu>
    </template>
  </v-list-item>
</template>

<script lang="ts" setup>
  import { useTheme } from 'vuetify'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'

  const props = defineProps<{
    resource: any
    label: string // e.g. `Asset`, used in the menu texts
    icon: string
    selected: boolean
  }>()

  const emit = defineEmits<{
    (event: 'select' | 'edit' | 'delete'): void
  }>()

  // Composables
  const { copyToClipboard } = useClipboardUtil()

  // Vuetify
  const theme = useTheme()

  // Data
  const copyIcon = ref<string>('mdi-clipboard-file-outline')

  // Computed properties
  const borderColor = computed(() => {
    if (props.selected) return theme.current.value.colors.primary + ' !important'
    return theme.global.current.value.dark ? '#686868 !important' : '#ABABAB !important'
  })

  function copyId (): void {
    copyToClipboard(props.resource['@id'], `${props.label}Id`, copyIcon)
  }
</script>
