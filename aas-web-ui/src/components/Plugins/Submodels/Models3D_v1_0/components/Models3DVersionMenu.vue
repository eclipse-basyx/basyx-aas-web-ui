<template>
  <v-menu v-if="sortedVersions.length > 1">
    <template #activator="{ props: activator }">
      <v-btn
        v-bind="activator"
        append-icon="mdi-chevron-down"
        prepend-icon="mdi-source-branch"
        size="small"
        variant="tonal"
      >
        {{ label(selected) }}
      </v-btn>
    </template>

    <v-list density="compact" min-width="240">
      <v-list-item
        v-for="entry in sortedVersions"
        :key="entry.version.key"
        :active="entry.version.key === selected?.key"
        :subtitle="entry.version.setDate || undefined"
        :title="label(entry.version)"
        @click="emit('select', entry.version.key)"
      >
        <template #append>
          <v-chip
            v-if="entry.version.key === latestKey"
            class="mr-1"
            color="primary"
            label
            size="x-small"
          >
            Latest
          </v-chip>

          <v-chip v-if="entry.version.status" border label size="x-small">{{ entry.version.status }}</v-chip>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>

  <v-chip
    v-else-if="selected"
    label
    prepend-icon="mdi-source-branch"
    size="small"
    variant="tonal"
  >
    {{ label(selected) }}
  </v-chip>
</template>

<script lang="ts" setup>
  import type { Model3DVersion } from '../types'
  import { latestVersion } from '../utils/parseModel3D'
  import { versionLabel } from '../utils/presentation'

  // Props
  const props = defineProps<{
    versions: Model3DVersion[]
    selected: Model3DVersion | undefined
  }>()

  // Emits
  const emit = defineEmits<{ (e: 'select', key: string): void }>()

  // Computed properties
  const latestKey = computed(() => latestVersion(props.versions)?.key)

  /** Newest first, keeping the listed order for equal dates */
  const sortedVersions = computed(() =>
    props.versions
      .map((version, index) => ({ version, index }))
      .toSorted((a, b) => b.version.setDate.localeCompare(a.version.setDate) || b.index - a.index),
  )

  // Methods
  function label (version: Model3DVersion | undefined): string {
    if (!version) return ''
    return versionLabel(version, props.versions.indexOf(version))
  }
</script>
