<template>
  <v-dialog v-model="open" max-width="600">
    <v-card>
      <v-card-title class="text-body-large">FCIL template</v-card-title>

      <v-card-text class="d-flex flex-column ga-4">
        <p class="text-body-medium">
          The export fills in the Fire Certificate Inventory List template of UNIFE (TGFS.06, revision 06, English).
          UNIFE's terms of use do not allow passing it on, so it is not part of this application: download it from the
          UNIFE website and select it here. This browser remembers it for the next exports.
        </p>

        <div>
          <v-btn
            append-icon="mdi-open-in-new"
            :href="FCIL_TEMPLATE_PAGE"
            rel="noopener noreferrer"
            size="small"
            target="_blank"
            variant="tonal"
          >
            UNIFE Fire Safety List
          </v-btn>
        </div>

        <v-file-input
          v-model="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          density="compact"
          hide-details="auto"
          label="FCIL template (.xlsx)"
          prepend-icon=""
          prepend-inner-icon="mdi-microsoft-excel"
          variant="outlined"
        />

        <v-alert
          v-if="error"
          density="compact"
          :text="error"
          type="error"
          variant="tonal"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancel" @click="open = false" />

        <v-btn
          color="primary"
          :disabled="!file"
          :loading="loading"
          text="Download FCIL"
          variant="flat"
          @click="file && emit('select', file)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { FCIL_TEMPLATE_PAGE } from '../utils/templateStorage'

  defineOptions({
    name: 'RailwayFireProtectionFcilTemplateDialog',
  })

  defineProps<{
    /** Why the last template could not be used */
    error: string
    loading: boolean
  }>()

  const emit = defineEmits<{
    select: [file: File]
  }>()

  const open = defineModel<boolean>({ required: true })

  const file = ref<File | null>(null)

  watch(open, isOpen => {
    if (!isOpen) {
      file.value = null
    }
  })
</script>
