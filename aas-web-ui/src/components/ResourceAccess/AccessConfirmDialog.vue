<template>
  <v-dialog v-model="open" max-width="440px">
    <v-sheet border :rounded="isMobile ? undefined : 'lg'">
      <v-card-title class="bg-cardHeader">{{ title }}</v-card-title>
      <v-divider />
      <v-card-text>{{ text }}</v-card-text>
      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn rounded="lg" text="Cancel" @click="open = false" />

        <v-btn
          class="text-buttonText"
          color="error"
          rounded="lg"
          :text="confirmText"
          variant="flat"
          @click="confirm"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script setup lang="ts">
  import { useNavigationStore } from '@/store/NavigationStore'

  defineProps<{
    title: string
    text: string
    confirmText: string
  }>()

  const emit = defineEmits<{
    confirm: []
  }>()

  const open = defineModel<boolean>({ required: true })

  const navigationStore = useNavigationStore()

  const isMobile = computed(() => navigationStore.getIsMobile)

  function confirm (): void {
    open.value = false
    emit('confirm')
  }
</script>
