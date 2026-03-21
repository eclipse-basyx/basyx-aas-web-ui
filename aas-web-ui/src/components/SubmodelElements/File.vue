<template>
  <v-container class="pa-0" fluid>
    <v-list-item class="px-1 pb-1 pt-0">
      <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Path: ' }}</v-list-item-title>
    </v-list-item>
    <v-card v-if="fileObject" color="elevatedCard">
      <!-- Path (Value) of the File Element -->
      <v-list class="bg-elevatedCard pt-0" nav>
        <v-list-item class="pb-0">
          <!-- mimeType -->
          <v-list-item-title>
            <span class="text-caption">{{ 'Mime Type: ' }}</span>
            <v-chip border color="primary" label size="x-small">{{
              fileObject.contentType ? fileObject.contentType : 'no-mime'
            }}</v-chip>
          </v-list-item-title>
          <!-- Donwload File Button -->
          <template #append>
            <v-btn
              v-if="fileObject.value"
              class="text-buttonText"
              color="primary"
              :href="localPathValue"
              size="small"
              target="_blank"
            >Download File</v-btn>
          </template>
        </v-list-item>
        <!-- Path in Inputfield -->
        <v-list-item class="pt-0">
          <v-list-item-title>
            <v-text-field
              v-model="newPathValue"
              :clearable="isEditable"
              density="compact"
              hide-details
              :readonly="!isEditable"
              variant="outlined"
              @click:clear="clearPath()"
              @keydown.enter="updatePath()"
              @update:focused="setFocus"
            >
              <!-- Update Path Button -->
              <template #append-inner="{ isFocused: isInputFocused }">
                <v-btn
                  v-if="isInputFocused && isEditable"
                  class="text-buttonText"
                  color="primary"
                  size="small"
                  style="right: -4px"
                  variant="elevated"
                  @click.stop="updatePath()"
                >
                  <v-icon>mdi-upload</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-list-item-title>
        </v-list-item>
        <v-divider v-if="!fileObject.value" />
        <!-- Alerts when File was not found/empty -->
        <v-list-item v-if="!fileObject.value">
          <v-list-item-title class="pt-2">
            <v-alert
              density="compact"
              text="SubmodelElement doesn't contain a File!"
              type="warning"
              variant="outlined"
            />
          </v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider />
      <!-- Action Button to upload a File -->
      <v-list v-if="isEditable" class="bg-elevatedCard pa-0" nav>
        <v-list-item>
          <template #title>
            <!-- Upload-Button -->
            <v-file-input
              v-model="newFile"
              class="my-1"
              clearable
              density="compact"
              hide-details
              :multiple="false"
              variant="outlined"
            >
              <template #append-inner>
                <v-btn
                  class="text-buttonText"
                  color="primary"
                  size="small"
                  style="right: -4px"
                  variant="elevated"
                  @click.stop="uploadFile()"
                >Upload File</v-btn>
              </template>
            </v-file-input>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useSMEHandling } from '@/composables/AAS/SMEHandling'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { useAASStore } from '@/store/AASDataStore'

  const props = defineProps({
    fileObject: {
      type: Object,
      default: () => ({}),
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
  })

  const aasStore = useAASStore()

  const { fetchAndDispatchSme } = useSMEHandling()
  const { valueBlob, determineContentType } = useSMEFile()
  const { patchRequest } = useRequestHandling()
  const { putAttachmentFile, putSubmodelElement, fetchSme } = useSMRepositoryClient()

  const newPathValue = ref<string>('')
  const newFile = ref<File | null>(null) // File Object to Upload
  const localPathValue = ref<string>('') // Path to the File when it is embedded to the AAS
  const isFocused = ref<boolean>(false) // boolean to check if the input field is focused

  const selectedNode = computed(() => aasStore.getSelectedNode)

  watch(
    selectedNode,
    newNode => {
      if (newNode) {
        // Reset input values when selectedNode changes
        newPathValue.value = ''
        localPathValue.value = ''
      }
    },
    { deep: true },
  )

  watch(
    () => props.fileObject,
    async newFileObject => {
      if (newFileObject && !isFocused.value) {
        newPathValue.value = newFileObject.value
        localPathValue.value = await valueBlob(newFileObject)
      }
    },
    { deep: true, immediate: true },
  )

  onMounted(async () => {
    if (props.fileObject) {
      newPathValue.value = props.fileObject.value
      localPathValue.value = await valueBlob(props.fileObject)
    }
  })

  async function updatePath (): Promise<void> {
    // console.log("Update Path: " + this.newPathValue);
    const updateObject = { value: newPathValue.value, contentType: props.fileObject.contentType }
    const path = props.fileObject.path + '/$value'
    const content = JSON.stringify(updateObject)
    const context = 'updating ' + props.fileObject.modelType + ' "' + props.fileObject.idShort + '"'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')

    // Send Request to update the path of the file element
    const response = await patchRequest(path, content, headers, context, disableMessage)

    if (response.success) {
      // After successful patch request fetch and dispatch updated SME
      fetchAndDispatchSme(selectedNode.value.path, false)
    }
  }

  function clearPath (): void {
    newPathValue.value = ''
  }

  async function uploadFile (): Promise<void> {
    // console.log("Upload File: ", newFile.value);
    // check if a file is selected
    if (!newFile.value) return

    try {
      // First upload the file (this will set the path automatically)
      const response = await putAttachmentFile(newFile.value, selectedNode.value.path)
      if (response) {
        // Second, fetch the updated SME to get the current state with the new path
        const updatedSmeData = await fetchSme(selectedNode.value.path)

        if (updatedSmeData) {
          // Third, update only the contentType
          const updatedFileObject = { ...updatedSmeData }

          // remove unwanted properties
          delete updatedFileObject.id
          delete updatedFileObject.timestamp
          delete updatedFileObject.conceptDescriptions
          delete updatedFileObject.path

          updatedFileObject.contentType = determineContentType(newFile.value, props.fileObject.contentType)

          // Convert to core works File type
          const instanceOrError = jsonization.fileFromJsonable(updatedFileObject)

          if (instanceOrError.error !== null) {
            console.error('Error parsing File SME:', instanceOrError.error)
            return
          }

          const fileSME = instanceOrError.mustValue()

          // Update the file SME with the correct content type
          await putSubmodelElement(fileSME, selectedNode.value.path)
        }

        // Refresh the SME data
        await fetchAndDispatchSme(selectedNode.value.path, false)
        newFile.value = null
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  function setFocus (e: boolean): void {
    isFocused.value = e
    if (!e) newPathValue.value = props.fileObject.value // set input to current value in the AAS if the input field is not focused
  }
</script>
