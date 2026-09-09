<template>
  <div v-if="policy" class="flex-grow-1 d-flex flex-column">
    <v-card variant="flat">
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

    <Rules v-if="selectedView === VIEW.RULES" />
    <Definitions v-else-if="selectedView === VIEW.DEFINITIONS" />
    <PolicyRaw v-else-if="selectedView === VIEW.RAW" />
  </div>

  <v-container v-else-if="isLoading" class="h-100 d-flex align-center justify-center">
    <v-progress-circular color="primary" indeterminate />
  </v-container>

  <v-container v-else class="d-flex flex-column align-center justify-center text-grey fill-height">
    <v-icon class="mb-4" size="128">{{ ICONS.POLICIES }}</v-icon>
    <h2 class="text-h5" v-bind="i18nData('policies.policy.empty')">{{ t('policies.policy.empty') }}</h2>
  </v-container>
</template>

<script setup lang="ts">
  import Definitions from '@/pages/modules/ABAC/components/definition/Definitions.vue'
  import PolicyActions from '@/pages/modules/ABAC/components/policy/detail/PolicyActions.vue'
  import PolicyRaw from '@/pages/modules/ABAC/components/policy/detail/PolicyRaw.vue'
  import PolicyStatus from '@/pages/modules/ABAC/components/policy/PolicyStatus.vue'
  import Rules from '@/pages/modules/ABAC/components/rule/Rules.vue'
  import { useAbacNavigation } from '@/pages/modules/ABAC/hooks/useAbacNavigation'
  import { usePolicy } from '@/pages/modules/ABAC/hooks/usePolicy'
  import { useRules } from '@/pages/modules/ABAC/hooks/useRules'
  import { useAbacI18n } from '@/pages/modules/ABAC/i18n/useAbacI18n'
  import { VIEW } from '@/pages/modules/ABAC/types/view'
  import { formatDate } from '@/utils/DateUtils'

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
