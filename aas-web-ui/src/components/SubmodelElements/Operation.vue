<template>
  <v-container class="pa-0" fluid>
    <v-card v-if="localOperationObject" class="mt-4" color="elevatedCard">
      <!-- Operation with Variable(s) -->
      <v-list
        v-if="
          localOperationObject.inputVariables?.length > 0 ||
            localOperationObject.inoutputVariables?.length > 0 ||
            localOperationObject.outputVariables?.length > 0
        "
        class="bg-elevatedCard py-0"
        nav
      >
        <!-- List with the Variable Types -->
        <v-container v-for="variableType in variableTypes" :key="variableType.id" class="ma-0 pa-0" fluid>
          <template
            v-if="
              localOperationObject[variableType.type] &&
                localOperationObject[variableType.type].length > 0
            "
          >
            <!-- Title of the Variable Type -->
            <v-list-item class="px-1 pb-1 pt-0">
              <v-list-item-title class="text-title-small mt-2">{{
                variableType.name + ':'
              }}</v-list-item-title>
            </v-list-item>
            <!-- List with the Fields belonging to the Variable Type -->
            <v-card v-for="(variable, i) in localOperationObject[variableType.type]" :key="i" class="mb-3">
              <!-- Variable Description -->
              <DescriptionElement
                v-if="variable.value && variable.value.description"
                :description-array="variable.value.description"
                :description-title="'Description'"
                :small="true"
              />

              <v-divider v-if="variable.value && variable.value.description" class="mt-1" />
              <!-- Variable Value -->
              <!-- Value Representation depending on the ModelType -->
              <Property
                v-if="variable.value.modelType === 'Property'"
                :is-editable="variablesEditable"
                :is-operation-variable="true"
                :property-object="variable.value"
                :variable-type="variableType.type"
                @update-value="updateOperationVariable($event, variable.value)"
              />

              <ReferenceElement
                v-else-if="variable.value.modelType === 'ReferenceElement'"
                :is-editable="variablesEditable"
                :is-operation-variable="true"
                :reference-element-object="variable.value"
                :variable-type="variableType.type"
                @update-value="
                  updateOperationVariable($event, variable.value)
                "
              />

              <SubmodelElementSummary v-else :element="variable.value" />
            </v-card>
          </template>
        </v-container>
      </v-list>
      <!-- Warning when Operation has no variable(s) -->
      <v-list v-else class="bg-elevatedCard pt-0" nav>
        <v-list-item>
          <v-list-item-title class="pt-2">
            <v-alert
              density="compact"
              text="Operation doesn't contain a Variable!"
              type="warning"
              variant="outlined"
            />
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider />
      <!-- Action Buttons for the Operation -->
      <v-list v-if="invocationAvailable" class="bg-elevatedCard pa-0" nav>
        <v-list-item>
          <template #append>
            <v-switch
              v-model="invokeAsynchronously"
              class="mr-3"
              color="primary"
              density="compact"
              :disabled="loading"
              hide-details
              label="Run asynchronously"
              title="Run in the background and poll for the result"
            />
            <!-- Clear-Button -->
            <v-btn
              v-if="isEditable"
              class="mr-3"
              color="primary"
              size="small"
              variant="outlined"
              @click="clearFields()"
            >clear</v-btn>
            <!-- Execute-Button -->
            <v-btn
              class="text-buttonText"
              color="primary"
              :loading="loading"
              size="small"
              @click="executeOperation()"
            >execute</v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-alert
        v-else
        class="ma-3"
        density="compact"
        type="info"
        variant="tonal"
      >
        This nested Operation is owned by another Operation. Invoke the repository-backed owning
        Operation instead.
      </v-alert>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { useNavigationStore } from '@/store/NavigationStore'

  // Stores
  const navigationStore = useNavigationStore()

  // Composables
  const { postRequest, getRequest, errorHandler } = useRequestHandling()

  const props = defineProps({
    operationObject: {
      type: Object,
      default: () => ({}),
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    invocationAvailable: {
      type: Boolean,
      default: true,
    },
  })

  const localOperationObject = ref({} as any)
  const variableTypes = ref([
    { type: 'inputVariables', name: 'Input Variables', id: 0 },
    { type: 'inoutputVariables', name: 'In-/Output Variables', id: 1 },
    { type: 'outputVariables', name: 'Output Variables', id: 2 },
  ])
  const loading = ref(false)
  const invokeAsynchronously = ref(true)
  const variablesEditable = computed(() => props.isEditable && props.invocationAvailable)
  let invocationController: AbortController | undefined
  let invocationGeneration = 0

  // Watchers
  watch(
    () => props.operationObject,
    () => {
      cancelInvocation()
      initOperation()
    },
    { deep: true },
  )

  onMounted(() => {
    initOperation()
  })

  onBeforeUnmount(() => {
    cancelInvocation()
  })

  // Function to initialize the Operation
  function initOperation (): void {
    // Create an independent local copy without the circular tree parent links.
    localOperationObject.value = JSON.parse(
      JSON.stringify(props.operationObject, (key, value) => key === 'parent' ? undefined : value),
    )

    // check if inputVariables, inoutputVariables or outputVariables exist (if not, create them as empty arrays)
    if (!localOperationObject.value.inputVariables) {
      localOperationObject.value.inputVariables = []
    }
    if (!localOperationObject.value.inoutputVariables) {
      localOperationObject.value.inoutputVariables = []
    }
    if (!localOperationObject.value.outputVariables) {
      localOperationObject.value.outputVariables = []
    }
  }

  function clearFields (): void {
    if (localOperationObject.value.inputVariables) {
      for (const variable of localOperationObject.value.inputVariables) {
        variable.value.value = null
      }
    }

    if (localOperationObject.value.inoutputVariables) {
      for (const variable of localOperationObject.value.inoutputVariables) {
        variable.value.value = null
      }
    }

    if (localOperationObject.value.outputVariables) {
      for (const variable of localOperationObject.value.outputVariables) {
        variable.value.value = null
      }
    }
  }

  // Function to execute the Operation
  async function executeOperation (): Promise<void> {
    cancelInvocation()

    const generation = ++invocationGeneration
    const controller = new AbortController()
    invocationController = controller
    const operation = {
      path: localOperationObject.value.path,
      modelType: localOperationObject.value.modelType,
      idShort: localOperationObject.value.idShort,
      inputArguments: localOperationObject.value.inputVariables,
      inoutputArguments: localOperationObject.value.inoutputVariables,
      invokeAsynchronously: invokeAsynchronously.value,
    }
    const timeoutSeconds = 60
    const timeoutMilliseconds = timeoutSeconds * 1000
    const startedAt = performance.now()
    let timedOut = false
    const timeoutId = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMilliseconds)
    const content = {
      inputArguments: operation.inputArguments,
      inoutputArguments: operation.inoutputArguments,
      clientTimeoutDuration: `PT${timeoutSeconds}S`,
    }
    const body = JSON.stringify(content)
    const headers = new Headers()
    headers.set('Accept', 'application/json')
    headers.set('Content-Type', 'application/json')
    const context = `invoking ${operation.modelType} "${operation.idShort}"`

    loading.value = true

    try {
      if (!operation.invokeAsynchronously) {
        await invokeSynchronously(operation.path, body, headers, context, generation, controller)
        return
      }

      const invokeResponse = await postRequest(
        `${operation.path}/invoke-async`,
        body,
        headers,
        context,
        false,
        false,
        {
          signal: controller.signal,
          suppressStatuses: [404, 405, 501],
        },
      )

      if (!isCurrentInvocation(generation, controller)) {
        return
      }

      if (!invokeResponse.success) {
        if ([404, 405, 501].includes(invokeResponse.status)) {
          await invokeSynchronously(operation.path, body, headers, context, generation, controller)
        }
        return
      }

      if (invokeResponse.status !== 202) {
        errorHandler(`Expected HTTP 202 from the asynchronous invocation, received ${invokeResponse.status}.`, context)
        return
      }

      const location = invokeResponse.raw?.headers.get('Location')
      if (!location) {
        errorHandler('The asynchronous invocation response did not include a Location header.', context)
        return
      }

      const statusUrl = resolveLocation(location, invokeResponse.raw?.url, `${operation.path}/invoke-async`)
      await pollOperationStatus(
        statusUrl,
        headers,
        context,
        `requesting operation status for ${operation.modelType} "${operation.idShort}"`,
        generation,
        controller,
        startedAt,
        timeoutMilliseconds,
      )
    } finally {
      window.clearTimeout(timeoutId)
      if (generation === invocationGeneration) {
        invocationController = undefined
        loading.value = false
        if (timedOut) {
          errorHandler(`Timeout exceeded (${timeoutSeconds}s)`, context)
        }
      }
    }
  }

  async function invokeSynchronously (
    operationPath: string,
    body: string,
    headers: Headers,
    context: string,
    generation: number,
    controller: AbortController,
  ): Promise<void> {
    const response = await postRequest(
      `${operationPath}/invoke`,
      body,
      headers,
      context,
      false,
      false,
      { signal: controller.signal },
    )

    if (isCurrentInvocation(generation, controller) && response.success) {
      handleOperationResult(response.data, context)
    }
  }

  async function pollOperationStatus (
    statusUrl: string,
    headers: Headers,
    context: string,
    statusContext: string,
    generation: number,
    controller: AbortController,
    startedAt: number,
    timeoutMilliseconds: number,
  ): Promise<void> {
    let pollingDelay = 0

    while (isCurrentInvocation(generation, controller)) {
      const remainingTime = timeoutMilliseconds - (performance.now() - startedAt)
      if (remainingTime <= 0) {
        return
      }

      if (pollingDelay > 0) {
        await waitForNextPoll(Math.min(pollingDelay, remainingTime), controller.signal)
        if (!isCurrentInvocation(generation, controller)) {
          return
        }
      }

      const response = await getRequest(
        statusUrl,
        statusContext,
        false,
        headers,
        { signal: controller.signal },
      )

      if (!isCurrentInvocation(generation, controller) || !response.success) {
        return
      }

      const result = response.data
      if (!result || typeof result !== 'object') {
        errorHandler('The operation status response did not contain an OperationResult.', context)
        return
      }

      if (result.success === false) {
        errorHandler(result.messages ?? result, context)
        return
      }

      if (result.executionState === 'Initiated' || result.executionState === 'Running') {
        pollingDelay = pollingDelay === 0 ? 100 : Math.min(pollingDelay * 2, 5000)
        continue
      }

      handleOperationResult(result, context)
      return
    }
  }

  function handleOperationResult (result: any, context: string): void {
    if (!result || typeof result !== 'object') {
      errorHandler('The server did not return an OperationResult.', context)
      return
    }

    if (result.executionState !== 'Completed' || result.success === false) {
      const state = result.executionState ?? 'unknown'
      errorHandler(result.messages ?? `Operation finished with execution state "${state}".`, context)
      return
    }

    if (result.inoutputArguments) {
      localOperationObject.value.inoutputVariables = result.inoutputArguments
    }
    if (result.outputArguments) {
      localOperationObject.value.outputVariables = result.outputArguments
    }

    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 4000,
      color: 'success',
      btnColor: 'buttonText',
      text: 'Operation executed successfully.',
    })
    refreshWebUi()
  }

  function resolveLocation (location: string, responseUrl: string | undefined, requestUrl: string): string {
    const baseUrl = responseUrl || new URL(requestUrl, window.location.href).href
    return new URL(location, baseUrl).href
  }

  function waitForNextPoll (delay: number, signal: AbortSignal): Promise<void> {
    return new Promise(resolve => {
      const finish = () => {
        window.clearTimeout(timeoutId)
        signal.removeEventListener('abort', finish)
        resolve()
      }
      const timeoutId = window.setTimeout(finish, delay)
      signal.addEventListener('abort', finish, { once: true })
    })
  }

  function isCurrentInvocation (generation: number, controller: AbortController): boolean {
    return generation === invocationGeneration && !controller.signal.aborted
  }

  function cancelInvocation (): void {
    invocationGeneration++
    invocationController?.abort()
    invocationController = undefined
    loading.value = false
  }

  function updateOperationVariable (e: any, variable: any): void {
    // console.log('updateOperationVariable: ', 'new Value: ', e, ' Variable: ', variable);
    variable.value = variable.valueType === 'xs:boolean' && typeof e === 'boolean' ? e.toString() : e
  }

  function refreshWebUi (): void {
    if (localOperationObject.value.qualifiers) {
      const refreshQualifier = localOperationObject.value.qualifiers.find(
        (qualifier: any) => qualifier.type === 'refreshWebUi',
      )
      if (refreshQualifier && refreshQualifier.value === 'true') {
        navigationStore.dispatchTriggerAASListReload()
        navigationStore.dispatchTriggerTreeviewReload()
      }
    }
  }
</script>
