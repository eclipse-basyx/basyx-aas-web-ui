<template>
  <v-container class="pa-0" fluid>
    <v-card class="mb-4">
      <v-card-title class="text-body-large">
        <div class="d-flex align-center w-100 ga-2">
          <span>{{ nameToDisplay(submodelElementData, 'en', 'Production Plan') }}</span>
          <v-spacer />
          <v-chip :color="isFinishedChipColor" size="small" variant="tonal">
            {{ isFinishedLabel }}
          </v-chip>
        </div>
      </v-card-title>
      <v-card-subtitle v-if="descriptionToDisplay(submodelElementData)" class="mb-2 text-body-small">
        {{ descriptionToDisplay(submodelElementData) }}
      </v-card-subtitle>
    </v-card>

    <v-sheet v-if="isLoading" class="mb-4" color="transparent">
      <v-card>
        <v-skeleton-loader type="paragraph" />
      </v-card>
    </v-sheet>

    <v-card v-else-if="steps.length === 0" class="mb-4">
      <v-card-text>
        <v-alert icon="mdi-information-outline" type="info" variant="tonal">
          No production steps found in this submodel.
        </v-alert>
      </v-card-text>
    </v-card>

    <v-card v-else class="pt-2 pb-3">
      <v-card-title class="text-body-large">Production Steps</v-card-title>
      <v-card-text class="pt-0 pb-2">
        <v-stepper-vertical
          v-model="expandedSteps"
          class="production-plan-stepper"
          flat
          hide-actions
          :mandatory="false"
          multiple
          non-linear
          readonly
        >
          <template #default>
            <v-stepper-vertical-item
              v-for="step in steps"
              :key="`step-item-${step.value}`"
              class="py-0"
              :complete="step.statusKind === 'complete'"
              :error="step.statusKind === 'error'"
              :value="step.value"
            >
              <template #title>
                <div class="d-flex align-center w-100 ga-2">
                  <span class="font-weight-medium">{{ step.title }}</span>
                  <v-spacer />
                  <v-chip :color="statusChipColor(step.statusKind)" size="x-small" variant="tonal">
                    {{ step.status }}
                  </v-chip>
                </div>
              </template>

              <v-list class="pa-0 bg-transparent" density="compact">
                <template v-if="step.actions.length > 0">
                  <v-list-item
                    v-for="action in step.actions"
                    :key="action.key"
                    class="my-0 rounded border-sm"
                    density="compact"
                  >
                    <v-list-item-title>{{ action.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ action.machineName }}</v-list-item-subtitle>
                    <template #append>
                      <v-chip :color="statusChipColor(action.statusKind)" size="x-small" variant="tonal">
                        {{ action.status }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>
                <v-list-item v-else density="compact">
                  <v-list-item-subtitle>No actions available for this step.</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <template #next />
              <template #prev />
            </v-stepper-vertical-item>
          </template>
        </v-stepper-vertical>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils'

  // Options
  defineOptions({
    name: 'ProductionPlan',
    semanticId: 'https://smartfactory.de/semantics/submodel/ProductionPlan#1/0',
  })

  type StatusKind = 'complete' | 'current' | 'error' | 'neutral'

  interface ActionItem {
    key: string
    title: string
    machineName: string
    status: string
    statusKind: StatusKind
  }

  interface StepItem {
    key: string
    value: number
    idShort: string
    title: string
    status: string
    statusKind: StatusKind
    actions: ActionItem[]
    order: number
  }

  const semanticIds = {
    isFinished: 'https://smartfactory.de/semantics/submodel-element/IsFinished',
    step: 'https://smartfactory.de/semantics/submodel-element/Step',
    stepTitle: 'https://smartfactory.de/semantics/submodel-element/Step/StepTitle',
    status: 'https://smartfactory.de/concept-descriptions/2e477e2e-7b9a-41e3-8c36-6fea108bab08',
    actions: 'https://smartfactory.de/semantics/submodel-element/Step/Actions',
    action: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action',
    actionTitle: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action/ActionTitle',
    machineName: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action/MachineName',
  }

  // Composables
  const { checkIdShort, descriptionToDisplay, nameToDisplay } = useReferableUtils()

  // Properties
  const props = defineProps({
    submodelElementData: {
      type: Object as any,
      default: {} as any,
    },
  })

  // Data
  const isLoading = ref(false)
  const isFinished = ref<boolean | null>(null)
  const steps = ref<StepItem[]>([])
  const expandedSteps = ref<number[]>([])

  // Computed Properties
  const submodelElementData = computed(() => props.submodelElementData ?? {})
  const isFinishedLabel = computed(() => {
    if (isFinished.value === true) {
      return 'Finished'
    }
    if (isFinished.value === false) {
      return 'In Progress'
    }
    return 'Unknown'
  })
  const isFinishedChipColor = computed(() => {
    if (isFinished.value === true) {
      return 'success'
    }
    if (isFinished.value === false) {
      return 'warning'
    }
    return 'default'
  })
  onMounted(() => {
    initializeVisualization()
  })

  watch(
    () => [
      props.submodelElementData?.id,
      props.submodelElementData?.path,
      props.submodelElementData?.timestamp,
    ],
    () => {
      initializeVisualization()
    },
  )

  function initializeVisualization (): void {
    isLoading.value = true
    isFinished.value = null
    steps.value = []
    expandedSteps.value = []

    const submodelData = props.submodelElementData
    if (!submodelData || Object.keys(submodelData).length === 0) {
      isLoading.value = false
      return
    }

    const rootElements = Array.isArray(submodelData.submodelElements) ? submodelData.submodelElements : []

    const isFinishedElement = rootElements.find((sme: any) => {
      return checkSemanticId(sme, semanticIds.isFinished) || checkIdShort(sme, 'IsFinished')
    })
    isFinished.value = parseBooleanValue(getSmeValue(isFinishedElement))

    const parsedSteps = rootElements
      .filter((sme: any) => {
        return isStepElement(sme)
      })
      .map((stepElement: any, index: number) => {
        return parseStep(stepElement, index)
      })
      .toSorted((left: any, right: any) => {
        return compareStepOrder(left.idShort, right.idShort, left.order, right.order)
      })
      .map((step: any, index: any) => {
        return {
          ...step,
          value: index + 1,
        }
      })

    steps.value = parsedSteps
    expandedSteps.value = parsedSteps.map((step: any) => step.value)
    isLoading.value = false
  }

  function isStepElement (sme: any): boolean {
    if (sme?.modelType !== 'SubmodelElementCollection') {
      return false
    }

    return checkSemanticId(sme, semanticIds.step) || checkIdShort(sme, 'Step', true)
  }

  function parseStep (stepElement: any, index: number): StepItem {
    const stepTitleElement = findChildBySemanticOrIdShort(stepElement, semanticIds.stepTitle, 'StepTitle')
    const stepStatusElement = findChildBySemanticOrIdShort(stepElement, semanticIds.status, 'Status')
    const actionsElement = findChildBySemanticOrIdShort(stepElement, semanticIds.actions, 'Actions')

    const actions = parseActions(actionsElement)
    const status = withFallback(getSmeValue(stepStatusElement), 'Unknown')

    return {
      key: stepElement?.idShort || `step-${index + 1}`,
      value: index + 1,
      idShort: stepElement?.idShort || '',
      title: withFallback(getSmeValue(stepTitleElement), nameToDisplay(stepElement, 'en', `Step ${index + 1}`)),
      status,
      statusKind: mapStatusKind(status),
      actions,
      order: index,
    }
  }

  function parseActions (actionsElement: any): ActionItem[] {
    if (!actionsElement || !Array.isArray(actionsElement?.value)) {
      return []
    }

    return actionsElement.value
      .filter((actionElement: any) => {
        return (
          actionElement?.modelType === 'SubmodelElementCollection'
          && (checkSemanticId(actionElement, semanticIds.action) || checkIdShort(actionElement, 'Action', true))
        )
      })
      .map((actionElement: any, index: number) => {
        const actionTitleElement = findChildBySemanticOrIdShort(actionElement, semanticIds.actionTitle, 'ActionTitle')
        const actionMachineNameElement = findChildBySemanticOrIdShort(actionElement, semanticIds.machineName, 'MachineName')
        const actionStatusElement = findChildBySemanticOrIdShort(actionElement, semanticIds.status, 'Status')
        const status = withFallback(getSmeValue(actionStatusElement), 'Unknown')

        return {
          key: actionElement?.idShort || `action-${index + 1}`,
          title: withFallback(getSmeValue(actionTitleElement), nameToDisplay(actionElement, 'en', `Action ${index + 1}`)),
          machineName: withFallback(getSmeValue(actionMachineNameElement), 'No machine name'),
          status,
          statusKind: mapStatusKind(status),
        }
      })
  }

  function findChildBySemanticOrIdShort (parentElement: any, semanticId: string, idShort: string): any {
    if (!parentElement || !Array.isArray(parentElement?.value)) {
      return undefined
    }

    return parentElement.value.find((sme: any) => {
      return checkSemanticId(sme, semanticId) || checkIdShort(sme, idShort)
    })
  }

  function getSmeValue (sme: any): string {
    if (!sme || sme.value === undefined || sme.value === null) {
      return ''
    }

    if (typeof sme.value === 'string') {
      return sme.value.trim()
    }

    if (typeof sme.value === 'number' || typeof sme.value === 'boolean') {
      return String(sme.value)
    }

    return ''
  }

  function parseBooleanValue (value: string): boolean | null {
    const normalizedValue = value.trim().toLowerCase()

    if (['true', '1', 'yes', 'done', 'finished', 'complete', 'completed'].includes(normalizedValue)) {
      return true
    }
    if (['false', '0', 'no', 'open', 'inprogress', 'in_progress', 'running'].includes(normalizedValue)) {
      return false
    }

    return null
  }

  function mapStatusKind (status: string): StatusKind {
    const normalizedStatus = status.trim().toLowerCase().replaceAll(' ', '')

    if (['done', 'finished', 'complete', 'completed'].includes(normalizedStatus)) {
      return 'complete'
    }

    if (['open', 'inprogress', 'running', 'active'].includes(normalizedStatus)) {
      return 'current'
    }

    if (['failed', 'failure', 'error'].includes(normalizedStatus)) {
      return 'error'
    }

    return 'neutral'
  }

  function statusChipColor (statusKind: StatusKind): string {
    if (statusKind === 'complete') {
      return 'success'
    }
    if (statusKind === 'current') {
      return 'primary'
    }
    if (statusKind === 'error') {
      return 'error'
    }
    return 'default'
  }

  function compareStepOrder (
    leftIdShort: string,
    rightIdShort: string,
    leftFallbackIndex: number,
    rightFallbackIndex: number,
  ): number {
    const leftNumber = extractIdShortNumber(leftIdShort)
    const rightNumber = extractIdShortNumber(rightIdShort)

    if (leftNumber !== null && rightNumber !== null) {
      return leftNumber - rightNumber
    }

    if (leftNumber !== null) {
      return -1
    }

    if (rightNumber !== null) {
      return 1
    }

    return leftFallbackIndex - rightFallbackIndex
  }

  function extractIdShortNumber (idShort: string): number | null {
    if (!idShort) {
      return null
    }

    const numericSuffix = idShort.match(/(\d+)$/)
    if (!numericSuffix || !numericSuffix[1]) {
      return null
    }

    const parsed = Number.parseInt(numericSuffix[1], 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  function withFallback (value: string, fallback: string): string {
    return value.trim() === '' ? fallback : value
  }
</script>

<style scoped>
  :deep(.production-plan-stepper .v-expansion-panel-text__wrapper) {
    padding-top: 4px;
    padding-bottom: 4px;
  }
</style>
