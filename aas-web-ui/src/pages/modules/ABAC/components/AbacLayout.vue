<script setup lang="ts">
  import { useQueryClient } from '@tanstack/vue-query'
  import { computed, watch } from 'vue'
  import { ABAC_CACHE_KEYS } from '@/composables/Client/ABAC/constants/cache'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import PolicyDetail from './policy/detail/PolicyDetail.vue'
  import PoliciesList from './policy/list/PoliciesList.vue'

  const queryClient = useQueryClient()
  const infrastructureStore = useInfrastructureStore()
  const selectedInfraId = computed(() => infrastructureStore.getSelectedInfrastructureId)

  watch(selectedInfraId, () => {
    // Invalidate all ABAC caches when infrastructure changes
    queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.ACTIVE_POLICY] })
    queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICIES] })
    queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY] })
    queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.RULES] })
    queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.DEFINITIONS] })
  })
</script>

<template>
  <div
    class="h-100 w-100 d-flex overflow-hidden"
    style="height: calc(100dvh - var(--v-layout-top, 64px) - var(--v-layout-bottom, 40px) - 2px);"
  >
    <PoliciesList />
    <PolicyDetail />
  </div>
</template>
