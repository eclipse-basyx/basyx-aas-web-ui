<template>
  <v-alert
    border="start"
    class="overview-alert"
    density="compact"
    :text="displayName"
    :variant="variant"
  >
    <template #prepend>
      <v-chip border color="primary" label size="x-small">{{ element.modelType }}</v-chip>
    </template>

    <div v-if="detail" class="text-caption text-subtitleText mt-1">{{ detail }}</div>

    <template v-if="childCount !== null || icon" #append>
      <v-badge v-if="childCount !== null" :content="childCount" inline />
      <v-icon v-else class="mr-1" :icon="icon" />
    </template>
  </v-alert>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'

  const props = defineProps<{
    element: any
  }>()

  const { nameToDisplay } = useReferableUtils()

  const displayName = computed(() => nameToDisplay(props.element))
  const childCount = computed<number | null>(() => {
    if (['SubmodelElementCollection', 'SubmodelElementList'].includes(props.element?.modelType)) {
      return props.element?.value?.length ?? 0
    }
    if (props.element?.modelType === 'Entity') return props.element?.statements?.length ?? 0
    if (props.element?.modelType === 'AnnotatedRelationshipElement') {
      return props.element?.annotations?.length ?? 0
    }
    return null
  })
  const detail = computed(() => {
    if (props.element?.modelType === 'BasicEventElement') {
      return `${props.element.direction} · ${props.element.state}`
    }
    if (props.element?.modelType === 'Capability') return 'Capability'
    return ''
  })
  const icon = computed(() => {
    if (props.element?.modelType === 'Operation') return 'mdi-lightning-bolt-circle'
    if (props.element?.modelType === 'BasicEventElement') return 'mdi-broadcast'
    if (props.element?.modelType === 'Capability') return 'mdi-star-circle-outline'
    return ''
  })
  const variant = computed(() => props.element?.modelType === 'Operation' ? 'tonal' : 'outlined')
</script>

<style scoped>
  .overview-alert :deep(.v-alert__append) {
    align-items: center;
    align-self: center;
    display: flex;
  }
</style>
