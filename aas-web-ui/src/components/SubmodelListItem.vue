<template>
  <v-list-item
    :active="selected"
    base-color="listItem"
    color="primarySurface"
    style="border-width: 1px"
    :style="{
      'border-color': selected
        ? primaryColor + ' !important'
        : isDark
          ? '#686868 !important'
          : '#ABABAB !important',
    }"
    variant="tonal"
  >
    <template #prepend>
      <!-- Checkbox for multi-selection, clicks toggle the selection through the list item -->
      <v-list-item-action v-if="selectable" start>
        <v-checkbox-btn color="primary" :model-value="selected" tabindex="-1" />
      </v-list-item-action>

      <v-chip
        v-else
        border
        class="mr-3"
        color="primary"
        label
        size="x-small"
      >
        {{ submodel.kind && submodel.kind === 'Template' ? 'SMT' : 'SM' }}
      </v-chip>
    </template>

    <v-tooltip
      v-if="!hideTooltip"
      activator="parent"
      open-delay="600"
      transition="slide-x-transition"
    >
      <!-- Submodel ID -->
      <div v-if="submodel.id" class="text-body-small">
        <span class="font-weight-bold">{{ 'ID: ' }}</span>
        {{ submodel.id }}
      </div>
      <!-- Submodel idShort -->
      <div v-if="submodel.idShort" class="text-body-small">
        <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
        {{ submodel.idShort }}
      </div>
      <!-- Submodel semanticId -->
      <div v-if="semanticId" class="text-body-small">
        <span class="font-weight-bold"> {{ 'semanticId: ' }}</span>
        {{ semanticId }}
      </div>

      <v-divider v-if="submodel.administration?.version" class="my-1" />
      <!-- Submodel administrative information -->
      <div v-if="submodel.administration?.version" class="text-body-small">
        <span class="font-weight-bold">{{ 'Version: ' }}</span>
        {{
          submodel.administration.version +
            (submodel.administration.revision ? '.' + submodel.administration.revision : '')
        }}
      </div>

      <v-divider v-if="smt || semanticIdVersion" class="my-1" />
      <!-- Submodel Template name and version -->
      <template v-if="smt">
        <div class="text-body-small">
          <span class="font-weight-bold">{{ 'SMT: ' }}</span>
          {{ smt.name }}
        </div>

        <div class="text-body-small">
          <span class="font-weight-bold">{{ 'SMT Version: ' }}</span>
          {{ smt.version }}
        </div>
      </template>
      <!-- Submodel Template version extracted from semanticId -->
      <div v-else-if="semanticIdVersion" class="text-body-small">
        <span class="font-weight-bold">{{ 'SMT Version: ' }}</span>
        {{ semanticIdVersion }}
      </div>
    </v-tooltip>

    <!-- Selectable lists use the primary color like the AAS list, regardless of the selection -->
    <v-list-item-title :class="selected || selectable ? 'text-primary' : 'text-listItemText'">
      {{ smTitleToDisplay(submodel) }}
    </v-list-item-title>

    <v-list-item-subtitle v-if="showId" class="text-listItemText">{{ smIdToDisplay(submodel.id, aasId) }}</v-list-item-subtitle>

    <template v-if="smVersionToDisplay(submodel)" #append>
      <v-chip size="x-small"> v{{ smVersionToDisplay(submodel) }} </v-chip>
    </template>
  </v-list-item>
</template>

<script lang="ts" setup>
  import { useTheme } from 'vuetify'
  import { useSubmodelDisplay } from '@/composables/AAS/SubmodelDisplay'
  import { extractVersionRevision } from '@/utils/AAS/SemanticIdUtils'

  const props = withDefaults(defineProps<{
    submodel: any
    selected?: boolean
    selectable?: boolean
    showId?: boolean
    aasId?: string // ID of the containing AAS, shortened with '...' in the displayed SM ID
    hideTooltip?: boolean
  }>(), {
    selected: false,
    selectable: false,
    showId: false,
    aasId: '',
    hideTooltip: false,
  })

  // Composables
  const { getSmtOfSm, smTitleToDisplay, smVersionToDisplay, smIdToDisplay } = useSubmodelDisplay()

  // Vuetify
  const theme = useTheme()

  // Computed Properties
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const semanticId = computed<string>(() => props.submodel?.semanticId?.keys[0]?.value ?? '')
  const smt = computed(() => getSmtOfSm(props.submodel))
  const semanticIdVersion = computed(() => {
    if (!semanticId.value) return ''
    const { version, revision } = extractVersionRevision(semanticId.value)
    return version ? version + (revision ? '.' + revision : '') : ''
  })
</script>
