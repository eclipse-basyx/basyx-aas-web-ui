<template>
  <v-container class="pa-0 px-4" style="max-width: 1440px; min-width: 0">
    <StateView
      :empty="!policy && !isError && !isLoading"
      :empty-label="t('policies.policy.empty')"
      :error="!policy && isError && !!selectedPolicyVersion"
      :error-label="t('policies.policy.notFound')"
      :icon-empty="ICONS.POLICIES"
      :icon-error="ICONS.ERROR"
      :icon-size="128"
      :loading="isLoading"
      :loading-label="t('policies.policy.loading')"
      :loading-size="70"
      :loading-width="8"
    >
      <v-card border class="d-flex flex-column h-100 w-100 overflow-hidden" rounded>
        <v-card-title class="flex-0-0 px-2 py-2">
          <v-row class="d-flex align-center justify-space-between">
            <v-col class="d-flex align-center">
              <span class="text-headline-small mr-4" v-bind="i18nData('policies.policy.title')">
                {{ t("policies.policy.title", {version: selectedPolicyVersion }) }}
              </span>

              <PolicyStatus :status="policy!.status" />
            </v-col>

            <v-col>
              <v-tabs
                v-model="selectedView"
                color="primary"
                density="compact"
                mandatory
                @update:model-value="onChangeView"
              >
                <v-tab v-for="(v) in Object.values(VIEW)" :key="v" :value="v">
                  <v-icon start>{{ ICONS[v] }}</v-icon>
                  {{ t(`policies.policy.views.${v}`) }}
                </v-tab>
              </v-tabs>
            </v-col>

            <v-col cols="auto">
              <PolicyOptions icon-size="small" :policy="policy!" />
            </v-col>
          </v-row>
        </v-card-title>

        <v-divider />

        <Rules v-if="selectedView === VIEW.RULES" />
        <Definitions v-else-if="selectedView === VIEW.DEFINITIONS" />
      </v-card>
    </StateView>
  </v-container>
</template>

<script setup lang="ts">
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import { usePolicy } from '../../../hooks/usePolicy'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { VIEW } from '../../../types/view'
  import Definitions from '../../definition/Definitions.vue'
  import Rules from '../../rule/Rules.vue'
  import StateView from '../../shared/StateView.vue'
  import PolicyOptions from '../options/PolicyOptions.vue'
  import PolicyStatus from '../PolicyStatus.vue'

  const ICONS = {
    POLICIES: 'mdi-source-repository',
    ERROR: 'mdi-alert-circle-outline',
    [VIEW.DEFINITIONS]: 'mdi-book-open-variant',
    [VIEW.RULES]: 'mdi-playlist-check',
  } as const

  const { t, i18nData } = useAbacI18n()
  const { selectedView, onChangeView } = useAbacNavigation()
  const { selectedPolicyVersion, policy, isLoading, isError } = usePolicy()
</script>
