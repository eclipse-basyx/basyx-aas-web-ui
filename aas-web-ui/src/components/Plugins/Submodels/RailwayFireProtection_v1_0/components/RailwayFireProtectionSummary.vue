<template>
  <!-- Product and material, in the style of the Digital Nameplate visualization -->
  <!-- flex-grow-0: the page is a flex column, and only the requirement sets card should take the free height -->
  <v-row v-if="cards.length > 0" class="flex-grow-0 mb-4" dense>
    <v-col v-for="card in cards" :key="card.title" cols="12" :md="cards.length > 1 ? 6 : 12">
      <v-card class="h-100">
        <v-card-title>
          <div class="text-body-large">{{ card.title }}</div>
        </v-card-title>

        <v-card-text class="d-flex flex-column ga-4">
          <section v-for="group in card.groups" :key="group.title || card.title">
            <div v-if="group.title" class="text-label-large text-medium-emphasis mb-2">{{ group.title }}</div>

            <div class="d-flex flex-wrap align-center ga-4">
              <v-sheet border class="rfp-summary__table" rounded>
                <v-table density="comfortable">
                  <tbody>
                    <tr
                      v-for="(row, index) in group.rows"
                      :key="row.label"
                      :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'"
                    >
                      <td class="rfp-summary__label text-subtitleText text-body-small py-3">{{ row.label }}</td>

                      <td class="text-body-small text-break py-3">
                        <!-- Index 0–100 as a read-only slider (one value or a range), values on the thumbs -->
                        <div v-if="row.range" class="rfp-summary__slider-row">
                          <v-range-slider
                            v-if="row.range[0] !== row.range[1]"
                            :aria-label="row.label"
                            color="primary"
                            density="compact"
                            hide-details
                            :max="100"
                            :min="0"
                            :model-value="row.range"
                            readonly
                            thumb-label="always"
                          >
                            <template #prepend><span class="rfp-summary__bound">0</span></template>
                            <template #append><span class="rfp-summary__bound">100</span></template>
                          </v-range-slider>

                          <v-slider
                            v-else
                            :aria-label="row.label"
                            color="primary"
                            density="compact"
                            hide-details
                            :max="100"
                            :min="0"
                            :model-value="row.range[0]"
                            readonly
                            thumb-label="always"
                          >
                            <template #prepend><span class="rfp-summary__bound">0</span></template>
                            <template #append><span class="rfp-summary__bound">100</span></template>
                          </v-slider>
                        </div>

                        <template v-else>{{ row.value }}</template>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-sheet>

              <RailwayFireProtectionMassChart v-if="group.chart" :material="material" />
            </div>
          </section>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
  import type { ManufacturerInformation, Material } from '../types'
  import { characteristicsLabel, parseDecimal, withUnit } from '../utils/presentation'

  /** `range`: numeric index 0–100, shown as a read-only slider instead of `value` */
  type Row = { label: string, value: string, range?: [number, number] }
  /** `chart`: show the combustible share of the masses next to the table */
  type Group = { title: string, rows: Row[], chart?: boolean }
  type Card = { title: string, groups: Group[] }

  defineOptions({
    name: 'RailwayFireProtectionSummary',
  })

  const props = defineProps<{
    manufacturer: ManufacturerInformation | null
    material: Material | null
  }>()

  function rows (entries: Row[]): Row[] {
    return entries.filter(entry => entry.value.trim() !== '')
  }

  function cardOf (title: string, groups: Group[]): Card[] {
    const filled = groups.filter(group => group.rows.length > 0)
    return filled.length > 0 ? [{ title, groups: filled }] : []
  }

  /** The MaterialCharacteristics range as numbers within 0–100; null if a bound is missing or not a number */
  function indexRange (material: Material | null): [number, number] | null {
    const min = parseDecimal(material?.characteristics?.min ?? '')
    const max = parseDecimal(material?.characteristics?.max ?? '')
    const low = min ?? max
    const high = max ?? min
    if (low === null || high === null) {
      return null
    }
    const clamp = (value: number) => Math.min(100, Math.max(0, value))
    return [clamp(Math.min(low, high)), clamp(Math.max(low, high))]
  }

  const cards = computed<Card[]>(() => {
    const manufacturer = props.manufacturer
    const material = props.material
    const characteristics = characteristicsLabel(material)
    const characteristicsRange = indexRange(material)
    const unit = material?.massUnit ?? ''

    return [
      ...cardOf('Product', [
        {
          title: '',
          rows: rows([
            { label: 'Product designation', value: manufacturer?.productDesignation ?? '' },
            { label: 'Manufacturer', value: manufacturer?.name ?? '' },
            { label: 'Order code', value: manufacturer?.orderCode ?? '' },
            { label: 'Article number', value: manufacturer?.articleNumber ?? '' },
          ]),
        },
      ]),
      ...cardOf('Material', [
        {
          title: 'Material',
          rows: rows([
            { label: 'Name', value: material?.name ?? '' },
            { label: 'Manufacturer', value: material?.manufacturer ?? '' },
            {
              label: 'Characteristics',
              value: characteristics,
              ...(characteristicsRange ? { range: characteristicsRange } : {}),
            },
            { label: 'Tested combination', value: material?.testedCombination ?? '' },
          ]),
        },
        {
          title: 'Masses per unit',
          chart: true,
          rows: rows([
            { label: 'Total', value: withUnit(material?.totalMassPerUnit ?? '', unit) },
            { label: 'Combustible', value: withUnit(material?.combustibleMassPerUnit ?? '', unit) },
          ]),
        },
      ]),
    ]
  })
</script>

<style scoped>
  .rfp-summary__table {
    flex: 1 1 240px;
  }

  /* Room above the slider for the value labels on the thumbs */
  .rfp-summary__slider-row {
    min-width: 160px;
    padding-top: 32px;
  }

  /* Read-only: shown in the primary color, but not movable */
  .rfp-summary__slider-row :deep(.v-slider-thumb),
  .rfp-summary__slider-row :deep(.v-slider-track) {
    cursor: default;
  }

  .rfp-summary__bound {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  }

  .rfp-summary__label {
    width: 40%;
  }
</style>
