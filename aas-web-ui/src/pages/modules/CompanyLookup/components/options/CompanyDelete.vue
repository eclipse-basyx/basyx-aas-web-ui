<script setup lang="ts">
  import type { CompanyDescriptor } from '@/composables/Client/CompanyLookup/types/company'
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDeleteCompany } from '@/composables/Client/CompanyLookup/queries/useDeleteCompany'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { useCompanyLookupI18n } from '../../i18n/useCompanyLookupI18n'

  const props = defineProps<{ company: CompanyDescriptor }>()
  const emit = defineEmits<{ (e: 'deleted'): void }>()

  const { t } = useCompanyLookupI18n()
  const route = useRoute()
  const router = useRouter()
  const navigationStore = useNavigationStore()

  const { mutateAsync: deleteCompany, isPending } = useDeleteCompany()

  const dialog = ref(false)

  // Activator props exposed to the slot (or the default button).
  const activatorProps = computed(() => ({
    onClick: (e: MouseEvent | KeyboardEvent) => {
      e.stopPropagation()
      dialog.value = true
    },
  }))

  function onCancel (): void {
    if (isPending.value) return
    dialog.value = false
  }

  async function onConfirm (): Promise<void> {
    try {
      await deleteCompany(props.company.domain)
      // If the deleted company is currently selected, clear it from the route
      const selectedId = route.query.id ? decodeURIComponent(route.query.id as string) : undefined
      if (selectedId === props.company.domain) {
        const { id: _id, ...rest } = route.query
        router.replace({ query: rest })
      }
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 2000,
        color: 'success',
        btnColor: 'buttonText',
        text: t('delete.success'),
      })
      emit('deleted')
      dialog.value = false
    } catch {
      if (import.meta.env.DEV) {
        console.warn('[CompanyDelete] failed to delete company')
      }
    }
  }
</script>

<template>
  <slot name="activator" :props="activatorProps">
    <v-list-item v-bind="activatorProps" class="text-error">
      <template #prepend>
        <v-icon size="x-small">mdi-delete</v-icon>
      </template>

      <v-list-item-subtitle>{{ t('delete.delete') }}</v-list-item-subtitle>
    </v-list-item>
  </slot>

  <v-dialog v-model="dialog" max-width="500" @click:outside="onCancel">
    <v-card>
      <v-card-title>{{ t('delete.confirmTitle') }}</v-card-title>
      <v-divider />

      <v-card-text>
        <div class="mt-2 font-weight-bold">
          {{ t('delete.company',{company: company.name || company.idShort }) }}
        </div>
        {{ t('delete.confirmMessage') }}
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn :disabled="isPending" variant="text" @click="onCancel">
          {{ t('delete.cancel') }}
        </v-btn>

        <v-btn
          color="error"
          :loading="isPending"
          variant="flat"
          @click="onConfirm"
        >
          {{ t('delete.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
