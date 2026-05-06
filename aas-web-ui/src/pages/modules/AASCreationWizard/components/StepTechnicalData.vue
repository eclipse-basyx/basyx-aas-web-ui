<template>
  <v-col v-if="validationIssues.length > 0" cols="12">
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
              :elements="rendererElements"
              :form-state="formValues"
              :show-validation="hasAttemptedSubmit"
              @update:form-state="onFormStateUpdate"
            />
          </v-col>

          <!-- Temporary arbitrary structure prototype -->
          <!-- <v-col cols="12">
            <ArbitraryStructureEditor v-model="technicalPropertyAreaNodes" title="Technical Property Areas" />
          </v-col> -->
          <v-col cols="12">
            <v-card class="pa-4" variant="outlined">
              <div class="d-flex justify-space-between align-center mb-4">
                <div>
                  <div class="text-subtitle-1 font-weight-medium">
                    Technical Property Areas
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Create one or more technical property areas. Each area can contain its own custom structure
                  </div>
                </div>

                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  variant="tonal"
                  @click="addTechnicalPropertyArea"
                >Add Technical Property Area</v-btn>
              </div>

              <div v-if="technicalPropertyAreas.length===0" class="text-body-2 text-medium-emphasis">
                No Technical Property Area added yet
              </div>

              <div v-else class="d-flex flex-column ga-4">
                <v-card
                  v-for="(area,index) in technicalPropertyAreas"
                  :key="area.editorId"
                  class="pa-4"
                  variant="flat"
                >
                  <div class="d-flex justify-space-between align-center mb-4">
                    <div class="text-subtitle-2 font-weight-medium">
                      Technical Property Area {{ index + 1 }}
                    </div>

                    <v-btn
                      color="error"
                      icon="mdi-delete"
                      variant="text"
                      @click="removeTechnicalPropertyArea(area.editorId)"
                    />
                  </div>

                  <ArbitraryStructureEditor
                    is-nested
                    :model-value="area.arbitraryNodes"
                    title="Custom Structure"
                    @update:model-value="updateTechnicalPropertyAreaNodes(area.editorId, $event)"
                  />
                </v-card>
              </div>
            </v-card>
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
  import type { ArbitraryNode, TechnicalPropertyAreaEditorItem } from '../types/arbitrary'
  import type { FormStateObject } from '../types/form'
  import type { TechnicalDataTemplate } from '../types/template'
  import type { ValidationIssue } from '../types/validation'
  // import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, onMounted, ref } from 'vue'
  import { buildTechnicalData, buildTechnicalPropertyAreas } from '../builders/buildTechnicalData'
  import { useAASCreationStore } from '../stores/aasCreationForm'
  import template from '../templates/technical-data.json'
  import { createInitialFormState } from '../utils/createInitialFormState'
  import { deepCopyFormState } from '../utils/formFieldUtils'
  // import { createUniqueIdShort, labelToIdShort } from '../utils/idShortUtils'
  import { normalizeTechnicalDataTemplate } from '../utils/normalizeTemplate'
  import { validateTemplateElements } from '../utils/validationUtils'
  import ArbitraryStructureEditor from './ArbitraryStructureEditor.vue'
  import SubmodelRenderer from './renderer/SubmodelRenderer.vue'

  const props = defineProps<{
    prev: () => void
    next: () => void
    isActiveComponent: boolean
  }>()

  const formRef = ref()
  const rawTemplate = template as TechnicalDataTemplate
  const templateData = normalizeTechnicalDataTemplate(rawTemplate)
  const formValues = ref<FormStateObject>(createInitialFormState(templateData))
  const validationIssues = ref<ValidationIssue[]>([])
  const technicalPropertyAreas = ref<TechnicalPropertyAreaEditorItem[]>([])

  // computed
  const rendererElements = computed(() => {
    return templateData.submodelElements.filter(
      element => element.idShort !== 'TechnicalPropertyAreas',
    )
  })
  // store
  const store = useAASCreationStore()

  const usedIdShorts = new Set<string>()
  const hasAttemptedSubmit = ref(false)

  onMounted(() => {
    if (store.technicalDataFormState) {
      formValues.value = deepCopyFormState(store.technicalDataFormState)
    }
    if (store.technicalPropertyAreas.length > 0) {
      technicalPropertyAreas.value = deepCopyFormState(store.technicalPropertyAreas)
    }
    console.log('Technical Data templatedata is', templateData)
    console.log('Technical Data formvalues is', formValues)
    const initialState = createInitialFormState(templateData)
    console.log('initial technical data form state:', initialState)
  })

  function saveAndNext (): void {
    console.log('technical data fixed formValues', formValues.value)
    console.log('technical property areas', technicalPropertyAreas.value)

    if (!props.isActiveComponent) {
      return
    }
    hasAttemptedSubmit.value = true
    const validationResult = validateTemplateElements(
      rendererElements.value,
      formValues.value,
    )
    if (!validationResult.isValid) {
      validationIssues.value = validationResult.issues
      console.log('Technical Data validation failed:', validationResult.issues)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    validationIssues.value = []

    const rawFormState = deepCopyFormState(formValues.value)
    const rawTechnicalPropertyAreas = deepCopyFormState(technicalPropertyAreas.value)

    store.saveTechnicalDataFormState(rawFormState)
    store.saveTechnicalPropertyAreas(rawTechnicalPropertyAreas)

    const builtTechnicalPropertyAreas = buildTechnicalPropertyAreas(rawTechnicalPropertyAreas)
    console.log('built technical property areas', builtTechnicalPropertyAreas)

    const builtTechnicalData = buildTechnicalData(rawFormState, rawTechnicalPropertyAreas)
    console.log('builtTechnicalData', builtTechnicalData)

    // const technicalDataParseResult = jsonization.submodelFromJsonable(builtTechnicalData as any)

    // if (technicalDataParseResult.error !== null) {
    //   console.error('Error parsing Technical Data submodel:', technicalDataParseResult.error)
    //   window.alert('Technical Data submodel could not be parsed. Check console.')
    //   return
    // }

    // const technicalDataSubmodelInstance = technicalDataParseResult.mustValue()
    // console.log('Technical Data parse success:', technicalDataSubmodelInstance)

    // const postSuccess = await postSubmodel(technicalDataSubmodelInstance)

    // console.log('Technical Data post success:', postSuccess)

    // if (!postSuccess) {
    //   window.alert('Technical Data submodel post failed. Check console.')
    //   return
    // }

    store.saveTechnicalDataData(builtTechnicalData)

    props.next()
  }

  function onFormStateUpdate (value: FormStateObject): void {
    formValues.value = value
  }

  function addTechnicalPropertyArea (): void {
    technicalPropertyAreas.value.push({
      editorId: createTechnicalPropertyAreaEditorId(),
      arbitraryNodes: [],
    })
  }
  function createTechnicalPropertyAreaEditorId (): string {
    return `technical-property-area-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }
  function removeTechnicalPropertyArea (editorId: string): void {
    technicalPropertyAreas.value = technicalPropertyAreas.value.filter(area => area.editorId !== editorId)
  }
  function updateTechnicalPropertyAreaNodes (editorId: string, nodes: ArbitraryNode[]): void {
    technicalPropertyAreas.value = technicalPropertyAreas.value.map(area => area.editorId === editorId ? { ...area, arbitraryNodes: nodes } : area)
  }

</script>
