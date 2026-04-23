<!-- <template>
  <div> Technical Data Form</div>
  <div class="d-flex justify-space-between">
    <v-btn color="primary" @click="props.prev">Back</v-btn>
    <v-btn color="primary" @click="props.next">Next</v-btn>
  </div>
</template>
<script lang="ts" setup>
  const props = defineProps<{
    next: () => void
    prev: () => void
    isActiveComponent: boolean
  }>()
</script> -->
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
      <v-form ref="formRef" @submit.prevent="saveAndNext">
        <v-row>
          <v-col>
            <SubmodelRenderer
              :elements="templateData.submodelElements"
              :form-state="formValues"
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
  import type { TechnicalDataTemplate } from '../types/template'
  import type { ValidationIssue } from '../types/validation'
  import { onMounted, ref } from 'vue'
  import template from '../templates/technical-data.json'
  import { createInitialFormState } from '../utils/createInitialFormState'
  import { normalizeTechnicalDataTemplate } from '../utils/normalizeTemplate'
  import SubmodelRenderer from './renderer/SubmodelRenderer.vue'

  const props = defineProps<{
    prev: () => void
    next: () => void
    isActiveComponent: boolean
  }>()
  const formRef = ref()
  const rawTemplate = template as TechnicalDataTemplate
  // const templateData = template as TechnicalDataTemplate
  const templateData = normalizeTechnicalDataTemplate(rawTemplate)
  const formValues = ref<FormStateObject>(createInitialFormState(templateData))
  const validationIssues = ref<ValidationIssue[]>([])

  onMounted(() => {
    console.log('Technical Data templatedata is', templateData)
    console.log('Technical Data formvalues is', formValues)
    const initialState = createInitialFormState(templateData)
    console.log('initial digital nameplate form state:', initialState)
  })

  function saveAndNext () {
    props.next()
  }
  function onFormStateUpdate (value: FormStateObject): void {
    formValues.value = value
  }
</script>
