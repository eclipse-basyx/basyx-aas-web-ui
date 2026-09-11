<template>
  <v-menu v-model="isOpen">
    <template #activator="{ props: menuProps }">
      <slot name="activator" :props="menuProps">
        <v-btn
          v-bind="menuProps"
          color="listItemText"
          :disabled="disabled"
          icon
          :size="iconSize"
          variant="plain"
          @click.stop
        >
          <v-icon size="x-small">{{ ICONS.MENU }}</v-icon>
        </v-btn>
      </slot>
    </template>

    <v-sheet border>
      <v-list class="py-0" dense density="compact" slim>
        <slot />
      </v-list>
    </v-sheet>
  </v-menu>
</template>

<script setup lang="ts">
  const ICONS = {
    MENU: 'mdi-dots-vertical',
  } as const

  const { iconSize = 'x-small', disabled = false } = defineProps<{ iconSize?: string, disabled?: boolean }>()

  const isOpen = defineModel<boolean>({ default: false })

  watch(() => disabled, value => {
    if (value) isOpen.value = false
  })
</script>
