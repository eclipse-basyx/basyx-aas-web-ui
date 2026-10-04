<template>
  <v-container class="pa-0" fluid>
    <v-card>
      <!-- Header -->
      <div class="d-flex align-center px-4 py-3">
        <v-icon class="mr-2" color="primary" size="small">mdi-calendar-clock</v-icon>

        <div class="text-title-small text-break">
          {{ calendar?.name ?? nameToDisplay(submodelElementData, 'en', 'Production Calendar') }}
        </div>

        <v-spacer />

        <v-chip
          v-if="calendar"
          border
          label
          prepend-icon="mdi-earth"
          size="x-small"
        >
          {{ calendar.timeZone }}
        </v-chip>
      </div>

      <v-divider />

      <v-skeleton-loader v-if="isLoading" type="image, paragraph" />

      <div v-else-if="errorMessage" class="pa-4">
        <v-alert icon="mdi-alert-circle-outline" type="error" variant="tonal">{{ errorMessage }}</v-alert>
      </div>

      <template v-else-if="calendar">
        <CalendarView :calendar="calendar" />

        <div v-if="specifications.length > 0" class="pa-4 pt-0">
          <VariableSpecifications :specifications="specifications" :x-properties="calendar.xProperties" />
        </div>
      </template>

      <template v-if="!isLoading">
        <v-divider />
        <LastSync :timestamp="modelData.timestamp" />
      </template>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ParsedCalendar, VariableSpecification } from './ProductionCalendar/types'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
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
    specifications: 'https://admin-shell.io/idta/ProductionCalendar/specificationExtensionVariables/1/0',
  }

  // Composables
  const { checkIdShort, nameToDisplay } = useReferableUtils()
  const { setData } = useSMHandling()
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
  const modelData = ref<any>({})
  const calendar = shallowRef<ParsedCalendar | null>(null)
  const specifications = ref<VariableSpecification[]>([])
  let loadCounter = 0

  // Watchers
  watch(
    () => [props.submodelElementData?.id, props.submodelElementData?.path, props.submodelElementData?.timestamp],
    initializeVisualization,
  )

  // Lifecycle hooks
  onMounted(initializeVisualization)

  // Methods
  async function initializeVisualization (): Promise<void> {
    // Ignore results of outdated loads, e.g. when the Submodel changes while loading
    const load = ++loadCounter
    isLoading.value = true
    errorMessage.value = ''
    calendar.value = null
    specifications.value = []

    // setData assigns the `path` of every element, which is needed to request the file attachments
    const submodel = props.submodelElementData
    const data = submodel && Object.keys(submodel).length > 0
      ? await setData({ ...submodel }, submodel.path ?? '', false, submodel.timestamp)
      : {}
    if (load !== loadCounter) {
      return
    }
    modelData.value = data

    const rootElements: any[] = Array.isArray(data.submodelElements) ? data.submodelElements : []
    specifications.value = parseSpecifications(
      rootElements.find(sme => checkSemanticId(sme, semanticIds.specifications) || checkIdShort(sme, 'specificationExtensionVariables')),
    )

    const calendarFile = rootElements.find(sme => checkSemanticId(sme, semanticIds.calendar) || checkIdShort(sme, 'calendar'))
    if (!calendarFile?.value) {
      errorMessage.value = 'This Submodel has no calendar file.'
      isLoading.value = false
      return
    }

    try {
      const parsed = parseCalendar(await fetchFileText(calendarFile))
      if (load === loadCounter) {
        calendar.value = parsed
      }
    } catch (error) {
      if (load === loadCounter) {
        errorMessage.value = `The calendar could not be loaded: ${error instanceof Error ? error.message : String(error)}`
      }
    } finally {
      if (load === loadCounter) {
        isLoading.value = false
      }
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
