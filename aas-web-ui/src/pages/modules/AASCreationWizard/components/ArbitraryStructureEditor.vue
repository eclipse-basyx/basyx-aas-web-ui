<template>
  <v-sheet class="pa-4 rounded-lg" rounded="lg">
    <div class="arbitrary-editor-toolbar">
      <!-- <div class="mb-4"> -->
      <!-- <div class="text-subtitle-1 font-weight-medium">
          {{ title }}
        </div> -->
      <div v-if="!props.isNested" class="text-body-2 text-medium-emphasis mt-1">
        Build your custom structure by adding sections, properties, multi-language properties, or ranges.
        <!-- </div> -->
      </div>

      <!-- Always-visible actions -->
      <div class="d-flex flex-wrap ga-2 mb-6">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          variant="tonal"
          @click="addNode('section')"
        >
          Section
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          variant="tonal"
          @click="addNode('property')"
        >
          Property
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          variant="tonal"
          @click="addNode('multiLanguageProperty')"
        >
          Multi-language
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          variant="tonal"
          @click="addNode('range')"
        >
          Range
        </v-btn>
      </div>
    </div>

    <div v-if="nodes.length === 0" class="text-body-2 text-medium-emphasis">
      No items added yet. Start by adding a section or a field
    </div>

    <div v-else class="d-flex flex-column ga-6">
      <template v-for="(node, index) in nodes" :key="node.id">
        <!-- SECTION -->
        <v-expansion-panels v-if="node.type === 'section'" class="arbitrary-section-panels" multiple>
          <v-expansion-panel class="arbitrary-section-panel" :value="0">
            <v-expansion-panel-title>
              <div class="d-flex justify-space-between align-center w-100 pr-2">
                <!-- <div> -->
                <span class="text-subtitle-2 font-weight-medium">
                  {{ getNodeTitle(node, index) }}
                </span>

                <v-btn
                  color="error"
                  icon="mdi-delete"
                  variant="text"
                  @click.stop="removeNode(node.id)"
                />
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text class="arbitrary-section-body">
              <div class="d-flex flex-column ga-4">
                <v-text-field
                  density="compact"
                  label="Section Title"
                  :model-value="node.label"
                  variant="outlined"
                  @update:model-value="updateSectionLabel(node.id, $event)"
                />

                <ArbitraryStructureEditor
                  :model-value="node.children"
                  title="Section Contents"
                  @update:model-value="updateSectionChildren(node.id, $event)"
                />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- PROPERTY -->
        <div v-else-if="node.type === 'property'" class="d-flex flex-column ga-3">
          <div class="d-flex justify-space-between align-center">
            <div class="text-caption text-medium-emphasis">
              Property
            </div>

            <v-btn
              color="error"
              icon="mdi-delete"
              size="small"
              variant="text"
              @click="removeNode(node.id)"
            />
          </div>

          <v-row>
            <v-col cols="6">
              <v-text-field
                density="compact"
                label="Property Label"
                :model-value="node.label"
                variant="outlined"
                @update:model-value="updateNodeLabel(node.id, $event)"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                density="compact"
                label="Property Value"
                :model-value="node.value"
                variant="outlined"
                @update:model-value="updatePropertyValue(node.id, $event)"
              />
            </v-col>
          </v-row>
        </div>

        <!-- MULTI-LANGUAGE PROPERTY -->
        <div v-else-if="node.type === 'multiLanguageProperty'" class="d-flex flex-column ga-3">
          <div class="d-flex justify-space-between align-center">
            <div class="text-caption text-medium-emphasis">
              Multi-language Property
            </div>

            <v-btn
              color="error"
              icon="mdi-delete"
              size="small"
              variant="text"
              @click="removeNode(node.id)"
            />
          </div>

          <v-text-field
            density="compact"
            label="Label"
            :model-value="node.label"
            variant="outlined"
            @update:model-value="updateNodeLabel(node.id, $event)"
          />

          <v-row
            v-for="(entry, entryIndex) in node.value"
            :key="`${node.id}-${entryIndex}`"
            class="align-center"
          >
            <v-col cols="3">
              <v-text-field
                density="compact"
                label="Language"
                :model-value="entry.language"
                variant="outlined"
                @update:model-value="updateMLPLanguage(node.id, entryIndex, $event)"
              />
            </v-col>

            <v-col cols="8">
              <v-text-field
                density="compact"
                label="Text"
                :model-value="entry.text"
                variant="outlined"
                @update:model-value="updateMLPText(node.id, entryIndex, $event)"
              />
            </v-col>

            <v-col class="d-flex justify-end" cols="1">
              <v-btn
                color="error"
                :disabled="node.value.length === 1"
                icon="mdi-delete"
                variant="text"
                @click="removeMLPTranslation(node.id, entryIndex)"
              />
            </v-col>
          </v-row>

          <div>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              variant="text"
              @click="addMLPTranslation(node.id)"
            >
              Add translation
            </v-btn>
          </div>
        </div>

        <!-- RANGE -->
        <div v-else-if="node.type === 'range'" class="d-flex flex-column ga-3">
          <div class="d-flex justify-space-between align-center">
            <div class="text-caption text-medium-emphasis">
              Range
            </div>

            <v-btn
              color="error"
              icon="mdi-delete"
              size="small"
              variant="text"
              @click="removeNode(node.id)"
            />
          </div>

          <v-row>
            <v-col cols="4">
              <v-text-field
                density="compact"
                label="Range Label"
                :model-value="node.label"
                variant="outlined"
                @update:model-value="updateNodeLabel(node.id, $event)"
              />
            </v-col>

            <v-col cols="4">
              <v-text-field
                density="compact"
                label="Min"
                :model-value="node.min"
                variant="outlined"
                @update:model-value="updateRangeMin(node.id, $event)"
              />
            </v-col>

            <v-col cols="4">
              <v-text-field
                density="compact"
                label="Max"
                :model-value="node.max"
                variant="outlined"
                @update:model-value="updateRangeMax(node.id, $event)"
              />
            </v-col>
          </v-row>
        </div>

        <v-divider v-if="index < nodes.length - 1" />
      </template>
    </div>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type {
    ArbitraryNode,
    ArbitraryNodeType,
    ArbitraryPropertyNode,
    ArbitraryRangeNode,
    ArbitrarySectionNode,
  } from '../types/arbitrary'
  import { computed } from 'vue'

  const props = withDefaults(defineProps<{
    modelValue: ArbitraryNode[]
    title?: string
    isNested?: boolean
  }>(), {
    title: 'Custom Structure',
    isNested: false,
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value: ArbitraryNode[]): void
  }>()

  const nodes = computed<ArbitraryNode[]>(() => props.modelValue)

  function createId (type: ArbitraryNodeType): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }

  function addNode (type: ArbitraryNodeType): void {
    let newNode: ArbitraryNode

    switch (type) {
      case 'section': {
        newNode = {
          id: createId(type),
          type: 'section',
          label: 'New Section',
          children: [],
        }
        break
      }

      case 'property': {
        newNode = {
          id: createId(type),
          type: 'property',
          label: 'New Property',
          value: '',
        }
        break
      }

      case 'multiLanguageProperty': {
        newNode = {
          id: createId(type),
          type: 'multiLanguageProperty',
          label: 'New MultiLanguageProperty',
          value: [{ language: 'en', text: '' }],
        }
        break
      }

      case 'range': {
        newNode = {
          id: createId(type),
          type: 'range',
          label: 'New Range',
          min: '',
          max: '',
        }
        break
      }
    }

    emit('update:modelValue', [...nodes.value, newNode])
  }

  function removeNode (id: string): void {
    emit('update:modelValue', nodes.value.filter(node => node.id !== id))
  }

  function updateNode (id: string, updater: (node: ArbitraryNode) => ArbitraryNode): void {
    emit(
      'update:modelValue',
      nodes.value.map(node => (node.id === id ? updater(node) : node)),
    )
  }

  function updateNodeLabel (id: string, value: string | null): void {
    updateNode(id, node => ({
      ...node,
      label: value ?? '',
    }))
  }

  function updateSectionLabel (id: string, value: string | null): void {
    updateNode(id, node => ({
      ...(node as ArbitrarySectionNode),
      label: value ?? '',
    }))
  }

  function updateSectionChildren (id: string, children: ArbitraryNode[]): void {
    updateNode(id, node => ({
      ...(node as ArbitrarySectionNode),
      children,
    }))
  }

  function updatePropertyValue (id: string, value: string | null): void {
    updateNode(id, node => ({
      ...(node as ArbitraryPropertyNode),
      value: value ?? '',
    }))
  }

  function updateMLPLanguage (id: string, entryIndex: number, value: string | null): void {
    updateNode(id, node => {
      if (node.type !== 'multiLanguageProperty') {
        return node
      }

      return {
        ...node,
        value: node.value.map((entry, index) =>
          index === entryIndex
            ? { ...entry, language: value ?? '' }
            : entry,
        ),
      }
    })
  }

  function updateMLPText (id: string, entryIndex: number, value: string | null): void {
    updateNode(id, node => {
      if (node.type !== 'multiLanguageProperty') {
        return node
      }

      return {
        ...node,
        value: node.value.map((entry, index) =>
          index === entryIndex
            ? { ...entry, text: value ?? '' }
            : entry,
        ),
      }
    })
  }

  function updateRangeMin (id: string, value: string | null): void {
    updateNode(id, node => ({
      ...(node as ArbitraryRangeNode),
      min: value ?? '',
    }))
  }

  function updateRangeMax (id: string, value: string | null): void {
    updateNode(id, node => ({
      ...(node as ArbitraryRangeNode),
      max: value ?? '',
    }))
  }

  function getNodeTitle (node: ArbitraryNode, index: number): string {
    switch (node.type) {
      case 'section':
      { return node.label || `Section ${index + 1}` }
      case 'property': {
        return node.label || `Property ${index + 1}`
      }
      case 'multiLanguageProperty': {
        return node.label || `MultiLanguageProperty ${index + 1}`
      }
      case 'range': {
        return node.label || `Range ${index + 1}`
      }
    }
  }

  function addMLPTranslation (id: string): void {
    updateNode(id, node => {
      if (node.type !== 'multiLanguageProperty') {
        return node
      }

      return {
        ...node,
        value: [
          ...node.value,
          { language: 'en', text: '' },
        ],
      }
    })
  }

  function removeMLPTranslation (id: string, entryIndex: number): void {
    updateNode(id, node => {
      if (node.type !== 'multiLanguageProperty') {
        return node
      }

      if (node.value.length === 1) {
        return node
      }

      return {
        ...node,
        value: node.value.filter((_, index) => index !== entryIndex),
      }
    })
  }
</script>

<style scoped>
.arbitrary-section-panel {
  border: none;
  box-shadow: inset 3px 0 0 rgba(var(--v-theme-primary), 0.45);
  background: rgba(var(--v-theme-primary), 0.045);
  overflow: hidden;
}

.arbitrary-section-title {
  background: rgba(var(--v-theme-primary), 0.10);
}

.arbitrary-section-body {
  background: rgba(var(--v-theme-surface), 0.75);
}

.arbitrary-section-body :deep(.v-expansion-panel-text__wrapper) {
  padding-top: 16px;
}
</style>
