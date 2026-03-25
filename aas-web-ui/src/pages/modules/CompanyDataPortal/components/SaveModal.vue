<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>Save AAS</v-card-title>
      <v-card-text>
        <v-combobox
          v-if="endpointConfigAvailable"
          v-model="serverUrl"
          density="compact"
          :items="serverOptions"
          label="AAS Environment URL"
          required
          :rules="[(v: any) => !!v || 'Server URL is required']"
          variant="outlined"
        />
        <v-text-field
          v-model="aasId"
          density="compact"
          label="AAS ID"
          required
          :rules="[(v: any) => !!v || 'AAS ID is required']"
          variant="outlined"
        />
        <v-text-field
          v-model="smId"
          density="compact"
          label="Submodel ID Prefix"
          required
          :rules="[(v: any) => !!v || 'Submodel ID Prefix is required']"
          variant="outlined"
        />
        <FormField
          label="Homepage URL"
          tip="Web address of the company's official website, for customers and interested parties"
        >
          <v-slide-y-transition group>
            <div v-for="(entry, index) in aasDisplayName" :key="`url-${index}`" class="mb-3">
              <v-row align="center" no-gutters>
                <v-col class="pr-md-2" cols="12" md="3">
                  <v-text-field
                    v-model="entry.language"
                    density="comfortable"
                    hide-details
                    placeholder="e.g., en"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="9">
                  <v-text-field
                    v-model="entry.text"
                    density="comfortable"
                    hide-details
                    placeholder="https://example.com"
                    type="url"
                    variant="outlined"
                  />
                </v-col>
                <v-col class="mt-1" cols="12">
                  <v-btn
                    color="error"
                    size="small"
                    variant="tonal"
                    @click="aasDisplayName.splice(index, 1)"
                  >
                    Remove
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-slide-y-transition>

          <v-btn
            color="primary"
            size="small"
            variant="tonal"
            @click="aasDisplayName.push({ language: '', text: '' })"
          >
            + Add AAS Display Name
          </v-btn>
        </FormField>
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" variant="tonal" @click="close">Cancel</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="tonal" @click="execSave">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import FormField from './FormField.vue'

  const dialog = ref(false)
  const aasId = ref('')
  const smId = ref('')
  const serverUrl = ref('')
  const serverOptions = ref<string[]>([])
  const aasDisplayName = ref<{ language: string, text: string }[]>([])

  const infrastructureStore = useInfrastructureStore()
  const envStore = useEnvStore()

  const endpointConfigAvailable = computed(() => envStore.getEndpointConfigAvailable)
  const aasRepoURL = computed(() => infrastructureStore.getAASRepoURL)

  watch(
    aasRepoURL,
    newVal => {
      // Remove everything after the port number
      let baseUrl = newVal.replace(/\/shells\/?$/, '')
      // Remove trailing slash if present
      baseUrl = baseUrl.replace(/\/$/, '')
      serverOptions.value.push(baseUrl)
    },
    { immediate: true },
  )

  onMounted(() => {
    if (!endpointConfigAvailable.value) {
      serverUrl.value = aasRepoURL.value.replace(/\/shells\/?$/, '').replace(/\/$/, '')
    }
  })

  const props = defineProps<{
    save: (
      aasId: string,
      smId: string,
      serverUrl: string,
      aasDisplayName: Array<{ language: string, text: string }>,
    ) => void
    closeDialog: () => void
    showDialog: boolean
  }>()

  watch(
    () => props.showDialog,
    newVal => {
      dialog.value = newVal
    },
  )

  function open (): void {
    dialog.value = true
  }

  function close (): void {
    dialog.value = false
    aasId.value = ''
    serverUrl.value = ''
    serverOptions.value = []
    props.closeDialog()
  }

  function execSave (): void {
    if (aasId.value && serverUrl.value) {
      props.save(aasId.value, smId.value, serverUrl.value, aasDisplayName.value)
      close()
    } else {
      alert('Please fill in all required fields.')
    }
  }

  defineExpose({
    open,
  })
</script>
