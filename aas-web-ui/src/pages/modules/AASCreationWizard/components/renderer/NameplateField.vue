<template>
  <FormField :label="getDisplayLabel()">
    <!-- Property -->
    <div v-if="checkTemplateFields.isPropertyElement(element)">
      <div v-if="isRepeatableElement(element)" class="d-flex flex-column ga-3">
        <v-row
          v-for="(entry, index) in repeatableStringValue"
          :key="`${element.idShort}-${index}`"
          class="align-center"
        >
          <v-col cols="11">
            <v-text-field
              density="comfortable"
              hide-details="auto"
              :label="formatLabel(element.idShort)"
              :model-value="entry"
              :type="propertyInputType"
              variant="outlined"
              @update:model-value="onRepeatablePropertyInput(index, $event)"
            />
          </v-col>

          <v-col class="d-flex justify-end" cols="1">
            <v-btn
              color="error"
              icon="mdi-delete"
              variant="text"
              @click="onRemovePropertyRow(index)"
            />
          </v-col>
        </v-row>

        <div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            variant="text"
            @click="onAddPropertyRow"
          >
            Add entry
          </v-btn>
        </div>
      </div>

      <v-text-field
        v-else
        density="comfortable"
        hide-details="auto"
        :model-value="propertyValue"
        :type="propertyInputType"
        variant="outlined"
        @update:model-value="onPropertyInput"
      />
    </div>
    <!-- MultiLanguageProperty -->
    <div v-else-if="checkTemplateFields.isMultiLanguagePropertyElement(element)" class="d-flex flex-column ga-3">
      <v-row
        v-for="(entry, index) in multiLanguageValue"
        :key="`{$element.idShort}-${index}`"
        class="align-center"
      >
        <v-col cols="3">
          <v-text-field
            density="comfortable"
            hide-details="auto"
            label="Language"
            :model-value="entry.language"
            variant="outlined"
            @update:model-value="onLanguageChange(index, $event)"
          />
        </v-col>
        <v-col cols="8">
          <v-text-field
            density="comfortable"
            hide-details="auto"
            label="Text"
            :model-value="entry.text"
            variant="outlined"
            @update:model-value="onTextChange(index, $event)"
          />
        </v-col>
        <v-col class="d-flex justify-end" cols="1">
          <v-btn
            color="error"
            :disabled="multiLanguageValue.length === 1"
            icon="mdi-delete"
            variant="text"
            @click="onRemoveTranslation(index)"
          />
        </v-col>
      </v-row>
      <div>
        <v-btn color="primary" prepend-icon="mdi-plus" variant="text" @click="onAddTranslation">
          Add translation
        </v-btn>
      </div>
    </div>
    <!-- file -->
    <v-file-input
      v-else-if="checkTemplateFields.isFileElement(element)"
      density="comfortable"
      hide-details="auto"
      :model-value="fileValue"
      variant="outlined"
      @update:model-value="onFileInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
  import type { FormStateValue } from '../../types/form'
  import type { TemplateElement } from '../../types/template'
  import { computed } from 'vue'
  import {
    isRepeatableElement, isRequiredElement,
  } from '../../utils/cardinalityUtils'
  import * as checkTemplateFields from '../../utils/checkTemplateFields'
  import { asFile, asLangStrings, asString, asStringArray, formatLabel } from '../../utils/formFieldUtils'
  import {
    addLangStringRow,
    removeLangStringRow,
    updateLangStringLanguage,
    updateLangStringText,
  } from '../../utils/langStringFormUtils'
  import { getPropertyInputType } from '../../utils/propertyInputUtils'
  import {
    addStringRow,
    removeStringRow,
    updateStringRow,
  } from '../../utils/repeatableStringFormUtils'
  import FormField from '../FormField.vue'

  const props = defineProps<{
    element: TemplateElement
    modelValue: FormStateValue
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: FormStateValue): void
  }>()

  const propertyValue = computed<string>(() => {
    return asString(props.modelValue)
  })

  const multiLanguageValue = computed(() => {
    return asLangStrings(props.modelValue)
  })

  const fileValue = computed<File | null>(() => {
    return asFile(props.modelValue)
  })

  const propertyInputType = computed<string>(() => {
    if (!checkTemplateFields.isPropertyElement(props.element)) {
      return 'text'
    }

    return getPropertyInputType(props.element)
  })

  function onPropertyInput (value: string | null): void {
    emit('update:modelValue', value ?? '')
  }

  function onAddTranslation (): void {
    emit('update:modelValue', addLangStringRow(multiLanguageValue.value))
  }

  function onRemoveTranslation (index: number): void {
    emit('update:modelValue', removeLangStringRow(multiLanguageValue.value, index))
  }

  function onLanguageChange (index: number, value: string | null): void {
    emit('update:modelValue', updateLangStringLanguage(multiLanguageValue.value, index, value ?? ''))
  }

  function onTextChange (index: number, value: string | null): void {
    emit('update:modelValue', updateLangStringText(multiLanguageValue.value, index, value ?? ''))
  }

  function onFileInput (value: File | File[] | null): void {
    if (Array.isArray(value)) {
      emit('update:modelValue', value[0] ?? null)
      return
    }

    emit('update:modelValue', value ?? null)
  }
  const repeatableStringValue = computed<string[]>(() => {
    return asStringArray(props.modelValue)
  })
  function onAddPropertyRow (): void {
    emit('update:modelValue', addStringRow(repeatableStringValue.value))
  }

  function onRemovePropertyRow (index: number): void {
    emit('update:modelValue', removeStringRow(repeatableStringValue.value, index))
  }

  function onRepeatablePropertyInput (index: number, value: string | null): void {
    emit('update:modelValue', updateStringRow(repeatableStringValue.value, index, value ?? ''))
  }
  function getDisplayLabel (): string {
    return isRequiredElement(props.element)
      ? `${formatLabel(props.element.idShort)} *`
      : formatLabel(props.element.idShort)
  }
</script>
