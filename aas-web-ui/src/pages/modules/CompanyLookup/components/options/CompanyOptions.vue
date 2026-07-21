<script setup lang="ts">
  import type { CompanyDescriptor } from '@/composables/Client/CompanyLookup/types/company'
  import { ref } from 'vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { DEFAULT_COPY_ICON } from '../../constants/icons'
  import { useCompanyLookupI18n } from '../../i18n/useCompanyLookupI18n'
  import CompanyDelete from './CompanyDelete.vue'
  import CompanyDialog from './CompanyDialog.vue'

  const { company } = defineProps<{ company: CompanyDescriptor }>()

  const { t } = useCompanyLookupI18n()
  const { copyToClipboard } = useClipboardUtil()
  const copyIcon = ref<string>(DEFAULT_COPY_ICON)

  const isMenuOpen = ref(false)
  const editDialog = useTemplateRef<InstanceType<typeof CompanyDialog>>('editDialog')

  function openEdit (): void {
    isMenuOpen.value = false
    editDialog.value?.open()
  }

  function onCopy (): void {
    copyToClipboard(company.domain, t('options.domain'), copyIcon)
    isMenuOpen.value = false
  }

  function onDelete (): void {
    isMenuOpen.value = false
  }
</script>

<template>
  <v-menu v-model="isMenuOpen">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        color="listItemText"
        icon
        size="x-small"
        variant="plain"
        @click.stop
      >
        <v-icon size="x-small">mdi-dots-vertical</v-icon>
      </v-btn>
    </template>

    <v-sheet border>
      <v-list class="py-0" dense density="compact" slim>

        <v-list-item @click.stop="openEdit">
          <template #prepend>
            <v-icon size="x-small">mdi-pencil</v-icon>
          </template>

          <v-list-item-subtitle>{{ t('options.edit') }}</v-list-item-subtitle>
        </v-list-item>

        <div @click.stop>
          <CompanyDelete :company="company" @deleted="onDelete" />
        </div>

        <v-divider />

        <v-list-item @click.stop="onCopy">
          <template #prepend>
            <v-icon size="x-small">{{ copyIcon }}</v-icon>
          </template>

          <v-list-item-subtitle>{{ t('options.copyDomain') }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-sheet>
  </v-menu>

  <CompanyDialog ref="editDialog" :company="company" />
</template>
