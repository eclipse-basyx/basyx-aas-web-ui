<template>
  <v-select
    v-model="role"
    density="compact"
    :disabled="disabled"
    :items="options"
    label="Access level"
  />

  <p class="text-body-2 text-medium-emphasis mb-3">{{ description }}</p>

  <v-expansion-panels v-model="expanded" variant="accordion">
    <v-expansion-panel title="Additional permissions">
      <v-expansion-panel-text>
        <v-select
          v-model="rights"
          chips
          density="compact"
          :disabled="disabled"
          :items="rightOptions"
          label="Individual permissions"
          multiple
        />

        <p class="text-body-2 text-medium-emphasis">Changing these permissions may create a custom access level.</p>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>

  <v-alert v-if="rights.includes('ALL') || rights.includes('DELETE')" class="mt-3" type="warning" variant="tonal">
    {{ rights.includes('ALL') ? 'Full data access includes deleting data and executing operations.' : 'This access level allows deleting data.' }}
  </v-alert>
</template>

<script setup lang="ts">
  import type { AccessRight } from '@/types/ResourceAccess'
  import { accessRights } from '@/types/ResourceAccess'
  import { sharingRightLabels, sharingRole, sharingRoles } from '@/utils/SharingRoles'

  defineProps<{ disabled?: boolean }>()
  const rights = defineModel<AccessRight[]>({ required: true })
  const expanded = ref<number>()
  const rightOptions = accessRights.map(value => ({ title: sharingRightLabels[value], value }))
  const role = computed({
    get: () => sharingRole(rights.value),
    set: value => {
      const preset = sharingRoles.find(item => item.value === value)
      if (preset) rights.value = [...preset.rights]
      else expanded.value = 0
    },
  })
  const options = computed(() => [
    ...sharingRoles,
    { title: 'Custom permissions', value: 'custom' },
  ])
  const description = computed(() => sharingRoles.find(item => item.value === role.value)?.description
    ?? 'Existing permissions are preserved. Open additional permissions to review or change them.')
</script>
