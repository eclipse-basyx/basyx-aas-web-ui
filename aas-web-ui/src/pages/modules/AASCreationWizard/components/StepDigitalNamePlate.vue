<template>
  <v-container class="py-6">
    <v-sheet border class="pa-6" elevation="4" rounded="lg">
      <v-form ref="formRef" @submit.prevent="saveAndNext">
        <v-row>
          <!-- <v-col cols="12">
            <div class="mb-6">
              <div class="text-h6 font-weight-bold">Digital Nameplate</div>
              <div class="text-body-2 text-medium-emphasis">
                Nameplate information attached to the product
              </div>
            </div>
          </v-col> -->
          <v-col>
            <NameplateRenderer
              :elements="templateData.submodelElements"
              :form-state="formValues"
              :show-validation="hasAttemptedSubmit"
              @update:form-state="onFormStateUpdate"
            />
          </v-col>
          <v-col class="d-flex justify-space-between mt-4" cols="12">
            <v-btn color="primary" @click="props.prev"> Back </v-btn>

            <v-btn color="primary" type="submit"> Next </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-sheet>
  </v-container>
</template>
<script lang="ts" setup>
  import type { FormStateObject } from '../types/form'
  import type { DigitalNameplateTemplate } from '../types/template'
  import { onMounted, ref } from 'vue'
  import { buildDigitalNameplate } from '../builders/buildDigitalNameplate'
  import { useAASCreationStore } from '../stores/aasCreationForm'
  import template from '../templates/digital-nameplate.json'
  import { createInitialFormState } from '../utils/createInitialFormState'
  import { normalizeTemplate } from '../utils/normalizeTemplate'
  import { validateTemplateElements } from '../utils/validationUtils'
  import NameplateRenderer from './renderer/NameplateRenderer.vue'

  const props = defineProps<{
    next: () => void
    prev: () => void
    isActiveComponent: boolean
  }>()

  const store = useAASCreationStore()
  const formRef = ref()
  const hasAttemptedSubmit = ref(false)

  // const templateData = template as DigitalNameplateTemplate
  const rawTemplate = template as DigitalNameplateTemplate
  const templateData = normalizeTemplate(rawTemplate)
  const formValues = ref<FormStateObject>(createInitialFormState(templateData))

  onMounted(() => {
    console.log('templatedata is', templateData)
    console.log('formvalues is', formValues)
    // const existingData = store.digitalNameplateData;
    const initialState = createInitialFormState(templateData)
    console.log('initial digital nameplate form state:', initialState)
    // for (const element of templateData.submodelElements) {
    //     const storedElement = existingData?.submodelElements?.find((item) => item.idShort === element.idShort);
    //     formValues[element.idShort] = storedElement?.value ?? '';
    // }
  })
  // Function to save form values from UI into central store
  async function saveAndNext (): Promise<void> {
    console.log('saveAndNext clicked')

    if (!props.isActiveComponent) {
      return
    }

    hasAttemptedSubmit.value = true

    const validationResult = validateTemplateElements(
      templateData.submodelElements,
      formValues.value,
    )
    if (validationResult.isValid) {
      console.log('validation passed successfully')
    }

    if (!validationResult.isValid) {
      console.log('Digital Nameplate validation failed:', validationResult.issues)
      return
    }

    const savedFormState = structuredClone(formValues.value)
    store.saveDigitalNameplateFormState(savedFormState)

    const builtDigitalNameplate = buildDigitalNameplate(structuredClone(formValues.value))
    store.saveDigitalNameplateData(builtDigitalNameplate)

    props.next()
  }

  function onFormStateUpdate (value: FormStateObject): void {
    formValues.value = value
  }
</script>
