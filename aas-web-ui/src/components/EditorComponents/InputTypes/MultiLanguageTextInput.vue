<template>
  <v-divider v-if="showLabel" />
  <v-list-item v-if="showLabel" class="pl-0 pt-0">
    <template #title>
      <div class="text-title-small">{{ label }}</div>
    </template>
  </v-list-item>
  <v-list-item v-for="(langStringElement, i) in langStringValue" :key="i" class="px-0">
    <template #prepend>
      <v-combobox
        v-model="langStringElement.language"
        class="mr-3"
        clearable
        :custom-filter="langFilter"
        density="comfortable"
        item-title="name"
        item-value="code"
        :items="languageOptions"
        label="Language"
        :return-object="false"
        single-line
        variant="outlined"
        :width="200"
      >
        <template #selection="{ item }">
          <span>{{ item.value }}</span>
        </template>
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps">
            <template #append>
              <span class="ml-2">{{ item.value }}</span>
            </template>
          </v-list-item>
        </template>
      </v-combobox>
    </template>
    <v-text-field
      v-model="langStringElement.text"
      append-icon="mdi-delete"
      density="comfortable"
      variant="outlined"
      @click:append="deleteLangStringElement(langStringElement)"
    />
  </v-list-item>
  <v-btn
    class="mt-1 mb-4"
    color="primary"
    prepend-icon="mdi-plus"
    text="Add"
    variant="outlined"
    @click="addLangStringName"
  />
</template>

<script lang="ts" setup>
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import ISO6391 from 'iso-639-1'
  import { computed, ref, watch } from 'vue'

  // Type Map for supported types
  type ValueMap = {
    displayName: Array<aasTypes.LangStringNameType>
    description: Array<aasTypes.LangStringTextType>
    text: Array<aasTypes.LangStringTextType>
    preferredNameIec61360: Array<aasTypes.LangStringPreferredNameTypeIec61360>
    shortNameIec61360: Array<aasTypes.LangStringShortNameTypeIec61360>
    definitionIec61360: Array<aasTypes.LangStringDefinitionTypeIec61360>
  }

  type ValueType<T extends keyof ValueMap> = ValueMap[T]

  type PropsWithLabel = {
    showLabel: true
    label: string
    type: keyof ValueMap
    modelValue: ValueType<keyof ValueMap> | null
  }

  type PropsWithoutLabel = {
    showLabel: false
    label?: string
    type: keyof ValueMap
    modelValue: ValueType<keyof ValueMap> | null
  }

  const props = defineProps<PropsWithLabel | PropsWithoutLabel>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: ValueType<typeof props.type> | null): void
  }>()

  const langStringValue = ref<ValueType<typeof props.type> | null>(props.modelValue)

  const languageOptions = computed(() => {
    return ISO6391.getLanguages(ISO6391.getAllCodes())
  })

  watch(langStringValue, newValue => {
    emit('update:modelValue', newValue)
  })

  watch(
    () => props.modelValue,
    newValue => {
      langStringValue.value = newValue
    },
  )

  function addLangStringName (): void {
    // check if null and create new array
    if (langStringValue.value === null) {
      langStringValue.value = []
    }
    switch (props.type) {
      case 'displayName': {
        langStringValue.value.push(new aasTypes.LangStringNameType('', ''))

        break
      }
      case 'description': {
        langStringValue.value.push(new aasTypes.LangStringTextType('', ''))

        break
      }
      case 'text': {
        langStringValue.value.push(new aasTypes.LangStringTextType('', ''))

        break
      }
      case 'preferredNameIec61360': {
        langStringValue.value.push(new aasTypes.LangStringPreferredNameTypeIec61360('', ''))

        break
      }
      case 'shortNameIec61360': {
        langStringValue.value.push(new aasTypes.LangStringShortNameTypeIec61360('', ''))

        break
      }
      case 'definitionIec61360': {
        langStringValue.value.push(new aasTypes.LangStringDefinitionTypeIec61360('', ''))

        break
      }
    // No default
    }
  }

  function deleteLangStringElement (
    langStringElement:
      | aasTypes.LangStringNameType
      | aasTypes.LangStringTextType
      | aasTypes.LangStringPreferredNameTypeIec61360
      | aasTypes.LangStringShortNameTypeIec61360
      | aasTypes.LangStringDefinitionTypeIec61360,
  ): void {
    const index = langStringValue.value?.indexOf(langStringElement)
    if (index !== undefined && index !== null) {
      langStringValue.value?.splice(index, 1)
    }
  }

  function langFilter (value: string, query: string): boolean {
    // First make sure there's a query
    if (!query || query === '') return true

    const queryLower = query.toLowerCase()

    // For the ISO language items (searching through all options)
    const matchingLanguage = languageOptions.value.find(lang => {
      const nameMatch = lang.name.toLowerCase().includes(queryLower)
      const codeMatch = lang.code.toLowerCase().includes(queryLower)
      return nameMatch || codeMatch
    })

    if (matchingLanguage) {
      // If the current value matches one of our matches, return true
      if (
        typeof value === 'string'
        && (value.toLowerCase() === matchingLanguage.code.toLowerCase()
          || value.toLowerCase() === matchingLanguage.name.toLowerCase())
      ) {
        return true
      }

      // If we're still typing and our input might match
      // Return true if value includes the query or query includes value
      if (
        typeof value === 'string'
        && (value.toLowerCase().includes(queryLower) || queryLower.includes(value.toLowerCase()))
      ) {
        return true
      }
    }

    // Default fallback to the simple string matching
    if (typeof value === 'string') {
      return value.toLowerCase().includes(queryLower)
    }

    return false
  }
</script>
