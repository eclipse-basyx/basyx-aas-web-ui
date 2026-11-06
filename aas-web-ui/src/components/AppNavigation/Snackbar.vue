<template>
  <v-snackbar v-model="snackbar.status" :color="snackbar.color" location="top" :timeout="snackbar.timeout">
    <v-card v-if="snackbar.status === true && snackbar.baseError">
      <v-card-title class="text-title-small">{{ snackbar.baseError }}</v-card-title>
      <v-divider v-if="snackbar.extendedError" />

      <v-card-text v-if="snackbar.extendedError" style="max-height: 200px; overflow-y: auto; max-width: 590px">
        <!-- A quoted HTML document, e.g. the error page of a server, is shown apart from the message as code -->
        <template v-for="(part, index) in extendedErrorParts" :key="index">
          <pre
            v-if="part.html"
            class="embedded-html text-subtitleText text-pre-wrap bg-surface-light border rounded pa-2 my-2"
          >{{ part.text }}</pre>

          <pre v-else class="text-subtitleText text-body-small text-pre-wrap">{{ part.text }}</pre>
        </template>
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
  import { useNavigationStore } from '@/store/NavigationStore'
  import { splitEmbeddedHtml } from '@/utils/StringUtils'

  const navigationStore = useNavigationStore()

  const snackbar = computed(() => navigationStore.getSnackbar)
  const extendedErrorParts = computed(() => splitEmbeddedHtml(snackbar.value.extendedError ?? ''))

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

<style scoped>
  .embedded-html {
    font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
    font-size: 0.6875rem;
    line-height: 1.4;
  }
</style>
