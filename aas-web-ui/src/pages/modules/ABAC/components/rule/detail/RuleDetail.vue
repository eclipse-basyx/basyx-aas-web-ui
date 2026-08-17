<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRules } from '../../../hooks/useRules'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import JsonCodeEditor from '../../shared/JsonCodeEditor.vue'
  import RuleComplexityBadge from '../RuleComplexityBadge.vue'

  const VIEW = {
    CONFIGURED: 'configured',
    MATERIALIZED: 'materialized',
  } as const

  type ViewType = typeof VIEW[keyof typeof VIEW]

  const ICONS = {
    RULES: 'mdi-playlist-check',
    [VIEW.CONFIGURED]: 'mdi-playlist-check',
    [VIEW.MATERIALIZED]: 'mdi-code-json',
  } as const

  const { t, i18nData } = useAbacI18n()

  const { selectedRule } = useRules()

  const selectedView = ref<ViewType>(VIEW.CONFIGURED)
  function onChangeView (value: ViewType): void {
    selectedView.value = value
  }

  const ruleJson = computed(() => {
    if (!selectedRule.value) return ''
    const json = selectedView.value === VIEW.CONFIGURED
      ? selectedRule.value.configured_rule_json
      : selectedRule.value.materialized_rule_json
    return JSON.stringify(json, null, 2)
  })
</script>

<template>
  <v-card class="h-100 d-flex flex-column" variant="flat">
    <template v-if="selectedRule">
      <v-card-title class="d-flex align-center pa-2 ga-2">
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

            <span class="hidden-sm-and-down" v-bind="i18nData(`rules.views.${v}`)">
              {{ t(`rules.views.${v}`) }}
            </span>
          </v-btn>
        </v-btn-toggle>

        <RuleComplexityBadge v-if="selectedRule?.configured_rule_json?.FORMULA" :rule="selectedRule" />
      </v-card-title>

      <v-divider />

      <v-card-text class="d-flex flex-column flex-1-1 bg-card pa-2" style="min-height: 0;">
        <JsonCodeEditor disabled :model-value="ruleJson" />
      </v-card-text>
    </template>

    <v-card-text v-else class="d-flex flex-column align-center justify-center text-grey">
      <v-icon class="mb-2" size="48">{{ ICONS.RULES }}</v-icon>
      <div>{{ t('rules.emptyRule') }}</div>
    </v-card-text>
  </v-card>
</template>
