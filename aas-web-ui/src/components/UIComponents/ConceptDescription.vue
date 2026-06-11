<template>
  <v-container class="pa-0" fluid>
    <v-card v-if="conceptDescriptionObject && Object.keys(conceptDescriptionObject).length > 0">
      <div :class="small ? 'pa-4' : 'px-4 py-4'">
        <v-sheet
          :border="!small"
          :class="small ? 'pa-0' : 'pa-3'"
          :rounded="!small"
        >
          <div v-if="!small" class="d-flex align-center mb-3">
            <v-icon class="mr-2" color="primary" size="small">mdi-book-open-variant</v-icon>
            <div class="text-title-small text-break">{{ conceptDescriptionTitle }}</div>

            <v-spacer />

            <v-chip v-if="modelType" color="primary" label size="x-small">
              {{ modelType }}
            </v-chip>
          </div>

          <div
            v-if="identificationFields.length > 0"
            :style="identificationGridStyle"
          >
            <v-sheet
              v-for="field in identificationFields"
              :key="field.label"
              border
              class="h-100 pa-2"
              rounded
            >
              <div class="text-body-small text-subtitleText">{{ field.label }}</div>

              <div class="mt-1 text-body-small text-break">
                {{ field.value }}
              </div>
            </v-sheet>
          </div>

          <v-sheet v-if="displayNameValues.length > 0" border class="mt-2 pa-2" rounded>
            <div class="mb-1 text-body-small text-subtitleText">{{ 'Display Name' }}</div>

            <div
              v-for="(displayName, index) in displayNameValues"
              :key="'display-name-' + index"
              class="d-flex align-start py-1"
            >
              <v-chip border class="mr-2 flex-shrink-0" label size="x-small">
                {{ languageLabel(displayName.language) }}
              </v-chip>

              <span class="text-body-small text-break">{{ displayName.text }}</span>
            </div>
          </v-sheet>

          <v-sheet v-if="descriptionValues.length > 0" border class="mt-2 pa-2" rounded>
            <div class="mb-1 text-body-small text-subtitleText">{{ 'Description' }}</div>

            <div
              v-for="(description, index) in descriptionValues"
              :key="'description-' + index"
              class="d-flex align-start py-1"
            >
              <v-chip border class="mr-2 flex-shrink-0" label size="x-small">
                {{ languageLabel(description.language) }}
              </v-chip>

              <span class="text-body-small text-break">{{ description.text }}</span>
            </div>
          </v-sheet>
        </v-sheet>
      </div>

      <v-divider v-if="hasEmbeddedDataSpecifications" />

      <div v-if="hasEmbeddedDataSpecifications" class="px-4 pt-3 pb-4">
        <div class="d-flex align-center mb-2">
          <v-icon class="mr-2" color="primary" size="small">mdi-database-outline</v-icon>
          <div class="text-title-small">{{ 'Embedded Data Specifications' }}</div>

          <v-spacer />

          <v-chip border label size="x-small">
            {{ embeddedDataSpecifications.length }}
          </v-chip>
        </div>

        <v-sheet
          v-for="(embeddedDataSpecification, i) in embeddedDataSpecifications"
          :key="i"
          border
          class="bg-elevatedCard mt-2 pa-3"
          rounded
        >
          <div class="mb-2 text-body-small text-subtitleText">
            {{ embeddedDataSpecificationTitle(i) }}
          </div>

          <!-- hasDataSpecification -->
          <SemanticID
            v-if="
              embeddedDataSpecification.dataSpecification &&
                embeddedDataSpecification.dataSpecification.keys &&
                embeddedDataSpecification.dataSpecification.keys.length > 0
            "
            class="mb-2"
            :semantic-id-object="embeddedDataSpecification.dataSpecification"
            :semantic-title="'Data Specification'"
            :small="true"
          />

          <v-divider
            v-if="
              embeddedDataSpecification.dataSpecification &&
                embeddedDataSpecification.dataSpecification.keys &&
                embeddedDataSpecification.dataSpecification.keys.length > 0 &&
                embeddedDataSpecification.dataSpecificationContent
            "
            class="my-2"
          />
          <!-- dataSpecificationContent -->
          <DataSpecificationContent
            v-if="embeddedDataSpecification.dataSpecificationContent"
            :data-specification-object="
              embeddedDataSpecification.dataSpecificationContent
            "
          />
        </v-sheet>
      </div>
      <!-- Last Sync -->
      <v-divider />
      <LastSync :timestamp="conceptDescriptionObject.timestamp" />
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  type LanguageValue = {
    language?: string | null
    text?: string | null
  }

  type IdentificationField = {
    label: string
    value: string
  }

  const props = defineProps({
    small: {
      type: Boolean,
      default: false,
    },
    conceptDescriptionObject: {
      type: Object as any,
      default: () => ({}),
    },
  })

  const identificationGridStyle = {
    display: 'grid',
    gap: '8px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
  }

  const conceptDescriptionTitle = computed(() => {
    const englishDisplayName = languageValues(props.conceptDescriptionObject?.displayName).find(
      displayName => displayName.language === 'en' && hasDisplayValue(displayName.text),
    )

    if (englishDisplayName?.text) {
      return englishDisplayName.text
    }

    if (hasDisplayValue(props.conceptDescriptionObject?.idShort)) {
      return props.conceptDescriptionObject.idShort
    }

    if (hasDisplayValue(props.conceptDescriptionObject?.id)) {
      return props.conceptDescriptionObject.id
    }

    return 'Concept Description'
  })

  const modelType = computed(() => {
    return hasDisplayValue(props.conceptDescriptionObject?.modelType)
      ? String(props.conceptDescriptionObject.modelType)
      : 'ConceptDescription'
  })

  const identificationFields = computed<Array<IdentificationField>>(() => {
    return [
      { label: 'Identification (ID)', value: props.conceptDescriptionObject?.id ?? '' },
      { label: 'ID short', value: props.conceptDescriptionObject?.idShort ?? '' },
    ].filter(field => hasDisplayValue(field.value))
  })

  const displayNameValues = computed(() => languageValues(props.conceptDescriptionObject?.displayName))
  const descriptionValues = computed(() => languageValues(props.conceptDescriptionObject?.description))

  const embeddedDataSpecifications = computed(() => {
    return Array.isArray(props.conceptDescriptionObject?.embeddedDataSpecifications)
      ? props.conceptDescriptionObject.embeddedDataSpecifications
      : []
  })

  const hasEmbeddedDataSpecifications = computed(() => embeddedDataSpecifications.value.length > 0)

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

  function embeddedDataSpecificationTitle (index: string | number): string {
    return `Embedded Data Specification ${Number(index) + 1}`
  }
</script>
