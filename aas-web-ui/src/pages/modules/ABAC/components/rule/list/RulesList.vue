<script setup lang="ts">
  import { hasItems } from '@/utils/array'
  import { useRules } from '../../../hooks/useRules'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import RuleItem from './RuleItem.vue'

  const ICONS = {
    ADD: 'mdi-plus',
    RULES: 'mdi-playlist-check',
  } as const

  const emit = defineEmits<{ (e: 'create'): void }>()

  const { t, i18nData } = useAbacI18n()
  const { rules, isLoading, isError } = useRules()

</script>

<template>
  <v-card class="h-100 d-flex flex-column" variant="flat">
    <v-card-title class="pa-2 d-flex align-center">
      <span class="text-subtitle-2">{{ t('rules.title') }}</span>

      <v-spacer />

      <v-tooltip location="bottom" :open-delay="600">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="tipProps"
            density="comfortable"
            :icon="ICONS.ADD"
            size="small"
            variant="text"
            @click="emit('create')"
          />
        </template>

        <span v-bind="i18nData('rules.newRule')">{{ t('rules.newRule') }}</span>
      </v-tooltip>
    </v-card-title>

    <v-divider />

    <div class="flex-grow-1 overflow-y-auto">
      <v-alert
        v-if="isError"
        class="ma-4"
        density="compact"
        type="error"
        variant="tonal"
        v-bind="i18nData('rules.loadError')"
      >
        {{ t('rules.loadError') }}
      </v-alert>

      <v-list v-else-if="isLoading" class="pa-0 bg-dark" nav>
        <RuleItem v-for="i in 4" :key="i" loading />
      </v-list>

      <v-list
        v-else-if="hasItems(rules)"
        class="pa-0 h-100 bg-card"
        nav
      >
        <RuleItem v-for="(rule) in rules" :key="rule.rule_index" :rule="rule" />
      </v-list>

      <v-container
        v-else
        class="h-100 d-flex flex-column align-center justify-center text-grey"
      >
        <v-icon class="mb-2" size="48">{{ ICONS.RULES }}</v-icon>

        <div class="text-caption" v-bind="i18nData('rules.empty')">
          {{ t('rules.empty') }}
        </div>
      </v-container>
    </div>
  </v-card>
</template>
