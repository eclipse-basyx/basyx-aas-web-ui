<script setup lang="ts">
  import type { CompanyDescriptor } from '@/composables/Client/CompanyLookup/types/company'
  import { computed, ref, useTemplateRef } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { useGetAllCompanies } from '@/composables/Client/CompanyLookup/queries/useGetAllCompanies'
  import { hasContent } from '@/utils/StringUtils'
  import { useCompanyLookupI18n } from '../i18n/useCompanyLookupI18n'
  import { debouncedRef } from '../utils/debounce'
  import CompanyDialog from './options/CompanyDialog.vue'
  import CompanyOptions from './options/CompanyOptions.vue'

  const emit = defineEmits<{ (e: 'select'): void }>()

  const { t } = useCompanyLookupI18n()
  const theme = useTheme()
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)

  const route = useRoute()
  const router = useRouter()

  const search = ref('')
  const debouncedSearch = debouncedRef(search, 400)

  const {
    data, isLoading, isError, isFetching, isFetchingNextPage,
    hasNextPage, fetchNextPage, refetch,
  } = useGetAllCompanies({ name: debouncedSearch })

  const companies = computed<CompanyDescriptor[]>(() =>
    data.value?.pages.flatMap(p => p.result ?? []) ?? [],
  )

  const selectedId = computed(() => {
    const paramId = route.query.id as string | undefined
    return paramId ? decodeURIComponent(paramId) : undefined
  })

  function isSelected (c: CompanyDescriptor): boolean {
    return selectedId.value === c.domain
  }

  function onSelect (id: string): void {
    const newId = selectedId.value === id ? undefined : id
    router.push({ query: { ...route.query, id: newId ? encodeURIComponent(newId) : undefined } })
    if (hasContent(newId)) emit('select')
  }

  function onScroll (e: Event): void {
    const t = e.target as HTMLElement
    if (
      t.scrollTop + t.clientHeight >= t.scrollHeight - 40
      && hasNextPage.value
      && !isFetchingNextPage.value
    ) fetchNextPage()
  }

  const isMenuOpen = ref(false)
  const createDialog = useTemplateRef<InstanceType<typeof CompanyDialog>>('createDialog')

  function openCreate (): void {
    isMenuOpen.value = false
    createDialog.value?.open()
  }

  function onCreate (created: CompanyDescriptor): void {
    router.push({ query: { ...route.query, id: encodeURIComponent(created.domain) } })
    isMenuOpen.value = false
  }
</script>

<template>
  <v-card class="h-100 d-flex flex-column" variant="flat">
    <v-card-title class="px-2 py-2 d-flex align-center">
      <v-tooltip location="bottom" :open-delay="600">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="tipProps"
            icon="mdi-reload"
            :loading="isFetching && !isFetchingNextPage"
            variant="plain"
            @click="refetch()"
          />
        </template>

        <span>{{ t('list.reload') }}</span>
      </v-tooltip>

      <v-text-field
        v-model="search"
        clearable
        density="compact"
        hide-details
        :label="t('list.searchPlaceholder')"
        persistent-placeholder
        :placeholder="`${companies.length} ${t('list.companies')}`"
        variant="outlined"
      />

      <v-menu v-model="isMenuOpen">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="plain" />
        </template>

        <v-sheet border>
          <v-list class="py-0" density="compact">
            <v-list-item slim @click.stop="openCreate">
              <template #prepend>
                <v-icon size="small">mdi-plus</v-icon>
              </template>
              {{ t('list.newCompany') }}
            </v-list-item>
          </v-list>
        </v-sheet>
      </v-menu>
    </v-card-title>

    <v-divider />

    <div
      ref="scrollContainer"
      class="flex-grow-1 overflow-y-auto bg-card"
      @scroll="onScroll"
    >
      <v-alert
        v-if="isError"
        class="ma-4"
        density="compact"
        type="error"
        variant="tonal"
      >
        {{ t('list.loadError') }}
      </v-alert>

      <v-list v-else-if="isLoading" class="pa-0" nav>
        <v-list-item
          v-for="i in 6"
          :key="i"
          class="mt-2 mx-2"
          density="compact"
        >
          <v-skeleton-loader type="list-item-two-line" />
        </v-list-item>
      </v-list>

      <v-list
        v-else-if="companies.length > 0"
        bg-color="card"
        class="pa-0"
        nav
      >
        <v-list-item
          v-for="company in companies"
          :key="company.domain"
          :active="isSelected(company)"
          base-color="listItem"
          :border="isSelected(company) ? 'primary' : 'listItem thin'"
          class="mt-2 mx-2"
          color="primarySurface"
          :style="{
            'border':'1px solid',
            'border-color': isSelected(company)
              ? primaryColor + ' !important'
              : isDark ? '#686868 !important' : '#ABABAB !important',
          }"
          variant="tonal"
          @click="onSelect(company.domain)"
        >
          <v-list-item-title class="text-primary">
            {{ company.name || company.idShort }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-listItemText">
            {{ company.domain }}
          </v-list-item-subtitle>

          <template #append>
            <CompanyOptions :company="company" />
          </template>
        </v-list-item>

        <div v-if="isFetchingNextPage" class="d-flex justify-center pa-3">
          <v-progress-circular color="primary" indeterminate size="24" width="2" />
        </div>
      </v-list>

      <v-container
        v-else
        class="h-100 d-flex flex-column align-center justify-center text-grey"
      >
        <v-icon class="mb-2" size="64">mdi-office-building-off</v-icon>
        <div>{{ t('list.empty') }}</div>
      </v-container>
    </div>
  </v-card>

  <CompanyDialog ref="createDialog" @saved="onCreate" />
</template>
