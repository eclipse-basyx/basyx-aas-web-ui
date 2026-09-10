<template>
  <v-card class="h-100 d-flex flex-column" variant="flat">
    <v-card-title class="pa-2 d-flex align-center">
      <span
        class="text-subtitle-2"
        v-bind="i18nData('definitions.title')"
      >
        {{ t('definitions.title', { count: list.length }) }}
      </span>

      <v-spacer />

      <ActionMenu v-model="isMenuOpen">
        <template #activator="{ props: menuProps }">
          <v-badge
            color="primary"
            dot
            :model-value="activeFilter !== 'all'"
            offset-x="8"
            offset-y="8"
          >
            <v-btn
              v-bind="menuProps"
              density="comfortable"
              :icon="ICONS.FILTER"
              variant="text"
            />
          </v-badge>
        </template>

        <v-list-item
          v-for="option in ['all', ...DEFINITION_KINDS]"
          :key="option"
          :active="activeFilter === option"
          slim
          @click="onFilter(option)"
        >

          <v-list-item-subtitle v-bind="i18nData(`definitions.${option}`)">
            {{ t(`definitions.${option}`) }}
          </v-list-item-subtitle>
        </v-list-item>
      </ActionMenu>

      <v-tooltip location="bottom" :open-delay="600">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-if="staged"
            v-bind="tipProps"
            density="comfortable"
            :icon="ICONS.ADD"
            size="small"
            variant="text"
            @click="emit('create', { mode: 'create', kind: activeFilter !== 'all' ? activeFilter : undefined })"
          />
        </template>

        <span v-bind="i18nData('definitions.newDefinition')">
          {{ t('definitions.newDefinition') }}
        </span>
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
        v-bind="i18nData('definitions.loadError')"
      >
        {{ t('definitions.loadError') }}
      </v-alert>

      <v-list v-else-if="isLoading" class="pa-0 bg-dark" nav>
        <DefinitionItem v-for="i in 4" :key="i" loading />
      </v-list>

      <v-list v-else-if="hasItems(list)" class="pa-0 pb-2 h-100 bg-card" nav>
        <DefinitionItem
          v-for="({definition, kind}) in list"
          :key="`${kind}-${definition.name}`"
          :definition="definition"
          :kind="kind"
          :staged="staged"
        />
      </v-list>

      <v-container
        v-else
        class="h-100 d-flex flex-column align-center justify-center text-grey"
      >
        <v-icon class="mb-2" size="48">{{ ICONS.DEFINITIONS }}</v-icon>

        <div class="text-caption" v-bind="i18nData('definitions.empty')">
          {{ t('definitions.empty') }}
        </div>
      </v-container>
    </div>
  </v-card>
</template>

<script setup lang="ts">
  import type { DefinitionKind } from '../../../types/definitions'
  import type { DefinitionDialogProps } from '../DefinitionDialog.vue'
  import { hasItems } from '@/utils/array'
  import { useDefinitions } from '../../../hooks/useDefinitions'
  import { usePolicy } from '../../../hooks/usePolicy'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { DEFINITION_KINDS } from '../../../types/definitions'
  import ActionMenu from '../../shared/menu/ActionMenu.vue'
  import DefinitionItem from './DefinitionItem.vue'

  type KindFilter = DefinitionKind | 'all'

  const ICONS = {
    ADD: 'mdi-plus',
    FILTER: 'mdi-filter-variant',
    DEFINITIONS: 'mdi-book-open-variant',
  } as const

  const emit = defineEmits<{ (e: 'create', props: DefinitionDialogProps): void }>()

  const { t, i18nData } = useAbacI18n()
  const { policy } = usePolicy()
  const staged = computed(() => policy.value?.status === 'staged')
  const { definitions, isLoading, isError } = useDefinitions()

  const isMenuOpen = ref(false)
  const activeFilter = ref<KindFilter>('all')

  const list = computed(() => {
    if (!definitions.value) return []

    if (activeFilter.value === 'all') {
      return [
        ...(definitions.value.attributes ?? []).map(d => ({ definition: d, kind: 'attributes' as const })),
        ...(definitions.value.acls ?? []).map(d => ({ definition: d, kind: 'acls' as const })),
        ...(definitions.value.objects ?? []).map(d => ({ definition: d, kind: 'objects' as const })),
        ...(definitions.value.formulas ?? []).map(d => ({ definition: d, kind: 'formulas' as const })),
      ]
    }

    const k = activeFilter.value
    return (definitions.value[k] ?? []).map(d => ({ definition: d, kind: k }))
  })

  function onFilter (value: KindFilter): void {
    activeFilter.value = value
  }

</script>
