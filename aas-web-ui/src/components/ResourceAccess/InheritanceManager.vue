<template>
  <v-alert
    class="mb-3"
    density="compact"
    type="info"
    variant="tonal"
  >
    Viewers, editors and executors of a linked shell get the same access to this Submodel. Owners of the shell do not
    become owners here. A link only applies while the shell references this Submodel, and you need to manage both.
  </v-alert>

  <v-list-subheader class="mb-1">Link a shell</v-list-subheader>

  <v-sheet border class="pa-3" rounded="lg">
    <div class="d-flex flex-wrap ga-2 align-start">
      <v-text-field
        v-model="aasId"
        class="flex-grow-1"
        density="compact"
        :disabled="disabled"
        label="AAS ID"
        min-width="220"
        variant="outlined"
        @keydown.enter.prevent="link(aasId)"
      />

      <v-btn
        class="text-buttonText"
        color="primary"
        :disabled="disabled || !aasId.trim()"
        height="40"
        prepend-icon="mdi-link-variant"
        rounded="lg"
        text="Link"
        variant="flat"
        @click="link(aasId)"
      />
    </div>

    <v-btn
      v-if="suggestedAasId && !linkedIds.includes(suggestedAasId)"
      class="mt-1"
      :disabled="disabled"
      prepend-icon="mdi-link-variant-plus"
      size="small"
      :text="`Link the selected shell ${suggestedAasId}`"
      variant="text"
      @click="link(suggestedAasId)"
    />
  </v-sheet>

  <v-list-subheader class="mt-2 mb-1">Linked shells</v-list-subheader>

  <v-alert
    v-if="links.length === 0"
    density="compact"
    text="No shell passes on its access to this Submodel."
    type="info"
    variant="tonal"
  />

  <v-list v-else border class="rounded-lg pa-0" lines="two">
    <template v-for="(inheritanceLink, index) in links" :key="inheritanceLink.aasId">
      <v-divider v-if="index > 0" />

      <v-list-item prepend-icon="custom:aasIcon">
        <v-list-item-title class="text-break">{{ inheritanceLink.aasId }}</v-list-item-title>
        <v-list-item-subtitle>Linked {{ new Date(inheritanceLink.approvedAt).toLocaleString() }}</v-list-item-subtitle>

        <template #append>
          <v-tooltip location="top" text="Remove link">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                :aria-label="`Remove link to ${inheritanceLink.aasId}`"
                :disabled="disabled"
                icon="mdi-link-variant-off"
                size="small"
                variant="text"
                @click="$emit('update', linkedIds.filter(id => id !== inheritanceLink.aasId))"
              />
            </template>
          </v-tooltip>
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup lang="ts">
  import type { InheritanceLink } from '@/types/ResourceAccess'

  const props = defineProps<{
    links: InheritanceLink[]
    suggestedAasId?: string
    disabled?: boolean
  }>()

  const emit = defineEmits<{
    update: [aasIds: string[]]
  }>()

  const aasId = ref('')

  const linkedIds = computed(() => props.links.map(link => link.aasId))

  function link (identifier: string): void {
    const trimmed = identifier.trim()
    if (!trimmed || props.disabled) return
    emit('update', [...new Set([...linkedIds.value, trimmed])])
    aasId.value = ''
  }
</script>
