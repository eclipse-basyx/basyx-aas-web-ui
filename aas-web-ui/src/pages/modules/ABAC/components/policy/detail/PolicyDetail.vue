<script setup lang="ts">
  import { formatDate } from '@/utils/DateUtils'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import { usePolicy } from '../../../hooks/usePolicy'
  import { useRules } from '../../../hooks/useRules'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { VIEW } from '../../../types/view'
  import Definitions from '../../definition/Definitions.vue'
  import Rules from '../../rule/Rules.vue'
  import PolicyStatus from '../PolicyStatus.vue'
  import PolicyActions from './PolicyActions.vue'
  import PolicyRaw from './PolicyRaw.vue'

  const ICONS = {
    RULES: 'mdi-playlist-check',
    SCOPE: 'mdi-server',
    CREATED: 'mdi-calendar-clock',
    UPDATED: 'mdi-calendar-edit',
    POLICIES: 'mdi-source-repository',
    [VIEW.DEFINITIONS]: 'mdi-book-open-variant',
    [VIEW.RULES]: 'mdi-playlist-check',
    [VIEW.RAW]: 'mdi-code-json',
  } as const

  const { t, i18nData } = useAbacI18n()
  const { selectedView, onChangeView } = useAbacNavigation()
  const { selectedPolicyVersion, policy, isLoading } = usePolicy()
  const { rulesCount } = useRules()
</script>

<template>
  <div v-if="policy" class="d-flex flex-column h-100 w-100 overflow-hidden">
    <v-card class="flex-0-0" variant="flat">
      <v-card-title class="px-2">
        <v-row class="ga-3">
          <v-col class="d-flex align-center ga-4" cols="12">
            <span class="text-primary text-headline-small" v-bind="i18nData('policies.policy.title')">
              {{ t("policies.policy.title", {version: selectedPolicyVersion }) }}
            </span>

            <PolicyStatus :status="policy.status" />
          </v-col>

          <v-col class="d-flex flex-wrap align-center ga-2" cols="12">
            <v-chip density="comfortable" v-bind="i18nData('policies.policy.ruleCount')" variant="elevated">
              <v-icon :icon="ICONS.RULES" start />
              {{ t("policies.policy.ruleCount", {count: rulesCount}) }}
            </v-chip>

            <v-chip density="comfortable" variant="elevated">
              <v-icon :icon="ICONS.SCOPE" start />
              {{ policy.service_scope ?? '—' }}
            </v-chip>

            <v-chip density="comfortable" variant="elevated">
              <v-icon :icon="ICONS.CREATED" start />
              {{ policy.created_at ? formatDate(new Date (policy.created_at)): '—' }}
            </v-chip>

            <v-chip density="comfortable" variant="elevated">
              <v-icon :icon="ICONS.UPDATED" start />
              {{ policy.updated_at ? formatDate(new Date (policy.updated_at)): '—' }}
            </v-chip>
          </v-col>

          <v-col cols="12">
            <PolicyActions />
          </v-col>

          <v-col cols="12">
            <v-btn-toggle
              v-model="selectedView"
              color="primary"
              density="compact"
              divided
              mandatory
              variant="outlined"
              @update:model-value="onChangeView"
            >
              <v-btn v-for="(v) in Object.values(VIEW)" :key="v" :value="v">
                <v-icon start>{{ ICONS[v] }}</v-icon>

                <span class="hidden-sm-and-down" v-bind="i18nData(`policies.policy.views.${v}`)">
                  {{ t(`policies.policy.views.${v}`) }}
                </span>
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-title>

    </v-card>

    <v-divider />

    <div class="flex-1-1 d-flex flex-column" style="min-height: 0;">
      <div class="d-flex flex-column flex-1-1" style="min-height: 0;" variant="elevated">
        <template v-if="selectedView === VIEW.RULES">
          <Rules />
        </template>

        <template v-else-if="selectedView === VIEW.DEFINITIONS">
          <Definitions />
        </template>

        <template v-else-if="selectedView === VIEW.RAW">
          <PolicyRaw />
        </template>
      </div>
    </div>
  </div>

  <v-container v-else-if="isLoading" class="h-100 d-flex align-center justify-center">
    <v-progress-circular color="primary" indeterminate />
  </v-container>

  <v-container v-else class="h-100 d-flex flex-column align-center justify-center text-grey">
    <v-icon class="mb-4" size="128">{{ ICONS.POLICIES }}</v-icon>
    <h2 class="text-h5" v-bind="i18nData('policies.policy.empty')">{{ t('policies.policy.empty') }}</h2>
  </v-container>
</template>
