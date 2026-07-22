<script lang="ts" setup>
  import type { Rule } from '../../utils/zodRule'
  import type { Endpoint } from '@/composables/Client/CompanyLookup/types/company'
  import { AAS_INTERFACES, PROTOCOLS } from '../../constants/endpoint'
  import { useCompanyLookupI18n } from '../../i18n/useCompanyLookupI18n'
  import { emptyEndpoint } from '../../utils/form'

  const endpoints = defineModel<Endpoint[]>({ required: true })
  defineProps<{ interfaceRule: Rule<string>, hrefRule: Rule<string> }>()

  const { t } = useCompanyLookupI18n()

  function onAdd (): void {
    endpoints.value = [...endpoints.value, emptyEndpoint()]
  }

  function onRemove (i: number): void {
    if (endpoints.value.length <= 1) return
    endpoints.value = endpoints.value.filter((_, idx) => idx !== i)
  }
</script>

<template>
  <div>
    <span class="text-title-small">{{ `${t('form.field.endpoints')} *` }}</span>

    <v-row v-for="(endpoint, i) in endpoints" :key="i" class="mt-4 mb-2 align-center">
      <v-col>
        <v-row class="ga-2 justify-space-between">
          <v-col cols="12">
            <v-select
              :id="`endpoint-${i}-interface`"
              v-model="endpoint.interface"
              density="comfortable"
              :items="[...AAS_INTERFACES]"
              :label="`${t('form.field.interface')} *`"
              :rules="[interfaceRule]"
              variant="outlined"
            />
          </v-col>

          <v-col cols="4">
            <v-combobox
              :id="`endpoint-${i}-protocolInformation.endpointProtocol`"
              v-model="endpoint.protocolInformation.endpointProtocol"

              auto-select-first
              density="comfortable"
              hide-no-data
              :items="[...PROTOCOLS]"
              :label="t('form.field.protocol')"
              variant="outlined"
            />
          </v-col>

          <v-col cols="8">
            <v-text-field
              :id="`endpoint-${i}-protocolInformation.href`"
              v-model="endpoint.protocolInformation.href"
              density="comfortable"
              :label="`${t('form.field.href')} *`"
              :rules="[hrefRule]"
              variant="outlined"
            />

          </v-col>
        </v-row>
      </v-col>

      <v-col cols="auto">
        <v-btn
          v-if="endpoints.length > 1"
          color="error"
          density="comfortable"
          icon="mdi-delete"
          size="small"
          variant="text"
          @click="onRemove(i)"
        /></v-col>
    </v-row>

    <v-btn
      color="primary"
      prepend-icon="mdi-plus"
      variant="outlined"
      @click="onAdd"
    >
      {{ t('form.action.addEndpoint') }}
    </v-btn>
  </div>
</template>
