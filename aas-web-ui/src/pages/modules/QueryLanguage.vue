<template>
  <v-container class="pa-md-12">
    <h1 class="mb-5">Query Language Test Module</h1>

    <v-menu>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          class="mb-2"
          color="primary"
          size="small"
          variant="outlined"
        >
          {{ selectedEndpoint ? getSelectedEndpointTitle() : 'Select API Component' }}
          <v-icon end>mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-list border nav rounded slim>
        <v-list-item
          v-for="endpoint in availableEndpoints"
          :key="endpoint.value"
          class="rounded"
          @click="selectedEndpoint = endpoint.value"
        >
          <v-list-item-title>{{ endpoint.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ endpoint.url }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-menu>

    <QueryLanguageEditor
      v-model="queryText"
      @validation-change="updateQueryValidation"
    />

    <v-card-actions class="pa-0">
      <v-spacer />

      <v-btn
        class="text-buttonText"
        color="primary"
        :disabled="!queryValidation.isValid"
        text="Execute Query"
        variant="elevated"
        @click="executeQuery"
      />
    </v-card-actions>

    <!-- Query Response Display -->
    <v-textarea
      v-if="queryResponse"
      v-model="queryResponse"
      bg-color="surface"
      class="mt-4"
      density="compact"
      flat
      label="Query Response"
      readonly
      rows="15"
      variant="outlined"
    />
  </v-container>
</template>

<script lang="ts" setup>
  import type { QueryLanguageValidation } from '@/pages/modules/queryLanguage/queryLanguageValidation'
  import type { QueryTarget } from '@/types/QueryLanguage'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { buildQueryEndpoint } from '@/utils/QueryLanguageUtils'

  const infrastructureStore = useInfrastructureStore()

  const { postRequest } = useRequestHandling()

  // Selected endpoint for the query
  const selectedEndpoint = ref('')

  // Query text and schema validation
  const queryText = ref('')
  const queryValidation = ref<QueryLanguageValidation>({
    isValid: false,
    messages: [],
  })

  // Query response
  const queryResponse = ref('')

  function transformUrlForQuery (url: string, componentType: string): string {
    if (url.trim() === '') return ''

    const targetMap: Partial<Record<string, QueryTarget>> = {
      'aas-registry': 'aas-registry',
      'aas-repo': 'aas-repository',
      'submodel-repo': 'submodel-repository',
    }
    const target = targetMap[componentType]
    if (target) return buildQueryEndpoint(url, target)

    let transformedUrl = url.trim().replace(/\/$/, '')
    switch (componentType) {
      case 'submodel-registry': {
        transformedUrl = transformedUrl.replace(/\/submodel-descriptors$/, '') + '/query/submodel-descriptors'
        break
      }
      case 'cd-repo': {
        // Transform concept-descriptions to query/concept-descriptions or add /query/concept-descriptions
        transformedUrl = transformedUrl.replace(/\/concept-descriptions$/, '') + '/query/concept-descriptions'
        break
      }
      default: {
        break
      }
    }

    return transformedUrl
  }

  // Computed prop to get available endpoints from the store
  const availableEndpoints = computed(() => {
    const endpoints = [
      {
        title: 'AAS Registry',
        value: 'aas-registry',
        url: transformUrlForQuery(infrastructureStore.getAASRegistryURL, 'aas-registry'),
      },
      {
        title: 'Submodel Registry',
        value: 'submodel-registry',
        url: transformUrlForQuery(infrastructureStore.getSubmodelRegistryURL, 'submodel-registry'),
      },
      {
        title: 'AAS Repository',
        value: 'aas-repo',
        url: transformUrlForQuery(infrastructureStore.getAASRepoURL, 'aas-repo'),
      },
      {
        title: 'Submodel Repository',
        value: 'submodel-repo',
        url: transformUrlForQuery(infrastructureStore.getSubmodelRepoURL, 'submodel-repo'),
      },
      {
        title: 'Concept Description Repository',
        value: 'cd-repo',
        url: transformUrlForQuery(infrastructureStore.getConceptDescriptionRepoURL, 'cd-repo'),
      },
    ]

    // Filter out endpoints that don't have a valid URL
    return endpoints.filter(endpoint => endpoint.url && endpoint.url.trim() !== '')
  })

  // Helper function to get the title of the selected endpoint
  function getSelectedEndpointTitle (): string {
    const endpoint = availableEndpoints.value.find(ep => ep.value === selectedEndpoint.value)
    return endpoint ? endpoint.title : ''
  }

  function updateQueryValidation (validation: QueryLanguageValidation): void {
    queryValidation.value = validation
  }

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'Query Language', // optional module title
  })

  async function executeQuery (): Promise<void> {
    if (!selectedEndpoint.value) {
      queryResponse.value = 'Error: Please select an API component.'
      return
    }

    if (!queryValidation.value.isValid || queryText.value.trim() === '') {
      queryResponse.value = 'Error: Please enter a query that is valid against the AAS Query Language schema.'
      return
    }

    const endpoint = availableEndpoints.value.find(ep => ep.value === selectedEndpoint.value)
    if (!endpoint) {
      queryResponse.value = 'Error: Selected endpoint is not valid.'
      return
    }

    try {
      queryResponse.value = 'Executing query...'

      const requestHeaders = new Headers()
      requestHeaders.append('Content-Type', 'application/json')

      const path = endpoint.url
      const content = queryText.value
      const headers = requestHeaders
      const context = 'executing query'
      const disableMessage = false
      // send the request
      await postRequest(path, content, headers, context, disableMessage, true).then((response: unknown) => {
        const res = response as { success: boolean, data?: unknown, message?: string }
        queryResponse.value = res.success ? JSON.stringify(res.data, null, 2) : `Query failed: ${res.message || 'Unknown error'}`
      })
    } catch (error) {
      queryResponse.value = `Error executing query: ${(error as Error).message}`
    }
  }
</script>
