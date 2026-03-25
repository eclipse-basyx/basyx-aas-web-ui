<template>
  <v-sheet
    v-for="(embeddedDataSpecification, index) in embeddedDataSpecificationsValue ?? []"
    :key="index"
    border
    class="mb-4"
    rounded
  >
    <v-card-actions class="bg-cardHeader">
      <div class="ml-2">Embedded Data Specification {{ index + 1 }}</div>
      <v-spacer />
      <v-btn

        prepend-icon="mdi-delete"
        text="Remove"
        variant="text"
        @click="removeEmbeddedDataSpecification(index)"
      />
    </v-card-actions>
    <v-divider />
    <v-card-text class="pt-7">
      <!-- Data Specification (Reference) -->
      <v-row align="center">
        <v-col class="py-0">
          <ReferenceInput v-model="embeddedDataSpecification.dataSpecification" label="Data Specification" />
        </v-col>
      </v-row>
      <!-- Content Type (Currently only IEC 61360 is supported) -->
      <v-row align="center">
        <v-col class="py-0">
          <v-select
            density="comfortable"
            :items="contentTypeOptions"
            label="Content Type"
            :model-value="getContentType(embeddedDataSpecification)"
            variant="outlined"
            @update:model-value="setContentType(index, $event)"
          />
        </v-col>
      </v-row>
      <!-- IEC 61360 Content -->
      <template v-if="isIec61360Content(embeddedDataSpecification)">
        <!-- Preferred Name -->
        <v-row align="center">
          <v-col class="py-0">
            <MultiLanguageTextInput
              v-model="embeddedDataSpecification.dataSpecificationContent.preferredName"
              label="Preferred Name"
              :show-label="true"
              type="preferredNameIec61360"
            />
          </v-col>
        </v-row>
        <!-- Short Name -->
        <v-row align="center">
          <v-col class="py-0">
            <MultiLanguageTextInput
              v-model="embeddedDataSpecification.dataSpecificationContent.shortName"
              label="Short Name"
              :show-label="true"
              type="shortNameIec61360"
            />
          </v-col>
        </v-row>
        <!-- Data Type -->
        <v-row align="center">
          <v-col class="py-0">
            <v-select
              v-model="embeddedDataSpecification.dataSpecificationContent.dataType"
              clearable
              density="comfortable"
              :items="dataTypeIec61360Options"
              label="Data Type"
              variant="outlined"
            />
          </v-col>
        </v-row>
        <!-- Unit -->
        <v-row align="center">
          <v-col class="py-0">
            <TextInput v-model="embeddedDataSpecification.dataSpecificationContent.unit" label="Unit" />
          </v-col>
        </v-row>
        <!-- Unit ID (Reference) -->
        <v-row align="center">
          <v-col class="py-0">
            <v-divider />
            <v-list-item class="pl-0 pt-0">
              <template #title>
                <div class="text-title-small">Unit ID</div>
              </template>
            </v-list-item>
            <v-btn
              v-if="embeddedDataSpecification.dataSpecificationContent.unitId === null"
              class="mt-1 mb-4"
              color="primary"
              prepend-icon="mdi-plus"
              text="Add Unit ID"
              variant="outlined"
              @click="addUnitId(index)"
            />
            <ReferenceInput
              v-else
              v-model="embeddedDataSpecification.dataSpecificationContent.unitId"
              label="Unit ID"
              :no-header="true"
            />
          </v-col>
        </v-row>
        <!-- Source of Definition -->
        <v-row align="center">
          <v-col class="py-0">
            <TextInput
              v-model="embeddedDataSpecification.dataSpecificationContent.sourceOfDefinition"
              label="Source Of Definition"
            />
          </v-col>
        </v-row>
        <!-- Symbol -->
        <v-row align="center">
          <v-col class="py-0">
            <TextInput v-model="embeddedDataSpecification.dataSpecificationContent.symbol" label="Symbol" />
          </v-col>
        </v-row>
        <!-- Definition -->
        <v-row align="center">
          <v-col class="py-0">
            <MultiLanguageTextInput
              v-model="embeddedDataSpecification.dataSpecificationContent.definition"
              label="Definition"
              :show-label="true"
              type="definitionIec61360"
            />
          </v-col>
        </v-row>
        <!-- Value Format -->
        <v-row align="center">
          <v-col class="py-0">
            <TextInput
              v-model="embeddedDataSpecification.dataSpecificationContent.valueFormat"
              label="Value Format"
            />
          </v-col>
        </v-row>
        <!-- Value -->
        <v-row align="center">
          <v-col class="py-0">
            <TextInput v-model="embeddedDataSpecification.dataSpecificationContent.value" label="Value" />
          </v-col>
        </v-row>
        <!-- Value List -->
        <v-row align="center">
          <v-col class="py-0">
            <v-divider />
            <v-list-item class="pl-0 pt-0">
              <template #title>
                <div class="text-title-small">Value List</div>
              </template>
            </v-list-item>
            <v-btn
              v-if="embeddedDataSpecification.dataSpecificationContent.valueList === null"
              class="mt-1 mb-4"
              color="primary"
              prepend-icon="mdi-plus"
              text="Add Value List"
              variant="outlined"
              @click="initializeValueList(index)"
            />
            <template v-else>
              <v-sheet
                v-for="(valueReferencePair, valueReferencePairIndex) in embeddedDataSpecification
                  .dataSpecificationContent.valueList.valueReferencePairs"
                :key="valueReferencePairIndex"
                border
                class="mb-4"
                rounded
              >
                <v-card-text class="pt-4">
                  <TextInput
                    v-model="valueReferencePair.value"
                    label="Value"
                    :show-delete-button="true"
                    @click:delete="removeValueReferencePair(index, valueReferencePairIndex)"
                  />
                  <v-row align="center">
                    <v-col class="py-0">
                      <v-btn
                        v-if="valueReferencePair.valueId === null"
                        class="mt-1 mb-4"
                        color="primary"
                        prepend-icon="mdi-plus"
                        text="Add Value ID"
                        variant="outlined"
                        @click="
                          addValueReferencePairValueId(index, valueReferencePairIndex)
                        "
                      />
                      <ReferenceInput
                        v-else
                        v-model="valueReferencePair.valueId"
                        label="Value ID"
                        :no-header="true"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-sheet>
              <v-btn
                class="mt-1 mb-4"
                color="primary"
                prepend-icon="mdi-plus"
                text="Add Value Pair"
                variant="outlined"
                @click="addValueReferencePair(index)"
              />
            </template>
          </v-col>
        </v-row>
        <!-- Level Type -->
        <v-row align="center">
          <v-col class="py-0">
            <v-divider />
            <v-list-item class="pl-0 pt-0">
              <template #title>
                <div class="text-title-small">Level Type</div>
              </template>
            </v-list-item>
            <v-btn
              v-if="embeddedDataSpecification.dataSpecificationContent.levelType === null"
              class="mt-1 mb-4"
              color="primary"
              prepend-icon="mdi-plus"
              text="Add Level Type"
              variant="outlined"
              @click="initializeLevelType(index)"
            />
            <v-row v-else class="mb-3 mx-n1" no-gutters>
              <v-col class="pa-1" cols="6">
                <v-sheet border class="pl-1" rounded>
                  <v-checkbox
                    v-model="embeddedDataSpecification.dataSpecificationContent.levelType.min"
                    hide-details
                    label="Min"
                  />
                </v-sheet>
              </v-col>
              <v-col class="pa-1" cols="6">
                <v-sheet border class="pl-1" rounded>
                  <v-checkbox
                    v-model="embeddedDataSpecification.dataSpecificationContent.levelType.nom"
                    hide-details
                    label="Nom"
                  />
                </v-sheet>
              </v-col>
              <v-col class="pa-1" cols="6">
                <v-sheet border class="pl-1" rounded>
                  <v-checkbox
                    v-model="embeddedDataSpecification.dataSpecificationContent.levelType.typ"
                    hide-details
                    label="Typ"
                  />
                </v-sheet>
              </v-col>
              <v-col class="pa-1" cols="6">
                <v-sheet border class="pl-1" rounded>
                  <v-checkbox
                    v-model="embeddedDataSpecification.dataSpecificationContent.levelType.max"
                    hide-details
                    label="Max"
                  />
                </v-sheet>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </template>

      <v-alert
        v-else
        class="mt-2"
        text="The existing content type is currently not editable. Select IEC 61360 to replace it."
        type="warning"
        variant="tonal"
      />
    </v-card-text>
  </v-sheet>

  <v-btn
    class="mt-1 mb-4"
    color="primary"
    prepend-icon="mdi-plus"
    text="Add Embedded Data Specification"
    variant="outlined"
    @click="addEmbeddedDataSpecification"
  />
</template>

<script setup lang="ts">
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, ref, watch } from 'vue'

  const IEC_61360_DATA_SPEC_IRI = 'https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0'

  type ContentType = 'DataSpecificationIec61360' | 'Unsupported'

  const props = defineProps<{
    modelValue: Array<aasTypes.EmbeddedDataSpecification> | null
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: Array<aasTypes.EmbeddedDataSpecification> | null): void
  }>()

  const embeddedDataSpecificationsValue = ref<Array<aasTypes.EmbeddedDataSpecification> | null>(props.modelValue)

  const contentTypeOptions = [{ title: 'IEC 61360', value: 'DataSpecificationIec61360' }]

  const dataTypeIec61360Options = computed(() => {
    return Object.entries(aasTypes.DataTypeIec61360)
      .filter(([, value]) => typeof value === 'number')
      .map(([title, value]) => ({
        title,
        value: value as aasTypes.DataTypeIec61360,
      }))
  })

  watch(
    embeddedDataSpecificationsValue,
    newValue => {
      emit('update:modelValue', newValue)
    },
    { deep: true },
  )

  watch(
    () => props.modelValue,
    newValue => {
      embeddedDataSpecificationsValue.value = newValue
    },
  )

  function createDefaultDataSpecificationReference (): aasTypes.Reference {
    return new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
      new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, IEC_61360_DATA_SPEC_IRI),
    ])
  }

  function createDefaultIec61360Content (): aasTypes.DataSpecificationIec61360 {
    return new aasTypes.DataSpecificationIec61360([])
  }

  function addEmbeddedDataSpecification (): void {
    if (embeddedDataSpecificationsValue.value === null) {
      embeddedDataSpecificationsValue.value = []
    }

    embeddedDataSpecificationsValue.value.push(
      new aasTypes.EmbeddedDataSpecification(
        createDefaultDataSpecificationReference(),
        createDefaultIec61360Content(),
      ),
    )
  }

  function removeEmbeddedDataSpecification (index: number): void {
    if (embeddedDataSpecificationsValue.value === null || !embeddedDataSpecificationsValue.value[index]) {
      return
    }

    embeddedDataSpecificationsValue.value.splice(index, 1)
    if (embeddedDataSpecificationsValue.value.length === 0) {
      embeddedDataSpecificationsValue.value = null
    }
  }

  function isIec61360Content (
    embeddedDataSpecification: aasTypes.EmbeddedDataSpecification,
  ): embeddedDataSpecification is aasTypes.EmbeddedDataSpecification & {
    dataSpecificationContent: aasTypes.DataSpecificationIec61360
  } {
    return embeddedDataSpecification.dataSpecificationContent instanceof aasTypes.DataSpecificationIec61360
  }

  function getContentType (embeddedDataSpecification: aasTypes.EmbeddedDataSpecification): ContentType {
    if (isIec61360Content(embeddedDataSpecification)) {
      return 'DataSpecificationIec61360'
    }

    return 'Unsupported'
  }

  function setContentType (index: number, contentType: ContentType): void {
    if (embeddedDataSpecificationsValue.value === null || !embeddedDataSpecificationsValue.value[index]) {
      return
    }

    if (contentType === 'DataSpecificationIec61360') {
      embeddedDataSpecificationsValue.value[index].dataSpecificationContent = createDefaultIec61360Content()
    }
  }

  function addUnitId (index: number): void {
    const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index]
    if (!embeddedDataSpecification || !isIec61360Content(embeddedDataSpecification)) {
      return
    }

    embeddedDataSpecification.dataSpecificationContent.unitId = new aasTypes.Reference(
      aasTypes.ReferenceTypes.ExternalReference,
      [new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, '')],
    )
  }

  function initializeValueList (index: number): void {
    const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index]
    if (!embeddedDataSpecification || !isIec61360Content(embeddedDataSpecification)) {
      return
    }

    embeddedDataSpecification.dataSpecificationContent.valueList = new aasTypes.ValueList([
      new aasTypes.ValueReferencePair(''),
    ])
  }

  function addValueReferencePair (index: number): void {
    const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index]
    if (
      !embeddedDataSpecification
      || !isIec61360Content(embeddedDataSpecification)
      || embeddedDataSpecification.dataSpecificationContent.valueList === null
    ) {
      return
    }

    embeddedDataSpecification.dataSpecificationContent.valueList.valueReferencePairs.push(
      new aasTypes.ValueReferencePair(''),
    )
  }

  function removeValueReferencePair (index: number, valueReferencePairIndex: number): void {
    const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index]
    if (
      !embeddedDataSpecification
      || !isIec61360Content(embeddedDataSpecification)
      || embeddedDataSpecification.dataSpecificationContent.valueList === null
    ) {
      return
    }

    embeddedDataSpecification.dataSpecificationContent.valueList.valueReferencePairs.splice(
      valueReferencePairIndex,
      1,
    )
  }

  function addValueReferencePairValueId (index: number, valueReferencePairIndex: number): void {
    const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index]
    if (
      !embeddedDataSpecification
      || !isIec61360Content(embeddedDataSpecification)
      || embeddedDataSpecification.dataSpecificationContent.valueList === null
    ) {
      return
    }

    const valueReferencePair
      = embeddedDataSpecification.dataSpecificationContent.valueList.valueReferencePairs[valueReferencePairIndex]
    if (!valueReferencePair) {
      return
    }

    valueReferencePair.valueId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
      new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, ''),
    ])
  }

  function initializeLevelType (index: number): void {
    const embeddedDataSpecification = embeddedDataSpecificationsValue.value?.[index]
    if (!embeddedDataSpecification || !isIec61360Content(embeddedDataSpecification)) {
      return
    }

    embeddedDataSpecification.dataSpecificationContent.levelType = new aasTypes.LevelType(
      false,
      false,
      false,
      false,
    )
  }
</script>
