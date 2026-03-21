<template>
  <v-snackbar v-model="snackbar.status" :color="snackbar.color" location="top" :timeout="snackbar.timeout">
    <v-card v-if="snackbar.status === true && snackbar.baseError">
      <v-card-title class="text-subtitle-2">{{ snackbar.baseError }}</v-card-title>
      <v-divider v-if="snackbar.extendedError" />
      <v-card-text v-if="snackbar.extendedError" style="max-height: 200px; overflow-y: auto; max-width: 590px">
        <pre class="text-subtitleText text-caption">{{ snackbar.extendedError }}</pre>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn prepend-icon="mdi-content-copy" size="small" variant="text" @click="copyExtendedError()">
          Copy Error
        </v-btn>
      </v-card-actions>
    </v-card>
    <span v-else class="text-buttonText">{{ snackbar.text }}</span>
    <template #actions>
      <v-btn
        v-if="snackbar.actionText && snackbar.actionCallback"
        class="mr-2"
        color="card"
        size="small"
        variant="outlined"
        @click="handleAction"
      >
        {{ snackbar.actionText }}
      </v-btn>
      <v-btn :color="snackbar.btnColor" variant="plain" @click="closeSnackbar()">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useNavigationStore } from '@/store/NavigationStore'

  const navigationStore = useNavigationStore()

  const snackbar = computed(() => navigationStore.getSnackbar)

  function closeSnackbar (): void {
    navigationStore.dispatchSnackbar({
      status: false,
    })
  }

  async function handleAction (): Promise<void> {
    if (snackbar.value.actionCallback) {
      await snackbar.value.actionCallback()
    }
  }

  async function copyExtendedError (): Promise<void> {
    const errorText = `${snackbar.value.baseError}\n\n${snackbar.value.extendedError}`
    try {
      await navigator.clipboard.writeText(errorText)
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 2000,
        color: 'success',
        btnColor: 'buttonText',
        text: 'Error copied to clipboard',
      })
    } catch {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Failed to copy error to clipboard',
      })
    }
  }
</script>
