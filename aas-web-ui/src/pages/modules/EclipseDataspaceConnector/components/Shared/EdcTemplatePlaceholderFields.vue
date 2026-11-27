<template>
  <div class="d-flex flex-column">
    <v-text-field
      v-for="(placeholder, index) in placeholders"
      :key="placeholder.label"
      :class="index > 0 ? 'mt-2': ''"
      :disabled="disabled"
      :hide-details="placeholder.hint == ''"
      :hint="placeholder.hint"
      :label="placeholder.mandatory ? `${placeholder.label} *` : placeholder.label"
      :model-value="values[placeholder.label]"
      :persistent-hint="placeholder.hint !== ''"
      :placeholder="placeholder.placeholder"
      :required="placeholder.mandatory ?? true"
      variant="outlined"
      @update:model-value="value => setValue(placeholder.label, value)"
    >
      <template v-if="appendAttribute && placeholder.attribute === appendAttribute" #append>
        <slot name="append" />
      </template>
    </v-text-field>
  </div>
</template>

<script lang="ts" setup>
  import type { TemplatePlaceholder } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'

  defineProps<{
    placeholders: (TemplatePlaceholder & { mandatory?: boolean })[] // Marked with `*` if mandatory, required unless `mandatory: false`
    disabled?: boolean
    appendAttribute?: string // Attribute of the placeholder whose field shows the append slot, e.g. `@id`
  }>()

  // Data
  const values = defineModel<Record<string, string>>({ required: true }) // By placeholder label

  // Methods
  function setValue (label: string, value: string): void {
    values.value = { ...values.value, [label]: value }
  }
</script>
