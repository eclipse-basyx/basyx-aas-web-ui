<template>
  <v-container />
</template>

<script lang="ts" setup>
  import { computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useEnvStore } from '@/store/EnvironmentStore'

  const router = useRouter()
  const envStore = useEnvStore()

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'Company Data',
    needsInfrastructureEndpoints: ['CompanyLookup'],
    needsEnvVariables: ['COMPANY_LOOKUP_DOMAIN'],
  })

  const companyId = computed(() => envStore.getCompanyLookupDomain)

  onMounted(() => {
    if (companyId.value) {
      router.replace({
        path: '/modules/companylookup',
        query: {
          id: companyId.value,
          view: 'detailsOnly',
        },
      })
    }
  })
</script>
