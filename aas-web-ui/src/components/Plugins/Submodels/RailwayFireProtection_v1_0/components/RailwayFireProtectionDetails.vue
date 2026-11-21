<template>
  <v-card class="rfp-details">
    <v-card-item class="py-3">
      <template #prepend>
        <v-avatar :color="meta.color" rounded variant="tonal">
          <v-icon :icon="meta.icon" />
        </v-avatar>
      </template>

      <v-card-title class="text-title-large text-wrap">
        {{ requirementsSet.name }}
      </v-card-title>

      <v-card-subtitle class="text-wrap">Requirement set</v-card-subtitle>

      <template #append>
        <div class="d-flex align-center ga-2">
          <v-chip
            class="font-weight-bold"
            :color="meta.color"
            label
            size="small"
            variant="flat"
          >
            {{ meta.short }}
          </v-chip>

          <v-btn
            aria-label="Close"
            icon="mdi-close"
            size="small"
            variant="text"
            @click="emit('close')"
          />
        </div>
      </template>
    </v-card-item>

    <v-divider />

    <v-card-text class="d-flex flex-column ga-5">
      <!-- Requirement and hazard level -->
      <div class="rfp-details__facts">
        <section>
          <div class="text-label-large mb-1">Requirement</div>
          <div class="text-body-large">{{ requirementsSet.requirement || 'No requirement description' }}</div>
        </section>

        <section>
          <div class="text-label-large mb-1">Hazard level</div>

          <div class="d-flex align-center ga-2">
            <v-icon :color="meta.color" :icon="meta.icon" size="small" />
            <span class="text-body-large">{{ meta.code === 'unknown' ? (requirementsSet.hazardLevel.raw || 'No hazard level') : meta.label }}</span>
          </div>

          <div
            v-if="meta.code !== 'unknown' && requirementsSet.hazardLevel.raw && requirementsSet.hazardLevel.raw !== meta.label"
            class="text-body-small text-medium-emphasis mt-1"
          >
            Value in submodel: {{ requirementsSet.hazardLevel.raw }}
          </div>
        </section>
      </div>

      <!-- Reports -->
      <section>
        <div class="text-title-medium mb-3">
          {{ requirementsSet.reportLinks.length === 1 ? 'Report' : `Reports (${requirementsSet.reportLinks.length})` }}
        </div>

        <div v-if="requirementsSet.reportLinks.length > 0" class="d-flex flex-column ga-4">
          <template v-for="link in requirementsSet.reportLinks" :key="link.key">
            <RailwayFireProtectionReport
              v-if="link.reportIndex !== null && reports[link.reportIndex]"
              :repair-note="link.status === 'repaired' ? link.note : ''"
              :report="reports[link.reportIndex]"
            />

            <v-alert
              v-else-if="link.status === 'external'"
              density="compact"
              icon="mdi-open-in-new"
              title="External report"
              type="info"
              variant="tonal"
            >
              <a
                v-if="isWebLink(link.url)"
                class="text-body-medium text-break"
                :href="link.url"
                rel="noopener noreferrer"
                target="_blank"
              >{{ link.url }}</a>

              <span v-else class="text-body-medium text-break">{{ link.url }}</span>
            </v-alert>

            <v-alert
              v-else
              density="compact"
              icon="mdi-link-variant-off"
              title="Report reference could not be resolved"
              type="warning"
              variant="tonal"
            >
              <div v-if="link.note" class="text-body-small">{{ link.note }}</div>

              <div v-if="link.keys" class="text-body-small text-break mt-1">
                Reference: <code>{{ link.keys }}</code>
              </div>
            </v-alert>
          </template>
        </div>

        <v-alert
          v-else
          density="compact"
          text="This requirement set does not reference any report."
          type="info"
          variant="tonal"
        />
      </section>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import type { FireReport, RequirementsSet } from '../types'
  import { hazardLevelMeta } from '../utils/hazardLevel'

  defineOptions({
    name: 'RailwayFireProtectionDetails',
  })

  const props = defineProps<{
    requirementsSet: RequirementsSet
    reports: FireReport[]
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const meta = computed(() => hazardLevelMeta(props.requirementsSet.hazardLevel.code))

  function isWebLink (url: string): boolean {
    return /^https?:\/\//i.test(url)
  }
</script>

<style scoped>
  .rfp-details__facts {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  @media (min-width: 720px) {
    .rfp-details__facts {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    }
  }
</style>
