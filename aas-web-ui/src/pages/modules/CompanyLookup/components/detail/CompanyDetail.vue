<script setup lang="ts">
  import type { ViewType } from '../../constants/view'
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGetCompany } from '@/composables/Client/CompanyLookup/queries/useGetCompany'
  import CompanyOptions from '../../components/options/CompanyOptions.vue'
  import { VIEW, VIEWS } from '../../constants/view'
  import { useCompanyLookupI18n } from '../../i18n/useCompanyLookupI18n'
  import { hasItems } from '../../utils/array'
  import CompanyJsonView from './CompanyJsonView.vue'
  import CompanyProperty from './CompanyProperty.vue'

  const props = withDefaults(defineProps<{
    detailsOnly?: boolean
  }>(), {
    detailsOnly: false,
  })

  const { t } = useCompanyLookupI18n()
  const route = useRoute()
  const router = useRouter()

  const view = ref<ViewType>(
    !props.detailsOnly && VIEWS.includes(route.query.view as string)
      ? (route.query.view as ViewType)
      : VIEW.DETAILS,
  )

  const selectedId = computed(() => {
    const paramId = route.query.id as string | undefined
    return paramId ? decodeURIComponent(paramId) : undefined
  })

  const { data: company, isLoading } = useGetCompany(selectedId)

  watch(
    [() => route.query.view, () => props.detailsOnly],
    ([v, detailsOnly]) => {
      if (detailsOnly) {
        view.value = VIEW.DETAILS
      } else if (v && VIEWS.includes(v as string)) {
        view.value = v as ViewType
      } else {
        view.value = VIEW.DETAILS
      }
    },
  )

  function onChangeView (value: string): void {
    if (route.query.view === value) return
    router.replace({ query: { ...route.query, view: value } })
  }
</script>

<template>
  <div v-if="company">

    <template v-if="!props.detailsOnly">
      <v-card class="h-100 d-flex flex-column" variant="flat">

        <v-card-title class="d-flex align-center justify-space-between" style="gap: 12px; height: 64px;">
          <v-btn-toggle
            v-model="view"
            color="primary"
            density="compact"
            divided
            mandatory
            style="height: 32px"
            variant="outlined"
            @update:model-value="onChangeView"
          >
            <v-btn :value="VIEW.DETAILS">
              <v-icon start>mdi-folder-edit-outline</v-icon>
              <span class="hidden-sm-and-down">{{ t('detail.view.details') }}</span>
            </v-btn>

            <v-btn :value="VIEW.JSON">
              <v-icon start>mdi-code-block-braces</v-icon>
              <span class="hidden-sm-and-down">{{ t('detail.view.json') }}</span>
            </v-btn>
          </v-btn-toggle>

          <CompanyOptions :company="company" :read-only="props.detailsOnly" />
        </v-card-title>
      </v-card>

      <v-divider />
    </template>

    <div class="flex-grow-1 overflow-y-auto py-2 px-2">
      <template v-if="view === VIEW.DETAILS">
        <v-card variant="elevated">
          <v-card-text class="pb-1">
            <span class="text-primary text-body-large">{{ company.name ?? t('detail.fallbackName') }}</span>
          </v-card-text>

          <v-list>
            <CompanyProperty :title="t('detail.fields.idShort')" :value="company.idShort" />
            <CompanyProperty :title="t('detail.fields.domain')" :value="company.domain" />
            <CompanyProperty :title="t('detail.fields.nameOptions')" :value="company.nameOptions" />
            <CompanyProperty :title="t('detail.fields.assetIdRegexPatterns')" :value="company.assetIdRegexPatterns" />

            <v-list-item v-if="hasItems(company.displayName)" class="px-0">
              <DescriptionElement
                :description-array="company.displayName"
                :description-title="t('detail.fields.displayName')"
                multiline
                :small="false"
              />

              <div class="pt-2 px-4">
                <v-divider />
              </div>
            </v-list-item>

            <v-list-item v-if="hasItems(company.description)" class="px-0">
              <DescriptionElement
                :description-array="company.description"
                :description-title="t('detail.fields.description')"
                multiline
                :small="false"
              />

              <div class="pt-2 px-4">
                <v-divider />
              </div>
            </v-list-item>

            <v-list-item v-if="hasItems(company.endpoints)" class="px-0">
              <v-list-item-title class="text-title-small px-4">
                {{ t('detail.fields.endpoints') }}
              </v-list-item-title>

              <v-row v-for="({interface:inter, protocolInformation}, i) in company.endpoints" :key="inter" class="align-center px-4 ga-0 mt-0">
                <v-col cols="auto">
                  <v-chip border label size="x-small">{{ protocolInformation.endpointProtocol ?? "—" }}</v-chip>
                </v-col>

                <v-col>
                  <CompanyProperty :hide-divider="i === company.endpoints.length-1" :title="inter" :value="protocolInformation.href" />
                </v-col>
              </v-row>

              <div class="px-4">
                <v-divider />
              </div>

            </v-list-item>

            <v-list-item v-if="company.administration" class="px-2">
              <AdministrativeInformationElement
                :administrative-information-object="company.administration"
                :administrative-information-title="t('detail.fields.administration')"
                :small="false"
              />

              <div class="pt-2 px-2">
                <v-divider />
              </div>
            </v-list-item>

          </v-list>
        </v-card>
      </template>

      <template v-else-if="view === VIEW.JSON">
        <CompanyJsonView :company="company" />
      </template>
    </div>
  </div>

  <v-container v-else-if="isLoading" class="h-100 d-flex align-center justify-center">
    <v-progress-circular color="primary" indeterminate />
  </v-container>

  <v-container v-else class="h-100 d-flex flex-column align-center justify-center text-grey">
    <v-icon class="mb-4" size="128">mdi-office-building-cog</v-icon>
    <h2 class="text-h5">{{ t('detail.empty') }}</h2>
  </v-container>
</template>
