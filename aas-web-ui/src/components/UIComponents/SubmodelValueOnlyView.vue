<template>
  <v-sheet border rounded>
    <v-table density="comfortable" hover>
      <thead class="bg-tableHeader">
        <tr>
          <th class="text-titleText">Field</th>
          <th class="text-titleText">Value</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in rows"
          :key="row.path"
          :class="{ 'bg-tableOdd': row.isContainer }"
        >
          <td>
            <div
              class="d-flex align-center ga-2"
              :class="getIndentClass(row.level)"
            >
              <v-btn
                v-if="row.isContainer"
                :aria-label="getToggleLabel(row)"
                :icon="isRowExpanded(row.path) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                size="x-small"
                variant="text"
                @click="toggleExpanded(row.path)"
              />

              <span
                v-else
                class="d-inline-flex flex-shrink-0"
                style="width: 32px"
              />

              <v-icon color="icon" :icon="row.icon" size="small" />

              <span class="text-body-small text-break">{{ row.label }}</span>
            </div>
          </td>

          <td>
            <span class="text-body-small text-break">{{ row.displayValue }}</span>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-sheet>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'

  interface ValueOnlyRow {
    displayValue: string
    icon: string
    isContainer: boolean
    kind: string
    label: string
    level: number
    path: string
  }

  const props = withDefaults(defineProps<{
    maxDepth?: number
    rootLabel?: string
    value: unknown
  }>(), {
    maxDepth: 12,
    rootLabel: 'Submodel Value',
  })

  const expandedPaths = ref(new Set<string>())

  const rows = computed(() => {
    if (isContainerValue(props.value)) {
      return buildRows(props.value, props.rootLabel, 0, '$', false)
    }

    return buildRows(props.value, props.rootLabel, 0, '$', true)
  })

  function buildRows (
    value: unknown,
    label: string,
    level: number,
    path: string,
    includeSelf: boolean,
  ): ValueOnlyRow[] {
    const currentRows = includeSelf ? [buildRow(value, label, level, path)] : []
    if (!isContainerValue(value) || level >= props.maxDepth) {
      return currentRows
    }

    if (includeSelf && !expandedPaths.value.has(path)) {
      return currentRows
    }

    const childLevel = includeSelf ? level + 1 : level
    const childRows = getChildren(value, path).flatMap(child =>
      buildRows(child.value, child.label, childLevel, child.path, true),
    )

    return [...currentRows, ...childRows]
  }

  function buildRow (value: unknown, label: string, level: number, path: string): ValueOnlyRow {
    const kind = getValueKind(value)
    return {
      displayValue: getDisplayValue(value),
      icon: getValueIcon(kind),
      isContainer: isContainerValue(value),
      kind,
      label,
      level,
      path,
    }
  }

  function toggleExpanded (path: string): void {
    const updatedPaths = new Set(expandedPaths.value)
    if (updatedPaths.has(path)) {
      updatedPaths.delete(path)
    } else {
      updatedPaths.add(path)
    }

    expandedPaths.value = updatedPaths
  }

  function isRowExpanded (path: string): boolean {
    return expandedPaths.value.has(path)
  }

  function getToggleLabel (row: ValueOnlyRow): string {
    return `${isRowExpanded(row.path) ? 'Collapse' : 'Expand'} ${row.label}`
  }

  function getChildren (value: unknown, parentPath: string): Array<{ label: string, path: string, value: unknown }> {
    if (Array.isArray(value)) {
      return value.map((item, index) => ({
        label: `[${index}]`,
        path: `${parentPath}[${index}]`,
        value: item,
      }))
    }

    if (!isRecord(value)) {
      return []
    }

    return Object.entries(value).map(([key, entryValue]) => ({
      label: key,
      path: `${parentPath}.${key}`,
      value: entryValue,
    }))
  }

  function getValueKind (value: unknown): string {
    if (Array.isArray(value)) {
      return 'List'
    }
    if (value === null || value === undefined) {
      return 'Empty'
    }
    if (isRecord(value)) {
      return 'Object'
    }
    if (typeof value === 'boolean') {
      return 'Boolean'
    }
    if (typeof value === 'number') {
      return 'Number'
    }
    if (typeof value === 'string') {
      return 'Text'
    }

    return 'Value'
  }

  function getValueIcon (kind: string): string {
    if (kind === 'List') {
      return 'mdi-format-list-bulleted'
    }
    if (kind === 'Object') {
      return 'mdi-folder-outline'
    }
    if (kind === 'Boolean') {
      return 'mdi-toggle-switch-outline'
    }
    if (kind === 'Number') {
      return 'mdi-numeric'
    }
    if (kind === 'Empty') {
      return 'mdi-null'
    }

    return 'mdi-text'
  }

  function getDisplayValue (value: unknown): string {
    if (Array.isArray(value)) {
      return `${value.length} ${value.length === 1 ? 'item' : 'items'}`
    }
    if (isRecord(value)) {
      const entries = Object.keys(value).length
      return `${entries} ${entries === 1 ? 'field' : 'fields'}`
    }
    if (value === null || value === undefined) {
      return '-'
    }
    if (value === '') {
      return '-'
    }
    if (['boolean', 'number', 'string'].includes(typeof value)) {
      return String(value)
    }

    return JSON.stringify(value)
  }

  function getIndentClass (level: number): string {
    return `pl-${Math.min(level * 3, 12)}`
  }

  function isContainerValue (value: unknown): boolean {
    return Array.isArray(value) || isRecord(value)
  }

  function isRecord (value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  }
</script>
