<template>
  <v-col v-if="validationIssues.length >0" cols="12">
    <v-alert
      closable
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
      <v-form ref="formRef" @submit.prevent="saveAndNext">
        <v-row>
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
  import type { ValidationIssue } from '../types/validation'
  import { onMounted, ref, toRaw } from 'vue'
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
  const validationIssues = ref<ValidationIssue[]>([])

  onMounted(() => {
    console.log('templatedata is', templateData)
    console.log('formvalues is', formValues)
    const initialState = createInitialFormState(templateData)
    console.log('initial digital nameplate form state:', initialState)
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
      validationIssues.value = validationResult.issues
      console.log('Digital Nameplate validation failed:', validationResult.issues)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const rawFormState = deepCopyFormState(formValues.value)
    const savedFormState = structuredClone(rawFormState)
    store.saveDigitalNameplateFormState(savedFormState)

    const builtDigitalNameplate = buildDigitalNameplate(rawFormState)
    console.log('builtDigitalNameplate', builtDigitalNameplate)
    store.saveDigitalNameplateData(builtDigitalNameplate)
    props.next()
  }

  function onFormStateUpdate (value: FormStateObject): void {
    formValues.value = value
  }
  function deepCopyFormState<T> (value: T): T {
    if (value === null || typeof value !== 'object') {
      return value
    }

    if (value instanceof File) {
      return value
    }

    if (Array.isArray(value)) {
      return value.map(item => deepCopyFormState(item)) as T
    }

    const rawObject = toRaw(value) as Record<string, unknown>
    const result: Record<string, unknown> = {}

    for (const [key, nestedValue] of Object.entries(rawObject)) {
      result[key] = deepCopyFormState(nestedValue)
    }

    return result as T
  }
</script>
