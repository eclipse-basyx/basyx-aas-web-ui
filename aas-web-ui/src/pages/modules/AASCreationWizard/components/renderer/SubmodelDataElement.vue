<template>
  <FormField :label="getDisplayLabel()">
    <!-- Property -->
    <!-- Repeatable Property -->
    <div v-if="checkTemplateFields.isPropertyElement(element)">
      <!-- Boolean Property -->
      <v-checkbox
        v-if="isBooleanProperty"
        density="compact"
        :error="hasRequiredError"
        :error-messages="errorMessages"
        hide-details="auto"
        :model-value="booleanValue"
        @update:model-value="onBooleanInput"
      />

      <div v-else-if="isRepeatableElement(element)" class="d-flex flex-column ga-3">

        <v-row
          v-for="(entry, index) in repeatableStringValue"
          :key="`${element.idShort}-${index}`"
          class="align-center"
        >
          <v-col cols="11">
            <v-text-field
              density="compact"
              :error="hasRequiredError"
              :error-messages="errorMessages"
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
      <!-- Non Repeatable Property -->
      <v-text-field
        v-else-if="!isRepeatableElement(element)"
        density="compact"
        :error="hasRequiredError"
        :error-messages="errorMessages"
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
        :key="`${element.idShort}-${index}`"
        class="align-start"
      >
        <v-col cols="3">
          <!-- <v-text-field
            density="compact"
            hide-details="auto"
            label="Language"
            :model-value="entry.language"
            variant="outlined"
            @update:model-value="onLanguageChange(index, $event)"
          /> -->
          <v-combobox
            clearable
            :custom-filter="langFilter"
            density="compact"
            hide-details="auto"
            item-title="name"
            item-value="code"
            :items="languageOptions"
            label="Language"
            :model-value="entry.language"
            :return-object="false"
            single-line
            variant="outlined"
            @update:model-value="onLanguageChange(index, $event)"
          >
            <template #selection="{ item }">
              <span>{{ item.code }}</span>
            </template>

            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #append>
                  <span class="ml-2">{{ item.code }}</span>
                </template>
              </v-list-item>
            </template>
          </v-combobox>
        </v-col>

        <v-col cols="8">
          <v-text-field
            density="compact"
            :error="hasRequiredError"
            :error-messages="errorMessages"
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
      density="compact"
      :error="hasRequiredError"
      :error-messages="errorMessages"
      hide-details="auto"
      :model-value="fileValue"
      variant="outlined"
      @update:model-value="onFileInput"
    />
    <!-- Range Element -->
    <div
      v-else-if="checkTemplateFields.isRangeElement(element)"
      class="d-flex flex-column ga-3"
    >
      <v-row>
        <v-col cols="6">
          <v-text-field
            density="compact"
            :error="hasRequiredError"
            :error-messages="errorMessages"
            hide-details="auto"
            label="Min"
            :model-value="rangeValue.min"
            :type="propertyInputType"
            variant="outlined"
            @update:model-value="onRangeMinInput"
          />
        </v-col>

        <v-col cols="6">
          <v-text-field
            density="compact"
            :error="hasRequiredError"
            :error-messages="errorMessages"
            hide-details="auto"
            label="Max"
            :model-value="rangeValue.max"
            :type="propertyInputType"
            variant="outlined"
            @update:model-value="onRangeMaxInput"
          />
        </v-col>
      </v-row>
    </div>
  </FormField>
</template>

<script lang="ts" setup>
  import type { FormStateValue, RangeFormValue } from '../../types/form'
  import type { TemplateElement } from '../../types/template'
  import ISO6391 from 'iso-639-1'
  import { computed } from 'vue'
  import {
    isRepeatableElement, isRequiredElement,
  } from '../../utils/cardinalityUtils'
  import * as checkTemplateFields from '../../utils/checkTemplateFields'
  import { asFile, asLangStrings, asRangeFormValue, asString, asStringArray, formatLabel } from '../../utils/formFieldUtils'
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
  import { isEmptyFormValue } from '../../utils/validationUtils'
  import FormField from '../FormField.vue'

  const props = defineProps<{
    element: TemplateElement
    modelValue: FormStateValue
    showValidation?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: FormStateValue): void
  }>()

  const languageOptions = computed(() => {
    return ISO6391.getLanguages(ISO6391.getAllCodes())
  })
  // computed values
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
    if (!checkTemplateFields.isPropertyElement(props.element) && !checkTemplateFields.isRangeElement(props.element)) {
      return 'text'
    }

    return getPropertyInputType(props.element)
  })

  const errorMessages = computed<string[]>(() => {
    return hasRequiredError.value ? ['This field is required.'] : []
  })

  const hasRequiredError = computed<boolean>(() => {
    if (!props.showValidation) {
      return false
    }

    if (!isRequiredElement(props.element)) {
      return false
    }

    return isEmptyFormValue(props.modelValue)
  })

  const rangeValue = computed<RangeFormValue>(() => {
    return asRangeFormValue(props.modelValue)
  })

  const isBooleanProperty = computed<boolean>(() => {
    return (
      checkTemplateFields.isPropertyElement(props.element) && props.element.valueType === 'xs:boolean'
    )
  })
  const booleanValue = computed<boolean>(() => {
    return asString(props.modelValue) === 'true'
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
    emit('update:modelValue', updateLangStringLanguage(
      multiLanguageValue.value,
      index,
      value ?? '',
    ))
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
  function onRangeMinInput (value: string | null): void {
    emit('update:modelValue', {
      ...rangeValue.value,
      min: value ?? '',
    })
  }
  function onRangeMaxInput (value: string | null): void {
    emit('update:modelValue', {
      ...rangeValue.value,
      max: value ?? '',
    })
  }
  function onBooleanInput (value: boolean | null): void {
    emit('update:modelValue', value ? 'true' : 'false')
  }
  function langFilter (value: string, query: string): boolean {
    if (!query || query === '') {
      return true
    }

    const queryLower = query.toLowerCase()

    const matchingLanguage = languageOptions.value.find(lang => {
      const nameMatch = lang.name.toLowerCase().includes(queryLower)
      const codeMatch = lang.code.toLowerCase().includes(queryLower)
      return nameMatch || codeMatch
    })

    if (matchingLanguage) {
      if (
        typeof value === 'string'
        && (
          value.toLowerCase() === matchingLanguage.code.toLowerCase()
          || value.toLowerCase() === matchingLanguage.name.toLowerCase()
        )
      ) {
        return true
      }

      if (
        typeof value === 'string'
        && (
          value.toLowerCase().includes(queryLower)
          || queryLower.includes(value.toLowerCase())
        )
      ) {
        return true
      }
    }

    if (typeof value === 'string') {
      return value.toLowerCase().includes(queryLower)
    }

    return false
  }
</script>
