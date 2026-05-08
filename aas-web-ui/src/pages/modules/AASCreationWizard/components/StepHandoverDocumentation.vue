<template>
  <v-col v-if="validationIssues.length >0" cols="12">
    <v-alert
      density="compact"
      type="error"
      variant="tonal"
    >
      Please fill all required fields:
      <span v-for="(issue, index) in validationIssues.slice(0, 5)" :key="issue.path">
        {{ issue.idShort }}<span v-if="index < validationIssues.slice(0, 5).length - 1">, </span>
      </span>
      <span v-if="validationIssues.length > 5">
        and {{ validationIssues.length - 5 }} more...
      </span>
    </v-alert>
  </v-col>
  <v-container class="py-6">
    <v-sheet border class="pa-6" elevation="4" rounded="lg">
      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-row>
          <v-col>
            <SubmodelRenderer
              :elements="templateData.submodelElements"
              :form-state="formValues"
              :show-validation="hasAttemptedSubmit"
              @update:form-state="onFormStateUpdate"
            />
          </v-col>
          <v-col class="d-flex justify-space-between mt-4" cols="12">
            <v-btn color="primary" @click="props.prev">Back</v-btn>
            <v-btn color="primary" :disabled="isSubmitting" @click="handleSubmit">Submit</v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-sheet>
  </v-container>
</template>
<script lang="ts" setup>
  import type { FormStateObject } from '../types/form'
  import type { HandoverDocumentationTemplate } from '../types/template'
  import type { ValidationIssue } from '../types/validation'
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { onMounted, ref } from 'vue'
  import { buildHandoverDocumentation } from '../builders/buildHandoverDocumentation'
  import { useAASCreationSubmission } from '../composables/useAASCreationSubmission'
  import { useAASCreationStore } from '../stores/aasCreationForm'
  import template from '../templates/handover-documentation.json'
  import { createInitialFormState } from '../utils/createInitialFormState'
  import { deepCopyFormState } from '../utils/formFieldUtils'
  import { normalizeHandoverDocumentationTemplate } from '../utils/normalizeTemplate'
  import { validateTemplateElements } from '../utils/validationUtils'
  import SubmodelRenderer from './renderer/SubmodelRenderer.vue'

  const props = defineProps<{
    next: () => void
    prev: () => void
    finish: () => void
    isActiveComponent: boolean
  }>()

  const store = useAASCreationStore()
  const { submitAll } = useAASCreationSubmission()

  const isSubmitting = ref(false)

  const formRef = ref()
  const hasAttemptedSubmit = ref(false)
  const rawTemplate = template as HandoverDocumentationTemplate
  // const templateData = template as unknown as HandoverDocumentationTemplate
  const templateData = normalizeHandoverDocumentationTemplate(rawTemplate)
  const formValues = ref<FormStateObject>(createInitialFormState(templateData))
  const validationIssues = ref<ValidationIssue[]>([])

  onMounted(() => {
    console.log('handover template root elements:', templateData.submodelElements.map(element => ({
      idShort: element.idShort,
      modelType: element.modelType,
      cardinality: element._cardinality,
    })))

    const freshInitialState = createInitialFormState(templateData)
    console.log('fresh handover initial state:', freshInitialState)

    console.log('stored handover form state:', store.handoverDocumentationFormState)
    if (store.handoverDocumentationFormState) {
      formValues.value = deepCopyFormState(store.handoverDocumentationFormState)
    }
    console.log('actual handover formValues after restore:', formValues.value)
    console.log('Handover Documentation Data templatedata is', templateData)
    console.log('Handover Documentation formvalues is', formValues)
    const initialState = createInitialFormState(templateData)
    console.log('initial digital nameplate form state:', initialState)
  })

  async function handleSubmit (): Promise<void> {
    if (!props.isActiveComponent) {
      return
    }
    if (isSubmitting.value) {
      return
    }
    hasAttemptedSubmit.value = true

    const validationResult = validateTemplateElements(
      templateData.submodelElements,
      formValues.value,
    )

    if (!validationResult.isValid) {
      validationIssues.value = validationResult.issues
      console.log('Handover Documentation validation failed:', validationResult.issues)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    validationIssues.value = []

    const rawFormState = deepCopyFormState(formValues.value)

    const builtHandoverDocumentation = buildHandoverDocumentation(rawFormState)
    console.log('builtHandoverDocumentation', builtHandoverDocumentation)

    const handoverParseResult = jsonization.submodelFromJsonable(
      builtHandoverDocumentation as any,
    )

    if (handoverParseResult.error !== null) {
      console.error('Error parsing Handover Documentation submodel:', handoverParseResult.error)
      window.alert('Handover Documentation submodel could not be parsed. Check console.')
      return
    }

    console.log('Handover Documentation parse success:', handoverParseResult.mustValue())

    store.saveHandoverDocumentationFormState(rawFormState)
    store.saveHandoverDocumentationData(builtHandoverDocumentation)

    // store.saveHandoverDocumentationFormState(rawFormState)

    console.log('Handover Documentation validation passed')
    console.log('raw handover form state:', rawFormState)
    console.log('builtHandoverDocumentation:', builtHandoverDocumentation)

    isSubmitting.value = true
    console.log('must now call the submitAll()')
    try {
      const success = await submitAll()
      if (!success) {
        window.alert('Submission failed')
        return
      }

      window.alert('Submission was successful.')
      store.resetCreationState()
      props.finish()
    } finally {
      isSubmitting.value = false
    }
  }
  function onFormStateUpdate (value: FormStateObject): void {
    formValues.value = value
    console.log('handover documents updated:', value.Documents)
  }
</script>
