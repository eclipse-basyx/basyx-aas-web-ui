<template>
  <v-container class="pa-0" fluid>
    <v-card v-if="invalidElementObject" class="mt-4" color="elevatedCard">
      <v-list class="pt-0" :class="localIsOperationVariable ? '' : 'bg-elevatedCard'" nav>
        <!-- Alert when SubmodelElement is invalid -->
        <v-list-item v-if="!localIsOperationVariable">
          <v-list-item-title class="pt-2">
            <v-alert
              density="compact"
              text="Invalid SubmodelElement!"
              type="warning"
              variant="outlined"
            />
          </v-list-item-title>
        </v-list-item>
        <!-- Show Blob of the current SubmodelElement -->
        <v-list-item class="py-0" :class="localIsOperationVariable ? 'px-0' : 'px-2'">
          <v-card
            v-if="!localIsOperationVariable || localIsOutputVariable"
            class="pa-2"
            style="height: 300px; overflow: auto"
          >
            <pre>{{ jsonString }}</pre>
          </v-card>
          <v-card v-else class="pa-0 ma-0">
            <v-textarea
              v-model="jsonString"
              density="compact"
              hide-details
              :rows="8"
              variant="outlined"
              @update:focused="setFocus($event)"
            />
          </v-card>
        </v-list-item>
        <v-divider v-if="!localIsOperationVariable" class="mt-3" />
        <!-- Info listing all available SubmodelElements -->
        <v-list-item v-if="!localIsOperationVariable" class="px-3 py-0">
          <v-list-item-subtitle class="pt-2">{{
            'The selected SubmodelElement is either non existend or not yet implemented.'
          }}</v-list-item-subtitle>
          <template #append>
            <!-- Tooltip showing all available SubmodelElements -->
            <v-tooltip open-delay="600" transition="slide-x-transition">
              <template #activator="{ props: invalidElementProps }">
                <v-icon v-bind="invalidElementProps">mdi-information-outline</v-icon>
              </template>
              <div>
                <span class="font-weight-bold">Available SubmodelElements:</span>
                <ul class="px-3">
                  <li v-for="(submodelElement, i) in submodelElements" :key="i">
                    {{ submodelElement }}
                  </li>
                </ul>
              </div>
            </v-tooltip>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'

  const props = defineProps({
    invalidElementObject: {
      type: Object,
      default: () => ({}),
    },
    isOperationVariable: {
      type: Boolean,
      default: false,
    },
    variableType: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits<{
    (e: 'updateValue', updatedInvalidElementObject: any): void
  }>()

  const submodelElements = ref([
    'Submodel',
    'SubmodelElementCollection',
    'SubmodelElementList',
    'Property',
    'MultiLanguageProperty',
    'File',
    'Blob',
    'Operation',
    'ReferenceElement',
    'Range',
    'Entity',
    'RelationshipElement',
    'AnnotatedRelationshipElement',
  ])
  const jsonString = ref('')

  const localIsOperationVariable = computed(() => {
    return props.isOperationVariable === undefined ? false : props.isOperationVariable
  })

  const localIsOutputVariable = computed(() => {
    return props.isOperationVariable === undefined ? false : props.variableType == 'outputVariables'
  })

  watch(
    () => props.invalidElementObject,
    () => {
      const localInvalidElementObject = { ...props.invalidElementObject }
      delete localInvalidElementObject.parent
      jsonString.value = JSON.stringify(localInvalidElementObject, null, 2)
    },
    { deep: true },
  )

  onMounted(() => {
    const localInvalidElementObject = { ...props.invalidElementObject }
    delete localInvalidElementObject.parent
    jsonString.value = JSON.stringify(localInvalidElementObject, null, 2)
  })

  function updateValue (): void {
    emit('updateValue', JSON.parse(jsonString.value))
  }

  function setFocus (e: boolean): void {
    if (!e) {
      updateValue()
    }
  }
</script>
