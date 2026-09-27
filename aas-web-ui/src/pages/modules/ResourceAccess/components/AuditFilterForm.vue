<template>
  <v-sheet border class="pa-3 mb-3" rounded="lg">
    <div class="d-flex flex-wrap ga-2">
      <v-select
        v-model="objectType"
        clearable
        density="compact"
        hide-details
        :items="auditObjectTypes"
        label="Resource type"
        min-width="200"
        placeholder="All resources"
        variant="outlined"
        width="240"
      />

      <v-select
        v-if="objectType === 'repository'"
        v-model="objectId"
        class="flex-grow-1"
        density="compact"
        hide-details
        :items="repositoryFamilies"
        label="Repository"
        min-width="220"
        variant="outlined"
      />

      <v-text-field
        v-else-if="objectType"
        v-model="objectId"
        class="flex-grow-1"
        density="compact"
        hide-details
        :label="objectType === 'element' ? 'Submodel ID' : 'ID'"
        min-width="220"
        variant="outlined"
      />

      <v-text-field
        v-if="objectType === 'element'"
        v-model="idShortPath"
        density="compact"
        hide-details
        label="idShort path"
        min-width="180"
        variant="outlined"
      />
    </div>

    <div class="d-flex flex-wrap align-start ga-2 mt-3">
      <v-text-field
        v-model="actorSubject"
        class="flex-grow-1"
        density="compact"
        hint="User ID of the person who made the change. Leave empty to show everyone's changes."
        label="Changed by (user ID)"
        min-width="220"
        persistent-hint
        variant="outlined"
      />

      <v-btn
        border
        color="surface-light"
        height="40"
        rounded="lg"
        text="Clear"
        variant="flat"
        @click="clear"
      />

      <v-btn
        class="text-buttonText"
        color="primary"
        :disabled="!complete"
        height="40"
        prepend-icon="mdi-filter-outline"
        rounded="lg"
        text="Apply"
        variant="flat"
        @click="apply"
      />
    </div>

    <v-chip
      v-if="filter.object"
      class="mt-3"
      closable
      label
      prepend-icon="mdi-filter-outline"
      :text="`Object ${filter.object}`"
      @click:close="clear"
    />
  </v-sheet>
</template>

<script setup lang="ts">
  import type { AuditFilter } from '@/types/ResourceAccess'
  import { auditObjectTypes, repositoryFamilies } from '@/utils/AccessObjects'

  const props = defineProps<{
    issuer?: string
  }>()

  const filter = defineModel<AuditFilter>({ required: true })

  const objectType = ref<string | null>(null)
  const objectId = ref('')
  const idShortPath = ref('')
  const actorSubject = ref('')

  const complete = computed(() => !objectType.value
    || (objectId.value.trim() !== '' && (objectType.value !== 'element' || idShortPath.value.trim() !== '')))

  watch(objectType, () => {
    objectId.value = ''
    idShortPath.value = ''
  })

  function apply (): void {
    const subject = actorSubject.value.trim()
    filter.value = {
      ...(objectType.value ? { objectType: objectType.value, objectId: objectId.value.trim() } : {}),
      ...(objectType.value === 'element' ? { idShortPath: idShortPath.value.trim() } : {}),
      ...(subject && props.issuer ? { actorIssuer: props.issuer, actorSubject: subject } : {}),
    }
  }

  function clear (): void {
    objectType.value = null
    actorSubject.value = ''
    filter.value = {}
  }
</script>
