<template>
  <div class="d-flex flex-column ga-3">
    <div>
      <div class="text-title-small">{{ title }}</div>

      <div class="text-body-small text-medium-emphasis">{{ subtitle }}</div>
    </div>

    <!-- Clearing sets null, the OAuth2 values stay strings -->
    <v-text-field
      v-for="field in fields"
      :key="field.key"
      clearable
      density="compact"
      :hide-details="!field.hint"
      :hint="field.hint"
      :label="field.label"
      :model-value="oauth2[field.key]"
      persistent-hint
      :placeholder="field.placeholder"
      variant="outlined"
      @update:model-value="value => oauth2[field.key] = value ?? ''"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { EdcAssetOAuth2 } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetFromAas'

  defineProps<{
    title: string
    subtitle: string
  }>()

  const oauth2 = defineModel<EdcAssetOAuth2>({ required: true })

  // Data
  const fields: Array<{ key: keyof EdcAssetOAuth2, label: string, hint?: string, placeholder?: string }> = [
    { key: 'clientId', label: 'Client ID' },
    {
      key: 'clientSecretKey',
      label: 'Client Secret Key',
      hint: 'Key of the client secret in the EDC vault, not the secret itself',
    },
    { key: 'tokenUrl', label: 'Token Endpoint', placeholder: 'https://...' },
    { key: 'scope', label: 'Scope' },
  ]
</script>
