<template>
  <v-list-item :active="false" class="py-1" density="compact">
    <template #prepend>
      <v-icon color="medium-emphasis" icon="mdi-identifier" size="small" />
    </template>

    <v-list-item-title class="text-body-2">User ID</v-list-item-title>

    <template #append>
      <v-btn
        :aria-expanded="shown"
        :aria-label="shown ? 'Hide user ID' : 'Show user ID'"
        :icon="shown ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        size="x-small"
        :title="shown ? 'Hide user ID' : 'Show user ID'"
        variant="text"
        @click="shown = !shown"
      />

      <v-btn
        aria-label="Copy user ID"
        :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        :loading="copying"
        size="x-small"
        title="Copy user ID"
        variant="text"
        @click="copy"
      />
    </template>
  </v-list-item>

  <div v-if="shown || message" class="px-4 pb-2">
    <p v-if="shown" class="text-caption text-break font-monospace bg-surface-light rounded pa-2">{{ userId }}</p>
    <p v-if="message" class="text-caption mt-1" role="status">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{ userId: string }>()
  const shown = ref(false)
  const copied = ref(false)
  const copying = ref(false)
  const message = ref('')

  watch(() => props.userId, () => {
    shown.value = false
    copied.value = false
    message.value = ''
  })

  async function copy (): Promise<void> {
    if (copying.value) return
    copying.value = true
    const id = props.userId
    try {
      await navigator.clipboard.writeText(id)
      if (props.userId === id) {
        copied.value = true
        message.value = 'User ID copied.'
      }
    } catch {
      if (props.userId === id) message.value = 'Could not copy. Show the user ID to copy it manually.'
    } finally {
      copying.value = false
    }
  }
</script>
