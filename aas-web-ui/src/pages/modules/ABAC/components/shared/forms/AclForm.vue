<template>
  <div class="d-flex flex-column ga-4">
    <v-row align="start" class="ma-0 ga-4" no-gutters>
      <v-col cols="12" sm="2">
        <v-select
          :aria-label="t('forms.acl.access')"
          class="flex-grow-0"
          density="comfortable"
          hide-details="auto"
          :items="accessItems"
          :label="t('forms.acl.access')"
          :model-value="modelValue.access"
          v-bind="diagnosticFieldProps(errorPaths ?? [], warningPaths ?? [], t, 'ACCESS')"
          variant="outlined"
          @update:model-value="onAccessSelect"
        />
      </v-col>

      <v-col cols="12" sm>
        <v-combobox
          :aria-label="t('forms.acl.rights')"
          chips
          closable-chips
          density="comfortable"
          hide-details="auto"
          :items="rightsItems"
          :label="t('forms.acl.rights')"
          :model-value="modelValue.rights"
          v-bind="diagnosticFieldProps(errorPaths ?? [], warningPaths ?? [], t, 'RIGHTS')"
          multiple
          variant="outlined"
          @update:model-value="onRightsSelect"
        >
          <template #prepend-item>
            <v-list-item density="compact" @click="toggleAllRights">
              <span class="d-block text-end text-body-small">{{ t('forms.acl.toggleAll') }}</span>
            </v-list-item>

            <v-divider />
          </template>
        </v-combobox>
      </v-col>
    </v-row>

    <div class="mt-2">
      <FormSectionHeading
        :help="t('forms.acl.attributesHint')"
        help-topic="attributes"
        :title="t('forms.acl.attributes')"
      />

      <AttributeListEditor
        :error-paths="errorPaths?.filter(path => path[0] === 'ATTRIBUTES').map(path => path.slice(1))"
        :model-value="modelValue.attributes ?? []"
        :warning-paths="warningPaths?.filter(path => path[0] === 'ATTRIBUTES').map(path => path.slice(1))"
        @update:model-value="onAttributesUpdate"
      />

    </div>

    <v-divider class="mb-2" />

    <v-combobox
      :aria-label="t('forms.acl.useAttributes')"
      v-bind="diagnosticFieldProps(errorPaths ?? [], warningPaths ?? [], t, 'USEATTRIBUTES')"
      chips
      closable-chips
      density="comfortable"
      hide-details="auto"
      :items="attributeNames"
      :label="t('forms.acl.useAttributes')"
      :model-value="modelValue.useAttributes"
      variant="outlined"
      @update:model-value="onUseAttributesSelect"
    />
  </div>
</template>

<script setup lang="ts">
  import type { AclState, AttributeSourceState } from '../../../types/forms'
  import { ACCESS_VALUES, RIGHTS_VALUES } from '@/schemas/access-rules/constants'
  import { useDefinitionNames } from '../../../hooks/forms/useDefinitionNames'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { diagnosticFieldProps } from '../../../utils/forms/diagnostics'
  import AttributeListEditor from './AttributeListEditor.vue'
  import FormSectionHeading from './FormSectionHeading.vue'

  const modelValue = defineModel<AclState>({ required: true })

  defineProps<{ errorPaths?: string[][], warningPaths?: string[][] }>()

  const { t } = useAbacI18n()
  const attributeNames = useDefinitionNames('attributes')

  const accessItems = computed(() => ACCESS_VALUES.map(value => ({ title: t(`forms.acl.accessValues.${value}`), value })))
  const rightsItems = RIGHTS_VALUES

  function onAccessSelect (value: unknown): void {
    modelValue.value = { ...modelValue.value, access: value as AclState['access'] }
  }

  function toggleAllRights (): void {
    const concreteRights: string[] = RIGHTS_VALUES.filter(right => right !== 'ALL')
    const selected = modelValue.value.rights ?? []
    const allSelected = concreteRights.every(right => selected.includes(right))
    const rights = allSelected
      ? selected.filter(right => !concreteRights.includes(right))
      : [...new Set([...selected, ...concreteRights])]
    modelValue.value = { ...modelValue.value, rights }
  }

  function onRightsSelect (value: unknown[]): void {
    modelValue.value = { ...modelValue.value, rights: value.map(String) }
  }

  function onAttributesUpdate (value: AttributeSourceState[]): void {
    modelValue.value = { ...modelValue.value, attributes: value }
  }

  function onUseAttributesSelect (value: string | string[] | null | undefined): void {
    // Clearing or deleting the last chip resets the optional reference.
    const name = Array.isArray(value) ? value[0] : value
    modelValue.value = { ...modelValue.value, useAttributes: typeof name === 'string' && name.trim() !== '' ? name : undefined }
  }
</script>
