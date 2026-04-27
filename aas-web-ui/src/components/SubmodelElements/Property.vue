<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="!isOperationVariable" class="px-1 pb-1 pt-0">
      <v-list-item-title class="text-title-small mt-2">{{ 'Value: ' }}</v-list-item-title>
    </v-list-item>

    <v-card v-if="propertyObject" color="elevatedCard">
      <!-- Value of the Property -->
      <v-list class="pt-0" :class="isOperationVariable ? '' : 'bg-elevatedCard'" nav>
        <!-- valueId -->
        <v-list-item
          v-if="
            !isOperationVariable &&
              propertyObject.valueId &&
              propertyObject.valueId.keys &&
              propertyObject.valueId.keys.length > 0
          "
          class="pb-0"
        >
          <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
            <div v-for="(valueId, i) in propertyObject.valueId.keys" :key="i" class="text-body-small">
              <span class="font-weight-bold">{{ '(' + valueId.type + ') ' }}</span>
              {{ valueId.value }}
            </div>
          </v-tooltip>

          <template #title>
            <span class="text-body-small">{{ 'ValueId: ' }}</span>
          </template>

          <template #subtitle>
            <v-list-item-subtitle v-for="(valueId, i) in propertyObject.valueId.keys" :key="i">
              <div class="pt-2">
                <v-chip border class="mr-2" label size="x-small">{{ valueId.type }}</v-chip>
                <span>{{ valueId.value }}</span>
              </div>
            </v-list-item-subtitle>
          </template>
        </v-list-item>
        <!-- valueType -->
        <v-list-item v-if="!isOperationVariable" class="pb-0">
          <v-list-item-title>
            <span class="text-body-small">{{ 'Value Type: ' }}</span>
            <v-chip border color="primary" label size="x-small">{{ propertyObject.valueType }}</v-chip>
          </v-list-item-title>
        </v-list-item>
        <!-- Value Representation depending on the valueType -->
        <NumberType
          v-if="isNumber(propertyObject.valueType)"
          :is-editable="isEditable"
          :is-operation-variable="isOperationVariable"
          :number-value="propertyObject"
          :variable-type="variableType"
          @update-value="updateValue"
        />

        <BooleanType
          v-else-if="propertyObject.valueType == 'xs:boolean'"
          :boolean-value="propertyObject"
          :is-editable="isEditable"
          :is-operation-variable="isOperationVariable"
          :variable-type="variableType"
          @update-value="updateValue"
        />

        <DateType
          v-else-if="propertyObject.valueType == 'xs:date'"
          :date-value="propertyObject"
          :is-editable="isEditable"
          :is-operation-variable="isOperationVariable"
          :variable-type="variableType"
          @update-value="updateValue"
        />

        <DateTimeStampType
          v-else-if="propertyObject.valueType == 'xs:dateTime'"
          :date-time-stamp-value="propertyObject"
          :is-editable="isEditable"
          :is-operation-variable="isOperationVariable"
          :variable-type="variableType"
          @update-value="updateValue"
        />

        <StringType
          v-else
          :is-editable="isEditable"
          :is-operation-variable="isOperationVariable"
          :string-value="propertyObject"
          :variable-type="variableType"
          @update-value="updateValue"
        />
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { isNumber } from '@/utils/generalUtils'

  const props = defineProps({
    propertyObject: {
      type: Object,
      default: () => ({}),
    },
    isOperationVariable: {
      type: Boolean,
      default: false,
    },
    variableType: {
      type: String,
      default: 'string',
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
  })

  const emit = defineEmits<{
    (e: 'update-value', updatedPropertyObject: any): void
  }>()

  const isOperationVariable = computed(() => {
    return props.isOperationVariable == undefined ? false : props.isOperationVariable
  })

  function updateValue (updatedPropertyObject: any): void {
    emit('update-value', updatedPropertyObject)
  }
</script>
