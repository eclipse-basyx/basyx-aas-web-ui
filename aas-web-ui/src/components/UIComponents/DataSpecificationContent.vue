<template>
  <v-container class="pa-0" fluid>
    <v-sheet v-if="hasContent" border class="pa-3" rounded>
      <div class="d-flex align-center mb-3">
        <v-icon class="mr-2" color="primary" size="small">mdi-file-document-outline</v-icon>
        <div class="text-title-small">{{ 'Data Specification Content' }}</div>

        <v-spacer />

        <v-chip v-if="modelType" color="primary" label size="x-small">
          {{ modelType }}
        </v-chip>
      </div>

      <div
        v-if="textFields.length > 0"
        :style="fieldGridStyle"
      >
        <v-sheet
          v-for="field in textFields"
          :key="field.label"
          border
          class="h-100 pa-2"
          rounded
        >
          <div class="text-body-small text-subtitleText">{{ field.label }}</div>

          <v-chip
            v-if="field.chip"
            class="mt-1"
            color="primary"
            label
            size="x-small"
          >
            {{ field.value }}
          </v-chip>

          <div v-else class="mt-1 text-body-small text-break">
            {{ field.value }}
          </div>
        </v-sheet>
      </div>

      <v-sheet
        v-if="languageValues(dataSpecificationObject.preferredName).length > 0"
        border
        class="mt-2 pa-2"
        rounded
      >
        <div class="mb-1 text-body-small text-subtitleText">{{ 'Preferred Name' }}</div>

        <div
          v-for="(preferredName, index) in languageValues(dataSpecificationObject.preferredName)"
          :key="'preferred-name-' + index"
          class="d-flex align-start py-1"
        >
          <v-chip border class="mr-2 flex-shrink-0" label size="x-small">
            {{ languageLabel(preferredName.language) }}
          </v-chip>

          <span class="text-body-small text-break">{{ preferredName.text }}</span>
        </div>
      </v-sheet>

      <v-sheet
        v-if="languageValues(dataSpecificationObject.shortName).length > 0"
        border
        class="mt-2 pa-2"
        rounded
      >
        <div class="mb-1 text-body-small text-subtitleText">{{ 'Short Name' }}</div>

        <div
          v-for="(shortName, index) in languageValues(dataSpecificationObject.shortName)"
          :key="'short-name-' + index"
          class="d-flex align-start py-1"
        >
          <v-chip border class="mr-2 flex-shrink-0" label size="x-small">
            {{ languageLabel(shortName.language) }}
          </v-chip>

          <span class="text-body-small text-break">{{ shortName.text }}</span>
        </div>
      </v-sheet>

      <v-sheet
        v-if="languageValues(dataSpecificationObject.definition).length > 0"
        border
        class="mt-2 pa-2"
        rounded
      >
        <div class="mb-1 text-body-small text-subtitleText">{{ 'Definition' }}</div>

        <div
          v-for="(definition, index) in languageValues(dataSpecificationObject.definition)"
          :key="'definition-' + index"
          class="d-flex align-start py-1"
        >
          <v-chip border class="mr-2 flex-shrink-0" label size="x-small">
            {{ languageLabel(definition.language) }}
          </v-chip>

          <span class="text-body-small text-break">{{ definition.text }}</span>
        </div>
      </v-sheet>

      <v-sheet v-if="referenceKeys(dataSpecificationObject.unitId).length > 0" border class="mt-2 pa-2" rounded>
        <div class="mb-1 text-body-small text-subtitleText">{{ 'Unit ID' }}</div>

        <div
          v-for="(unitId, index) in referenceKeys(dataSpecificationObject.unitId)"
          :key="'unit-id-' + index"
          class="d-flex align-start py-1"
        >
          <v-chip border class="mr-2 flex-shrink-0" label size="x-small">
            {{ formatKeyType(unitId.type) }}
          </v-chip>

          <span class="text-body-small text-break">{{ unitId.value }}</span>
        </div>
      </v-sheet>

      <v-sheet v-if="activeLevelTypes.length > 0" border class="mt-2 pa-2" rounded>
        <div class="mb-2 text-body-small text-subtitleText">{{ 'Level Type' }}</div>

        <v-chip
          v-for="levelType in activeLevelTypes"
          :key="levelType"
          class="mr-2 mb-1"
          color="primary"
          label
          size="x-small"
        >
          {{ levelType }}
        </v-chip>
      </v-sheet>

      <v-sheet v-if="valueReferencePairs.length > 0" border class="mt-2 pa-2" rounded>
        <div class="d-flex align-center mb-2">
          <div class="text-body-small text-subtitleText">{{ 'Value List' }}</div>

          <v-spacer />

          <v-chip border label size="x-small">
            {{ valueReferencePairs.length }}
          </v-chip>
        </div>

        <v-table density="compact">
          <thead>
            <tr>
              <th class="text-left text-body-small text-subtitleText">{{ 'Value' }}</th>
              <th class="text-left text-body-small text-subtitleText">{{ 'Value ID' }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(valueReferencePair, index) in valueReferencePairs" :key="'value-reference-pair-' + index">
              <td class="text-body-small text-break">
                {{ valueReferencePair.value }}
              </td>

              <td>
                <div
                  v-for="(valueId, valueIdIndex) in referenceKeys(valueReferencePair.valueId)"
                  :key="'value-id-' + index + '-' + valueIdIndex"
                  class="d-flex align-start py-1"
                >
                  <v-chip border class="mr-2 flex-shrink-0" label size="x-small">
                    {{ formatKeyType(valueId.type) }}
                  </v-chip>

                  <span class="text-body-small text-break">{{ valueId.value }}</span>
                </div>

                <span
                  v-if="referenceKeys(valueReferencePair.valueId).length === 0"
                  class="text-body-small text-subtitleText"
                >
                  {{ '-' }}
                </span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-sheet>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue'
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { computed } from 'vue'

  type LanguageValue = {
    language?: string | null
    text?: string | null
  }

  type ReferenceKey = {
    type?: string | number | null
    value?: string | null
  }

  type ReferenceValue = {
    keys?: Array<ReferenceKey> | null
  }

  type ValueReferencePair = {
    value?: string | null
    valueId?: ReferenceValue | null
  }

  type LevelTypeValue = {
    min?: boolean | null
    nom?: boolean | null
    typ?: boolean | null
    max?: boolean | null
  }

  type DataSpecificationContentValue = {
    modelType?: string | number | (() => aasTypes.ModelType) | null
    preferredName?: Array<LanguageValue> | null
    shortName?: Array<LanguageValue> | null
    unit?: string | null
    unitId?: ReferenceValue | null
    sourceOfDefinition?: string | null
    symbol?: string | null
    dataType?: aasTypes.DataTypeIec61360 | string | number | null
    definition?: Array<LanguageValue> | null
    valueFormat?: string | null
    valueList?: {
      valueReferencePairs?: Array<ValueReferencePair> | null
    } | null
    value?: string | null
    levelType?: LevelTypeValue | null
  }

  type TextField = {
    label: string
    value: string
    chip?: boolean
  }

  const props = defineProps({
    dataSpecificationObject: {
      type: Object as PropType<DataSpecificationContentValue>,
      default: () => ({}),
    },
  })

  const levelTypeOptions = [
    { key: 'min', label: 'MIN' },
    { key: 'nom', label: 'NOM' },
    { key: 'typ', label: 'TYP' },
    { key: 'max', label: 'MAX' },
  ] as const

  const fieldGridStyle = {
    display: 'grid',
    gap: '8px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
  }

  const hasContent = computed(() => {
    return props.dataSpecificationObject && Object.keys(props.dataSpecificationObject).length > 0
  })

  const modelType = computed(() => {
    const modelTypeValue = props.dataSpecificationObject.modelType
    if (typeof modelTypeValue === 'function') {
      return ''
    }

    if (typeof modelTypeValue === 'number') {
      return aasTypes.ModelType[modelTypeValue] ?? String(modelTypeValue)
    }

    return hasDisplayValue(modelTypeValue) ? String(modelTypeValue) : ''
  })

  const formattedDataType = computed(() => {
    return formatDataType(props.dataSpecificationObject.dataType)
  })

  const textFields = computed<Array<TextField>>(() => {
    return [
      { label: 'Data Type', value: formattedDataType.value, chip: true },
      { label: 'Unit', value: props.dataSpecificationObject.unit ?? '' },
      { label: 'Source of Definition', value: props.dataSpecificationObject.sourceOfDefinition ?? '' },
      { label: 'Symbol', value: props.dataSpecificationObject.symbol ?? '' },
      { label: 'Value Format', value: props.dataSpecificationObject.valueFormat ?? '' },
      { label: 'Value', value: props.dataSpecificationObject.value ?? '' },
    ].filter(field => hasDisplayValue(field.value))
  })

  const activeLevelTypes = computed(() => {
    const levelType = props.dataSpecificationObject.levelType
    if (!levelType) {
      return []
    }

    return levelTypeOptions
      .filter(option => Boolean(levelType[option.key]))
      .map(option => option.label)
  })

  const valueReferencePairs = computed(() => {
    const pairs = props.dataSpecificationObject.valueList?.valueReferencePairs
    if (!Array.isArray(pairs)) {
      return []
    }

    return pairs.filter(pair => hasDisplayValue(pair.value) || referenceKeys(pair.valueId).length > 0)
  })

  function hasDisplayValue (value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== ''
  }

  function languageValues (values?: Array<LanguageValue> | null): Array<LanguageValue> {
    if (!Array.isArray(values)) {
      return []
    }

    return values.filter(value => hasDisplayValue(value.language) || hasDisplayValue(value.text))
  }

  function languageLabel (language?: string | null): string {
    return hasDisplayValue(language) ? String(language) : 'no-lang'
  }

  function referenceKeys (reference?: ReferenceValue | null): Array<ReferenceKey> {
    if (!reference || !Array.isArray(reference.keys)) {
      return []
    }

    return reference.keys.filter(key => hasDisplayValue(key.type) || hasDisplayValue(key.value))
  }

  function formatDataType (dataType?: aasTypes.DataTypeIec61360 | string | number | null): string {
    if (!hasDisplayValue(dataType)) {
      return ''
    }

    if (typeof dataType === 'number') {
      return aasTypes.DataTypeIec61360[dataType] ?? String(dataType)
    }

    return String(dataType)
  }

  function formatKeyType (keyType?: string | number | null): string {
    if (!hasDisplayValue(keyType)) {
      return 'Key'
    }

    if (typeof keyType === 'number') {
      return aasTypes.KeyTypes[keyType] ?? String(keyType)
    }

    return String(keyType)
  }
</script>
