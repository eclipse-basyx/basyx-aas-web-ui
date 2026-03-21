<template>
  <v-container class="pa-0" fluid>
    <v-card v-if="multiLanguagePropertyObject" class="mt-4" color="elevatedCard">
      <!-- Value(s) of the MultiLanguageProperty -->
      <v-list
        v-if="multiLanguagePropertyObject.value && multiLanguagePropertyObject.value.length > 0"
        class="bg-elevatedCard pt-0"
        nav
      >
        <v-list-item v-for="(value, i) in mlpValue" :key="i">
          <v-list-item-title class="pt-2">
            <!-- Input Field containing the Variable Value -->
            <v-text-field
              v-model="value.text"
              :append-icon="isEditable ? 'mdi-delete' : undefined"
              :clearable="isEditable"
              density="compact"
              hide-details
              :readonly="!isEditable"
              variant="outlined"
              @click:append="removeEntry(i as number)"
              @keydown.enter="updateValue()"
              @update:focused="setFocus($event, value)"
            >
              <template #prepend-inner>
                <!-- language -->
                <v-chip border label size="x-small">
                  <span>{{ value.language ? value.language : 'no-lang' }}</span>
                  <v-icon v-if="isEditable" site="x-small" style="margin-right: -3px">
                    mdi-chevron-down
                  </v-icon>
                  <!-- Menu to select the Language -->
                  <v-menu v-if="isEditable" activator="parent">
                    <v-list class="pa-0" density="compact">
                      <v-list-item
                        v-for="language in languages"
                        :key="language.id"
                        @click="selectLanguage(language, value)"
                      >
                        <v-list-item-title class="py-0">{{ language.short }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-chip>
              </template>
              <!-- Update Value Button -->
              <template #append-inner>
                <v-btn
                  v-if="value.isFocused && isEditable"
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
        </v-list-item>
      </v-list>
      <!-- Warning when MultiLanguageProperty has no value(s) -->
      <v-list v-else class="bg-elevatedCard pt-0" nav>
        <v-list-item>
          <v-list-item-title class="pt-2">
            <v-alert
              density="compact"
              text="MultiLanguageProperty doesn't contain a Value!"
              type="warning"
              variant="outlined"
            />
          </v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider />
      <!-- Edit the MultiLanguageProperty -->
      <v-list v-if="isEditable" class="bg-elevatedCard py-0" nav>
        <v-list-item>
          <template #append>
            <v-btn
              class="text-buttonText"
              color="primary"
              size="small"
              variant="elevated"
              @click="addEntry()"
            >
              <div>Add new Entry</div>
              <v-icon class="ml-1">mdi-plus</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useSMEHandling } from '@/composables/AAS/SMEHandling'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { useAASStore } from '@/store/AASDataStore'

  const props = defineProps({
    multiLanguagePropertyObject: {
      type: Object as any,
      default: {} as any,
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
  })

  const aasStore = useAASStore()

  const { fetchAndDispatchSme } = useSMEHandling()
  const { patchRequest } = useRequestHandling()

  const localMultiLanguagePropertyObject = ref<any>(undefined)
  const mlpValue = ref<any>([])
  const languages = ref<any>([
    { id: 1, text: 'Deutsch', short: 'de' },
    { id: 2, text: 'English', short: 'en' },
    { id: 3, text: 'Français', short: 'fr' },
    { id: 4, text: 'Español', short: 'es' },
    { id: 5, text: 'Italiano', short: 'it' },
    { id: 6, text: 'Kanton Zürich', short: 'zh' },
    { id: 7, text: '한국인', short: 'kr' },
  ])

  const selectedNode = computed(() => {
    try {
      return aasStore.getSelectedNode()
    } catch {
      return null
    }
  })

  watch(
    selectedNode,
    () => {
      mlpValue.value = []
    },
    { deep: true },
  )

  watch(
    () => props.multiLanguagePropertyObject,
    (newVal: any) => {
      mlpValue.value = newVal && newVal.value ? JSON.parse(JSON.stringify(newVal.value)) : []
    },
    { deep: true },
  )

  onMounted(() => {
    localMultiLanguagePropertyObject.value = props.multiLanguagePropertyObject
    const propValue = props.multiLanguagePropertyObject as any
    mlpValue.value = propValue.value || []
  })

  // Function to remove an Entry from the MultiLanguageProperty
  function removeEntry (position: number): void {
    // console.log('removeEntry: ', value);
    mlpValue.value.splice(position, 1)
    localMultiLanguagePropertyObject.value.value = mlpValue.value
    updateMLP()
  }

  // Function to add an Entry to the MultiLanguageProperty
  function addEntry (): void {
    mlpValue.value.push({
      language: '',
      text: '',
    })
    localMultiLanguagePropertyObject.value.value = mlpValue.value
    // console.log('addEntry: ', this.multiLanguagePropertyObject)
    updateMLP()
  }

  // Function to select the Language of the Entry
  function selectLanguage (language: { short: string }, value: { language: string }): void {
    // console.log('selectLanguage: ', language);
    value.language = language.short
    updateMLP()
  }

  // Function to update the Value of the MultiLanguageProperty
  function updateValue (): void {
    // console.log('updateValue: ', this.mlpValue);
    if (document.activeElement) (document.activeElement as HTMLElement).blur() // remove focus from input field
    localMultiLanguagePropertyObject.value.value = mlpValue.value
    updateMLP()
  }

  // Function to update the value of the property
  function updateMLP (): void {
    try {
      if (!localMultiLanguagePropertyObject.value || !localMultiLanguagePropertyObject.value.path) {
        console.warn('Cannot update MLP: missing object or path')
        return
      }

      const path = localMultiLanguagePropertyObject.value.path + '/$value'
      const content = JSON.stringify(
        mlpValue.value.map((item: { language: string, text: string }) => ({ [item.language]: item.text })),
      )
      const headers = new Headers()
      headers.append('Content-Type', 'application/json')
      const context
        = 'updating '
          + localMultiLanguagePropertyObject.value.modelType
          + ' "'
          + localMultiLanguagePropertyObject.value.idShort
          + '"'
      const disableMessage = false

      // Send Request to update the value of the property
      patchRequest(path, content, headers, context, disableMessage)
        .then((response: { success: boolean }) => {
          if (response.success && selectedNode.value?.path) {
            // After successful patch request fetch and dispatch updated SME
            fetchAndDispatchSme(selectedNode.value.path, false)
          }
        })
        .catch((error: unknown) => {
          console.error('Error updating MLP:', error)
        })
    } catch (error) {
      console.error('Error in updateMLP:', error)
    }
  }

  // Function to set the focus on the input field
  function setFocus (e: boolean, value: { isFocused?: boolean }): void {
    value.isFocused = e
  }
</script>
