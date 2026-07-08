<template>
  <div class="overflow-x-auto">
    <v-table class="border rounded" density="comfortable">
      <thead class="bg-tableHeader">
        <tr>
          <th class="text-titleText">Interface</th>
          <th class="text-titleText">Endpoint</th>
          <th class="text-titleText">Protocol</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="endpoint in endpoints" :key="`${endpoint.interfaceName}-${endpoint.href}`">
          <td class="text-body-small text-break">{{ endpoint.interfaceName }}</td>
          <td class="text-body-small text-break">{{ endpoint.href }}</td>
          <td class="text-body-small text-break">{{ endpoint.endpointProtocol || '-' }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts" setup>
  import type { EndpointRow } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  withDefaults(defineProps<{
    endpoints?: EndpointRow[]
  }>(), {
    endpoints: () => [],
  })
</script>
