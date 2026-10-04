<template>
  <v-container class="pa-0" fluid>
    <v-card class="mb-4">
      <v-card-title class="text-body-large">
        <div class="d-flex align-center w-100 ga-2">
          <span>{{ nameToDisplay(submodelElementData, 'en', 'Production Calendar') }}</span>
          <v-spacer />

          <v-chip
            v-if="calendar"
            prepend-icon="mdi-earth"
            size="small"
            variant="tonal"
          >
            {{ calendar.timeZone }}
          </v-chip>
        </div>
      </v-card-title>

      <v-card-subtitle v-if="calendar" class="mb-2 text-body-small">{{ calendar.name }}</v-card-subtitle>
    </v-card>

    <v-card v-if="isLoading" class="mb-4">
      <v-skeleton-loader type="article" />
    </v-card>

    <v-card v-else-if="errorMessage" class="mb-4">
      <v-card-text>
        <v-alert icon="mdi-alert-circle-outline" type="error" variant="tonal">{{ errorMessage }}</v-alert>
      </v-card-text>
    </v-card>

    <template v-else-if="calendar">
      <CalendarView :calendar="calendar" class="mb-4" />

      <VariableSpecifications
        v-if="specifications.length > 0"
        :specifications="specifications"
        :x-properties="calendar.xProperties"
      />
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ParsedCalendar, VariableSpecification } from './ProductionCalendar/types'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils'
  import { useFileText } from './ProductionCalendar/composables/useFileText'
  import { parseCalendar } from './ProductionCalendar/ics'

  // Options
  defineOptions({
    name: 'ProductionCalendar',
    semanticId: 'https://admin-shell.io/idta/SubmodelTemplate/ProductionCalendar/1/0',
  })

  const semanticIds = {
    calendar: 'https://admin-shell.io/idta/ProductionCalendar/calendar/1/0',
    specifications: 'https://admin-shell.io/idta/ProductionCalendar/specification/1/0',
  }

  // Composables
  const { checkIdShort, nameToDisplay } = useReferableUtils()
  const { fetchFileText } = useFileText()

  // Properties
  const props = defineProps({
    submodelElementData: {
      type: Object as any,
      default: {} as any,
    },
  })

  // Reactive state
  const isLoading = ref(false)
  const errorMessage = ref('')
  const calendar = shallowRef<ParsedCalendar | null>(null)
  const specifications = ref<VariableSpecification[]>([])

  // Lifecycle hooks
  onMounted(() => {
    initializeVisualization()
  })

  watch(
    () => [props.submodelElementData?.id, props.submodelElementData?.path, props.submodelElementData?.timestamp],
    () => {
      initializeVisualization()
    },
  )

  // Methods
  async function initializeVisualization (): Promise<void> {
    const submodel = props.submodelElementData
    const rootElements: any[] = Array.isArray(submodel?.submodelElements) ? submodel.submodelElements : []

    calendar.value = null
    errorMessage.value = ''
    specifications.value = parseSpecifications(
      rootElements.find(sme => checkSemanticId(sme, semanticIds.specifications) || checkIdShort(sme, 'specificationExtensionVariables')),
    )

    const calendarFile = rootElements.find(sme => checkSemanticId(sme, semanticIds.calendar) || checkIdShort(sme, 'calendar'))
    if (!calendarFile?.value) {
      errorMessage.value = 'This Submodel has no calendar file.'
      return
    }

    // Ignore results of outdated loads, e.g. when the Submodel is refreshed while loading
    const timestamp = props.submodelElementData?.timestamp
    isLoading.value = true
    try {
      const parsed = parseCalendar(await fetchFileText(calendarFile))
      if (timestamp === props.submodelElementData?.timestamp) {
        calendar.value = parsed
      }
    } catch (error) {
      errorMessage.value = `The calendar could not be loaded: ${error instanceof Error ? error.message : String(error)}`
    } finally {
      isLoading.value = false
    }
  }

  function parseSpecifications (list: any): VariableSpecification[] {
    if (!Array.isArray(list?.value)) {
      return []
    }
    return list.value
      .map((entry: any): VariableSpecification | undefined => {
        const children: any[] = Array.isArray(entry?.value) ? entry.value : []
        const name = children.find(sme => checkIdShort(sme, 'variableName'))?.value
        if (typeof name !== 'string' || name.trim() === '') {
          return undefined
        }
        return { name: name.trim(), file: children.find(sme => checkIdShort(sme, 'variableSpecification')) }
      })
      .filter(Boolean)
  }
</script>
