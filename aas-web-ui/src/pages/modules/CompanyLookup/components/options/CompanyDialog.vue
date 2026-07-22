<script setup lang="ts">
  import type { CompanyDescriptor } from '@/composables/Client/CompanyLookup/types/company'
  import { ref } from 'vue'
  import CompanyForm from '../form/CompanyForm.vue'

  defineProps<{ company?: CompanyDescriptor }>()
  const emit = defineEmits<{
    (e: 'saved', descriptor: CompanyDescriptor): void
    (e: 'closed'): void
  }>()

  const isOpen = ref(false)

  function open (): void {
    isOpen.value = true
  }

  function close (): void {
    isOpen.value = false
  }

  defineExpose({ open, close })
</script>

<template>
  <CompanyForm v-model="isOpen" :company="company" @closed="emit('closed')" @saved="c => emit('saved', c)" />
</template>
