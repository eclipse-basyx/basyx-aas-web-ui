<template>
  <div class="rfp-tile">
    <v-card
      ref="card"
      aria-haspopup="dialog"
      :aria-label="ariaLabel"
      border
      class="rfp-tile__card d-flex flex-column border-t-lg"
      hover
      :style="{ borderTopColor: `rgb(var(--v-theme-${meta.color}))` }"
      @click="emit('open')"
    >
      <v-card-item class="pb-2">
        <div class="d-flex align-start ga-2">
          <div class="text-title-large font-weight-medium text-break">{{ requirementsSet.name }}</div>
          <v-spacer />
          <v-icon :color="meta.color" :icon="meta.icon" />
        </div>
      </v-card-item>

      <v-card-text class="pt-0 flex-grow-1">
        <div class="d-flex flex-wrap align-center ga-2">
          <v-chip
            class="font-weight-bold"
            :color="meta.color"
            label
            size="small"
            variant="flat"
          >
            {{ meta.short }}
          </v-chip>

          <div v-if="meta.level > 0" aria-hidden="true" class="rfp-meter">
            <span
              v-for="segment in 3"
              :key="segment"
              class="rfp-meter__segment"
              :class="segment <= meta.level ? `bg-${meta.color}` : 'rfp-meter__segment--empty'"
            />

            <v-tooltip activator="parent" location="top" open-delay="600" :text="`Hazard level ${meta.level} of 3`" />
          </div>

          <span class="text-body-small text-medium-emphasis">{{ statusText }}</span>
        </div>

        <!-- Test procedures and their values -->
        <dl v-if="tests.length > 0" class="rfp-tests">
          <div v-for="test in shownTests" :key="test.key" class="rfp-tests__row">
            <dt class="rfp-tests__procedure text-body-small text-medium-emphasis">
              {{ test.procedure || test.idShort }}
              <v-tooltip activator="parent" location="top" open-delay="600" :text="test.procedure || test.idShort" />
            </dt>

            <dd class="text-body-medium font-weight-medium text-no-wrap">{{ test.result || '–' }}</dd>
          </div>
        </dl>

        <div v-if="hiddenTestCount > 0" class="text-body-small text-medium-emphasis mt-1">
          + {{ hiddenTestCount === 1 ? '1 more test' : `${hiddenTestCount} more tests` }}
        </div>
      </v-card-text>

      <div class="d-flex align-center ga-1 px-4 pb-3 text-body-small text-medium-emphasis">
        <v-icon icon="mdi-file-document-outline" size="small" />
        <span>{{ reportCountText }}</span>

        <v-tooltip v-if="hasLinkIssue" location="top" open-delay="600" :text="linkIssueText">
          <template #activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              class="ml-1"
              color="warning"
              icon="mdi-link-variant-off"
              size="small"
            />
          </template>
        </v-tooltip>

        <v-spacer />
        <v-icon icon="mdi-arrow-expand" size="small" />
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import type { FireReport, RequirementsSet } from '../types'
  import type { ComponentPublicInstance } from 'vue'
  import { hazardLevelMeta, hazardLevelText } from '../utils/hazardLevel'
  import { requirementsSetTests } from '../utils/presentation'

  defineOptions({
    name: 'RailwayFireProtectionTile',
  })

  const props = defineProps<{
    requirementsSet: RequirementsSet
    reports: FireReport[]
  }>()

  const emit = defineEmits<{
    open: []
  }>()

  /** More tests than this are summarised as "+ N more tests" so that the tile stays square */
  const MAX_SHOWN_TESTS = 3

  const card = ref<ComponentPublicInstance | null>(null)

  const meta = computed(() => hazardLevelMeta(props.requirementsSet.hazardLevel.code))

  const tests = computed(() => requirementsSetTests(props.requirementsSet, props.reports))

  const shownTests = computed(() => tests.value.slice(0, MAX_SHOWN_TESTS))

  const hiddenTestCount = computed(() => tests.value.length - shownTests.value.length)

  const statusText = computed(() => hazardLevelText(props.requirementsSet.hazardLevel, 'status') || 'No hazard level')

  const reportCountText = computed(() => {
    const count = props.requirementsSet.reportLinks.length
    return count === 1 ? '1 report' : `${count} reports`
  })

  const hasLinkIssue = computed(() =>
    props.requirementsSet.reportLinks.some(link => link.status === 'repaired' || link.status === 'unresolved'),
  )

  const linkIssueText = computed(() =>
    props.requirementsSet.reportLinks.some(link => link.status === 'unresolved')
      ? 'A report reference could not be resolved'
      : 'A report reference was repaired',
  )

  const ariaLabel = computed(() =>
    `${props.requirementsSet.name}: ${hazardLevelText(props.requirementsSet.hazardLevel) || 'No hazard level'}. Show details`,
  )

  function cardElement (): HTMLElement | null {
    return (card.value?.$el as HTMLElement | undefined) ?? null
  }

  function focus (): void {
    cardElement()?.focus()
  }

  /** The card is the front face of the flip into the details dialog */
  function originElement (): HTMLElement | null {
    return cardElement()
  }

  defineExpose({ focus, originElement })
</script>

<style scoped>
  /*
   * At least square: an invisible square spacer and the card share one grid cell, so the tile is as tall as the
   * larger of the two. A tile grows when its content does not fit (narrow tiles, long values), so the report line
   * at the bottom is never cut off; the other tiles of the row stretch to the same height.
   * (aspect-ratio is not used: with a fixed ratio the card's overflow was clipped, and stretching the row made the
   * tiles wider than their column.)
   */
  .rfp-tile {
    display: grid;
  }

  .rfp-tile::before {
    content: '';
    grid-area: 1 / 1;
    padding-bottom: 100%;
  }

  .rfp-tile__card {
    grid-area: 1 / 1;
  }

  .rfp-tests {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 16px 0 0;
  }

  .rfp-tests__row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 4px;
    border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .rfp-tests__row dd {
    margin: 0;
  }

  .rfp-tests__procedure {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rfp-meter {
    display: inline-flex;
    gap: 3px;
  }

  .rfp-meter__segment {
    width: 14px;
    height: 8px;
    border-radius: 2px;
  }

  .rfp-meter__segment--empty {
    background-color: rgba(var(--v-border-color), var(--v-border-opacity));
  }
</style>
