<template>
  <v-list-item class="pt-0">
    <v-list-item-title :class="isOperationVariable ? 'pt-2' : ''">
      <v-text-field
        v-model="newDateTimestampValue"
        :clearable="isEditable"
        :color="dateTimeStampValue.value == newDateTimestampValue ? '' : 'warning'"
        density="compact"
        :hide-details="isOperationVariable ? true : false"
        :hint="dateTimeStampValue.value == newDateTimestampValue ? '' : 'Current value not yet saved.'"
        :persistent-hint="!isOperationVariable"
        :readonly="!isEditable"
        type="text"
        variant="outlined"
        @click:clear="clearDateTimestamp"
        @keydown.enter="updateValue()"
        @update:focused="setFocus"
      >
        <!-- Update Value Button -->
        <template #append-inner>
          <v-btn
            v-if="!isOperationVariable && isEditable"
            class="text-buttonText"
            color="primary"
            size="small"
            style="right: -4px"
            variant="elevated"
            @click.stop="updateValue()"
          >
            <v-icon>mdi-upload</v-icon>
          </v-btn>
        </template>
      </v-text-field>
    </v-list-item-title>

    <v-row v-if="!isOutputVariable" class="mt-0">
      <!-- Date Picker -->
      <v-col cols="auto">
        <v-date-picker
          v-model="newDate"
          color="primary"
          :disabled="!isEditable"
          elevation="1"
          show-adjacent-months
          @update:model-value="applyDate"
        />
      </v-col>
      <!-- Time Picker -->
      <v-col cols="auto">
        <v-text-field v-model="newTime" type="time" variant="solo" @change="applyTime" />
      </v-col>
      <!-- TODO Timezone Picker -->
    </v-row>
  </v-list-item>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useSMEHandling } from '@/composables/AAS/SMEHandling'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { useAASStore } from '@/store/AASDataStore'
  import { createXSDDateString, dateTimeRegex } from '@/utils/DateUtils'
  import { padTo2Digits } from '@/utils/NumberUtils'

  // Stores
  const aasStore = useAASStore()

  // Composables
  const { patchRequest } = useRequestHandling()
  const { fetchAndDispatchSme } = useSMEHandling()

  const props = defineProps({
    dateTimeStampValue: {
      type: Object,
      default: () => ({}),
    },
    isOperationVariable: {
      type: Boolean,
      default: false,
    },
    variableType: {
      type: String,
      default: 'number',
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
  })

  const emit = defineEmits<{
    (event: 'update-value', updatedDateTimestampValue: any): void
  }>()

  // Data
  const newDateTimestampValue = ref<string>('')
  const newDate = ref<any>(new Date())
  const newTime = ref<string>('')
  const lastSubmittedValue = ref<unknown>()

  // Computed Properties
  const selectedNode = computed(() => aasStore.getSelectedNode)
  const isOperationVariable = computed(() => {
    return props.isOperationVariable == undefined ? false : props.isOperationVariable
  })
  const isOutputVariable = computed(() => {
    return props.isOperationVariable == undefined ? false : props.variableType == 'outputVariables'
  })

  // Watchers
  watch(
    () => selectedNode.value,
    () => {
      initialize(props.dateTimeStampValue.value)
    },
  )

  watch(
    () => props.dateTimeStampValue,
    propsDateTimestampValue => {
      if (newDateTimestampValue.value !== propsDateTimestampValue.value)
        initialize(props.dateTimeStampValue.value)
    },
    { deep: true },
  )

  onMounted(() => {
    initialize(props.dateTimeStampValue.value)
  })

  function initialize (dateTimestampValue: string): void {
    lastSubmittedValue.value = dateTimestampValue
    if (dateTimestampValue && dateTimestampValue.trim() !== '') {
      const dateTimestampString = dateTimestampValue.trim()
      const matches = dateTimestampString.match(new RegExp(dateTimeRegex))
      if (matches) {
        newDateTimestampValue.value = dateTimestampString

        const numbers = matches ? matches.map(Number) : []
        // const strings = matches ? matches.map(String) : [];

        const year: number = numbers[2]
        const month: number = numbers[3]
        const day: number = numbers[4]
        newDate.value = new Date(year, month - 1, day)

        const hour = numbers[6]
        const minute = numbers[7]
        const second = numbers[8]

        newTime.value = [
          hour ? padTo2Digits(hour) : padTo2Digits(0),
          minute ? padTo2Digits(minute) : padTo2Digits(0),
          second ? padTo2Digits(second) : padTo2Digits(0),
        ].join(':')
        return
      } else {
        newDateTimestampValue.value = dateTimestampValue
        newDate.value = new Date()
        newTime.value = '00:00:00'
        return
      }
    }
    newDateTimestampValue.value = ''
    newDate.value = new Date()
    newTime.value = '00:00:00'
  }

  function updateValue (): void {
    if (isOperationVariable.value) {
      if (
        newDateTimestampValue.value === props.dateTimeStampValue.value
        || newDateTimestampValue.value === lastSubmittedValue.value
      ) return
      lastSubmittedValue.value = newDateTimestampValue.value
      emit('update-value', newDateTimestampValue.value)
      return
    }

    const path = `${props.dateTimeStampValue.path}/$value`
    const content = JSON.stringify(newDateTimestampValue.value)
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const context = `updating ${props.dateTimeStampValue.modelType} "${props.dateTimeStampValue.idShort}"`
    const disableMessage = false
    patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
      if (response.success) {
        // After successful patch request fetch and dispatch updated SME
        fetchAndDispatchSme(selectedNode.value.path, false)
      }
    })
  }

  // Function to apply the selected date to the newDateTimestampValue
  function applyDate (date: any): void {
    if (!date) return
    // replace the date in the newDateTimestampValue
    const year = date.getFullYear()
    const month = (1 + date.getMonth()).toString().padStart(2, '0') // Months are zero indexed, hence the +1. padStart will add a 0 in front if it's a single digit
    const day = date.getDate().toString().padStart(2, '0') // padStart will add a 0 in front if it's a single digit
    const dateString = year + '-' + month + '-' + day

    let tempTimestampValue = newDateTimestampValue.value.split('T', 2)[1]

    // if the time is not set, set it to the current time including the timezone
    if (!tempTimestampValue) {
      const timeString = createXSDDateString().split('T', 2)[1]
      tempTimestampValue = timeString
      newTime.value = timeString.split('.', 1)[0]
    }

    newDateTimestampValue.value = dateString + 'T' + tempTimestampValue

    if (isOperationVariable.value) {
      updateValue()
    }
  }

  // Function to apply the selected time to the newDateTimestampValue
  function applyTime (): void {
    // replace the time in the newDateTimestampValue
    const tempDateValue = newDateTimestampValue.value.split('T', 1)[0]
    const tempStampEnd = newDateTimestampValue.value.split('.', 2)[1]
    if (tempStampEnd) {
      newDateTimestampValue.value = tempDateValue + 'T' + newTime.value + ':00' + '.' + tempStampEnd
    } else {
      newDateTimestampValue.value = tempDateValue + 'T' + newTime.value + ':00'
      if (newDateTimestampValue.value.includes('Z')) newDateTimestampValue.value += 'Z'
    }
    if (isOperationVariable.value) {
      updateValue()
    }
  }

  // Function to clear the DateTimeStamp
  function clearDateTimestamp (): void {
    newDateTimestampValue.value = ''
    newTime.value = ''
  }

  // Function to set the focus on the input field
  function setFocus (isFocusedToSet: boolean): void {
    if (isOperationVariable.value && !isFocusedToSet) {
      updateValue()
    }
  }
</script>

<style scoped>
    :deep()div.v-messages__message {
        color: #fb8c00;
    }
</style>
