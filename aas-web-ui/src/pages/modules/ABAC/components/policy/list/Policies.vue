<script setup lang="ts">
  import type { Sort } from '../../../types/sort'
  import { computed, ref, useTemplateRef } from 'vue'
  import { useTheme } from 'vuetify'
  import { useGetPolicies } from '@/composables/Client/ABAC/queries/policy/useGetPolicies'
  import { hasItems } from '@/utils/array'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import { useSortPolicies } from '../../../hooks/useSortPolicies'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import PolicyDialog from '../PolicyDialog.vue'
  import PolicyStatus from '../PolicyStatus.vue'

  const ICONS = {
    IMPORT: 'mdi-file-import-outline',
    REFRESH: 'mdi-refresh',
    POLICIES: 'mdi-source-repository',
    SORT: 'mdi-sort',
    CREATED: 'mdi-calendar-clock',
    UPDATED: 'mdi-calendar-edit',
    DESC: 'mdi-arrow-down-thin',
    ASC: 'mdi-arrow-up-thin',
  } as const

  const { t, i18nData } = useAbacI18n()
  const theme = useTheme()
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)

  const isMenuOpen = ref(false)

  const { data: policies, isLoading, isError, isFetching, refetch } = useGetPolicies()

  const sortOptions: { accessor: Sort['accessor'], i18n: string, icon: string }[] = [
    { accessor: 'created_at', i18n: 'policies.list.sort.created', icon: ICONS.CREATED },
    { accessor: 'updated_at', i18n: 'policies.list.sort.updated', icon: ICONS.UPDATED },
    { accessor: 'status', i18n: 'policies.list.sort.status', icon: ICONS.SORT },
  ]
  const { sort, onSort, sortedPolicies } = useSortPolicies(policies)

  const { selectedPolicyVersion, onSelectPolicy } = useAbacNavigation()
  function isSelected (id?: number): boolean {
    return selectedPolicyVersion.value?.toString() === id?.toString()
  }

  const policyDialog = useTemplateRef<InstanceType<typeof PolicyDialog>>('policyDialog')
  function onImport (): void {
    policyDialog.value?.open()
  }

</script>

<template>
  <v-card class="h-100 d-flex flex-column" variant="flat">
    <v-card-title class="px-2 py-2 d-flex align-center">
      <v-tooltip location="bottom" :open-delay="600">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="{ ...tipProps, ...i18nData('policies.list.refresh') }"
            :icon="ICONS.REFRESH"
            :loading="isFetching"
            variant="text"
            @click="refetch()"
          />
        </template>

        <span>{{ t('policies.list.refresh') }}</span>
      </v-tooltip>

      <span v-bind="i18nData('policies.list.title')" class="text-subtitle-2">{{ t('policies.list.title') }}</span>

      <v-spacer />

      <v-menu v-if="hasItems(sortedPolicies)" v-model="isMenuOpen">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" :icon="ICONS.SORT" variant="text" />
        </template>

        <v-sheet border>
          <v-list class="py-0" density="compact">
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

              <v-list-item-title v-bind="i18nData(option.i18n)">{{ t(option.i18n) }}</v-list-item-title>

              <template #append>
                <v-icon
                  v-if="sort.accessor === option.accessor"
                  :icon="sort.order === 'asc' ? ICONS.ASC : ICONS.DESC"
                  size="21"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-sheet>
      </v-menu>

      <v-tooltip location="bottom" :open-delay="600">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="{ ...tipProps, ...i18nData('policies.list.import') }"
            :icon="ICONS.IMPORT"
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
        <v-list-item
          v-for="i in 4"
          :key="i"
          class="mt-2 mx-2 pa-0"
          color="primarySurface"
          :style="{
            'border':'1px solid',
            'border-color': isDark ? '#686868 !important' : '#ABABAB !important',
          }"
        >
          <v-skeleton-loader type="list-item-three-line" />
        </v-list-item>
      </v-list>

      <v-list
        v-else-if="hasItems(sortedPolicies)"
        bg-color="card"
        class="pa-0"
        nav
      >
        <v-list-item
          v-for="({version_id, policy_id, status }) in sortedPolicies"
          :key="version_id"
          :active="isSelected(version_id)"
          base-color="listItem"
          :border="isSelected(version_id) ? 'primary' : 'listItem thin'"
          class="mt-2 mx-2"
          color="primarySurface"
          :style="{
            'border':'1px solid',
            'border-color': isSelected(version_id)
              ? primaryColor + ' !important'
              : isDark ? '#686868 !important' : '#ABABAB !important',
          }"
          variant="tonal"
          @click="onSelectPolicy(version_id)"
        >

          <v-list-item-title class="d-flex align-center text-primary pb-2">
            <span class="text-title-small">v{{ version_id }}</span>
            <v-spacer />
            <PolicyStatus :status="status" />
          </v-list-item-title>

          <v-list-item-subtitle class="text-listItemText">
            {{ policy_id }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <v-container
        v-else
        class="h-100 d-flex flex-column align-center justify-center text-grey"
      >
        <v-icon class="mb-2" size="48">{{ ICONS.POLICIES }}</v-icon>
        <div class="text-caption" v-bind="i18nData('policies.list.empty')">{{ t('policies.list.empty') }}</div>
      </v-container>
    </div>
  </v-card>

  <PolicyDialog ref="policyDialog" />
</template>
