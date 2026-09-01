<template>
  <div>
    <template v-if="isObject(data) || isArray(data)">
      <v-list class="pa-0 bg-transparent" density="compact" nav style="--v-list-item-min-height: 24px">
        <template v-for="(value, key) in data" :key="String(key)">

          <!-- Primitive value: plain non-expandable row -->
          <v-list-item
            v-if="!isObject(value) && !isArray(value)"
            class="px-0 py-0"
            density="compact"
            min-height="24"
          >
            <template #prepend>
              <!-- spacer to align with expandable rows that have a chevron -->
              <v-icon size="x-small" style="visibility: hidden">mdi-chevron-down</v-icon>
            </template>

            <v-list-item-title class="text-body-2">
              <span class="json-key">{{ isArray(data) ? `[${key}]` : key }}</span>

              <span class="text-medium-emphasis">
                {{ ': ' }}<span :class="valueClass(value)">{{ formatValue(value) }}</span>
              </span>
            </v-list-item-title>
          </v-list-item>

          <!-- Object / Array value: expandable group -->
          <v-list-group
            v-else
            :value="String(key)"
          >
            <template #activator="{ props: groupProps, isOpen }">
              <v-list-item
                class="px-0 py-0"
                density="compact"
                min-height="24"
                v-bind="groupProps"
              >
                <template #append />

                <template #prepend>
                  <v-icon size="x-small">{{ isOpen ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                </template>

                <v-list-item-title class="text-body-2">
                  <span class="json-key">{{ isArray(data) ? `[${key}]` : key }}</span>

                  <span class="text-medium-emphasis text-caption ml-3">
                    {{ isArray(value) ? `[ ${(value as any[]).length} items ]` : `{ ${Object.keys(value as object).length} keys }` }}
                  </span>
                </v-list-item-title>
              </v-list-item>
            </template>

            <!-- Recurse -->
            <div class="pl-4">
              <JsonTreeView :data="value" />
            </div>
          </v-list-group>

        </template>
      </v-list>
    </template>

    <template v-else>
      <v-list-item class="px-0" density="compact">
        <v-list-item-title class="text-body-2">
          <span :class="valueClass(data)">{{ formatValue(data) }}</span>
        </v-list-item-title>
      </v-list-item>
    </template>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    data: unknown
  }>()

  function isObject (val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val)
  }

  function isArray (val: unknown): val is unknown[] {
    return Array.isArray(val)
  }

  function formatValue (val: unknown): string {
    if (val === null) return 'null'
    if (typeof val === 'string') return `"${val}"`
    return String(val)
  }

  function valueClass (val: unknown): string {
    if (val === null) return 'text-medium-emphasis font-italic'
    switch (typeof val) {
      case 'string': { return 'text-success'
      }
      case 'number': { return 'text-info'
      }
      case 'boolean': { return 'text-warning'
      }
      default: { return ''
      }
    }
  }
</script>

<style scoped>
  :deep(.v-list-item__prepend) {
    width: auto;
    margin-inline-end: 4px;
  }

  :deep(.v-list-item-title) {
    font-size: 14px;
    line-height: 21px;
    font-family: monospace;
  }

  :deep(.json-key) {
    color: #905;
    font-weight: bold;
  }
</style>
