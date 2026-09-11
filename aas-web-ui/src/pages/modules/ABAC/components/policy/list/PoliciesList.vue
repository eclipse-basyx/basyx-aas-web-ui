<template>
  <v-card border class="d-flex flex-column h-100 list" rounded>
    <v-card-title class="px-2 py-2 ga-1 d-flex align-center">
      <v-tooltip location="bottom" :open-delay="600">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="{ ...tipProps, ...i18nData('policies.list.refresh') }"
            :icon="ICONS.REFRESH"
            :loading="isFetching"
            size="small"
            variant="text"
            @click="refetch()"
          />
        </template>

        {{ t('policies.list.refresh') }}
      </v-tooltip>

      <span v-bind="i18nData('policies.list.title')" class="text-subtitle-2">{{ t('policies.list.title') }}</span>

      <v-spacer />

      <ActionMenu v-if="hasItems(sortedPolicies)" v-model="isMenuOpen">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" :icon="ICONS.SORT" size="small" variant="text" />
        </template>

        <v-list-item
          v-for="option in sortOptions"
          :key="option.accessor"
          :active="sort.accessor === option.accessor"
          slim
          @click="onSort(option.accessor)"
        >
          <template #prepend>
            <v-icon :icon="option.icon" size="21" />
          </template>

          <v-list-item-subtitle v-bind="i18nData(option.i18n)">{{ t(option.i18n) }}</v-list-item-subtitle>

          <template #append>
            <v-icon
              v-if="sort.accessor === option.accessor"
              :icon="sort.order === 'asc' ? ICONS.ASC : ICONS.DESC"
              size="21"
            />
          </template>
        </v-list-item>
      </ActionMenu>

      <v-tooltip location="bottom" :open-delay="600">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="{ ...tipProps, ...i18nData('policies.list.import') }"
            :icon="ICONS.IMPORT"
            size="small"
            variant="text"
            @click="onImport"
          />
        </template>

        <span>{{ t('policies.list.import') }}</span>
      </v-tooltip>
    </v-card-title>

    <v-divider />

    <div class="flex-grow-1 overflow-y-auto bg-card">
      <v-alert
        v-if="isError"
        class="ma-4"
        density="compact"
        type="error"
        variant="tonal"
        v-bind="i18nData('policies.list.loadError')"
      >
        {{ t('policies.list.loadError') }}
      </v-alert>

      <v-list v-else-if="isLoading" bg-color="card" class="pa-0" nav>
        <PolicyItem v-for="i in 4" :key="i" loading />
      </v-list>

      <v-list
        v-else-if="hasItems(sortedPolicies)"
        bg-color="card"
        class="pa-0 pb-2"
        nav
      >
        <PolicyItem
          v-for="policy in sortedPolicies"
          :key="policy.version_id"
          :policy="policy"
        />
      </v-list>

      <v-container
        v-else
        class="h-100 d-flex flex-column align-center justify-center text-grey"
      >
        <v-icon class="mb-2" size="48">{{ ICONS.POLICIES }}</v-icon>
        <div class="text-caption" v-bind="i18nData('policies.list.empty')">{{ t('policies.list.empty') }}</div>
      </v-container>
    </div>

    <v-divider />

    <div class="d-flex align-center flex-row justify-space-between py-2 px-2">
      <v-btn
        density="comfortable"
        :icon="ICONS.COLLAPSE"
        size="small"
        variant="text"
        v-bind="i18nData('policies.list.collapseList')"
        @click="emit('collapse')"
      >
        <v-icon>{{ ICONS.COLLAPSE }}</v-icon>

        <v-tooltip activator="parent" location="bottom" :open-delay="600">
          {{ t('policies.list.collapseList') }}
        </v-tooltip>
      </v-btn>

      <ServiceSelector />
      <AbacConfigurator />
    </div>
  </v-card>

  <PolicyDialog ref="policyDialog" />
</template>

<script setup lang="ts">
  import type { Sort } from '../../../types/sort'
  import { hasItems } from '@/utils/array'
  import { useGetPolicies } from '../../../api/policy/useGetPolicies'
  import { useSortPolicies } from '../../../hooks/useSortPolicies'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import AbacConfigurator from '../../config/AbacConfigurator.vue'
  import ServiceSelector from '../../config/ServiceSelector.vue'
  import ActionMenu from '../../shared/menu/ActionMenu.vue'
  import PolicyDialog from '../PolicyDialog.vue'
  import PolicyItem from './PolicyItem.vue'

  const emit = defineEmits<{ collapse: [] }>()

  const ICONS = {
    IMPORT: 'mdi-file-import-outline',
    REFRESH: 'mdi-refresh',
    POLICIES: 'mdi-source-repository',
    SORT: 'mdi-sort',
    CREATED: 'mdi-calendar-clock',
    UPDATED: 'mdi-calendar-edit',
    DESC: 'mdi-arrow-down-thin',
    ASC: 'mdi-arrow-up-thin',
    COLLAPSE: 'mdi-chevron-double-left',
  } as const

  const { t, i18nData } = useAbacI18n()

  const isMenuOpen = ref(false)

  const { data: policies, isLoading, isError, isFetching, refetch } = useGetPolicies()

  const sortOptions: { accessor: Sort['accessor'], i18n: string, icon: string }[] = [
    { accessor: 'created_at', i18n: 'policies.list.sort.created', icon: ICONS.CREATED },
    { accessor: 'updated_at', i18n: 'policies.list.sort.updated', icon: ICONS.UPDATED },
    { accessor: 'status', i18n: 'policies.list.sort.status', icon: ICONS.SORT },
  ]
  const { sort, onSort, sortedPolicies } = useSortPolicies(policies)

  const policyDialog = useTemplateRef<InstanceType<typeof PolicyDialog>>('policyDialog')
  function onImport (): void {
    policyDialog.value?.open()
  }
</script>

<style scoped>
.list {
  width: 320px;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
