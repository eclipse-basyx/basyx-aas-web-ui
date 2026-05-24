<template>
  <v-container class="pa-6" fluid style="max-width: 1200px; margin: 0 auto">

    <!-- Hero Section -->
    <v-row align="center" class="mb-8 mt-4" justify="center">
      <v-col class="text-center" cols="12">
        <div class="d-flex align-center justify-center mb-4">
          <v-avatar
            class="mr-4"
            color="primary"
            rounded="lg"
            size="64"
          >
            <v-icon color="white" icon="custom:edcIcon" size="36" />
          </v-avatar>

          <div class="text-left">
            <h1 class="text-h4 font-weight-bold mt-2 mb-n2">Eclipse Dataspace Connector</h1>

            <p class="text-body-1 text-medium-emphasis mt-n2">
              Secure, sovereign data exchange across organizational boundaries
            </p>
          </div>
        </div>

        <v-chip-group class="justify-center mt-2">
          <v-chip
            v-for="tag in tags"
            :key="tag.label"
            :color="tag.color"
            :prepend-icon="tag.icon"
            size="small"
            variant="tonal"
          >
            {{ tag.label }}
          </v-chip>
        </v-chip-group>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-6" justify="center">
      <v-col
        v-for="action in quickActions"
        :key="action.title"
        cols="12"
        md="3"
        sm="6"
      >
        <v-card
          border
          class="pa-4 text-center fill-height"
          hover
          :prepend-icon="action.icon"
          rounded="lg"
          :to="action.route"
          variant="tonal"
        >
          <template #prepend>
            <v-icon class="mx-n4 my-n3" :color="action.color" size="32">{{ action.icon }}</v-icon>
          </template>

          <v-card-title class="text-body-1 font-weight-semibold pt-3 pb-1 px-0">
            {{ action.title }}
          </v-card-title>

          <v-card-subtitle class="text-caption px-0 text-wrap">
            {{ action.description }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <v-divider class="mb-6" />

    <!-- Status & Info Section -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <!-- Configuration Status Card -->
        <v-card border class="fill-height d-flex flex-column" rounded="lg">
          <v-card-title class="d-flex align-center pt-4 px-4 pb-2">
            <v-icon class="mr-2" color="primary" size="20">mdi-cog-sync</v-icon>
            Configuration Status
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4 flex-grow-1">
            <v-list class="pa-0" lines="two">
              <v-list-item
                v-for="statusItem in configurationStatus"
                :key="statusItem.label"
                border="md"
                class="rounded-lg mb-2 px-3"
                :subtitle="statusItem.value === ' ' ? '': (statusItem.value || 'Not configured')"
                :title="statusItem.label"
                variant="flat"
              >
                <template #prepend>
                  <v-icon :color="statusItem.value ? 'success' : 'grey'" size="20">
                    {{ statusItem.value ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                </template>
              </v-list-item>
            </v-list>

          </v-card-text>

          <v-card-actions>
            <v-btn
              block
              color="gray"
              prepend-icon="mdi-cog"
              :to="configRoute"
              variant="tonal"
            >
              Configure Connector
            </v-btn>
          </v-card-actions>

        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <!-- About / Description Card -->
        <v-card border class="fill-height" rounded="lg">
          <v-card-title class="d-flex align-center pt-4 px-4 pb-2">
            <v-icon class="mr-2" color="primary" size="20">mdi-information-outline</v-icon>
            About this Module
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <p class="text-body-2 mb-4">
              The <strong>Eclipse Dataspace Connector (EDC)</strong> enables secure and sovereign data exchange across
              organizational boundaries. This module integrates the EDC Tractus-X implementation to manage and
              negotiate data contracts directly within the AAS Web UI.
            </p>

            <v-list class="pa-0" density="compact">
              <v-list-item
                v-for="feature in features"
                :key="feature"
                class="px-0"
                density="compact"
              >
                <template #prepend>
                  <v-icon color="success" size="16">mdi-check</v-icon>
                </template>

                <v-list-item-title class="text-body-2">{{ feature }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Getting Started Banner -->
    <v-row>
      <v-col cols="12">
        <v-alert
          border="start"
          color="primary"
          icon="mdi-rocket-launch-outline"
          rounded="lg"
          variant="tonal"
        >
          <v-alert-title class="font-weight-bold mb-1">Getting Started</v-alert-title>

          <span class="text-body-2">
            Start by configuring your EDC Controlplane endpoint and security settings in the
            <strong>Configuration</strong> tab. Once connected, explore available
            <strong>Assets</strong> and manage access <strong>Policies</strong>.
          </span>
        </v-alert>
      </v-col>
    </v-row>

  </v-container>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import edcData from '../data/edc.json'
  import { useEdcStore } from '../store/EdcStore'

  // Store
  const edcStore = useEdcStore()

  // Navigation routes (relative to the module base)
  const configRoute = { path: '/modules/eclipsedataspaceconnector/configuration' }

  // Tags displayed in the hero section
  const tags = [
    { label: 'Tractus-X', icon: 'custom:tractusxIcon', color: 'primary' },
    { label: 'IDS Dataspace Protocol', icon: 'mdi-shield-lock-outline', color: 'secondary' },
    { label: 'Data Sovereignty', icon: 'mdi-lock-outline', color: 'success' },
    { label: 'Open Source', icon: 'mdi-open-source-initiative', color: 'info' },
  ]

  // Quick action cards linking to the module's sub-tabs
  const quickActions = [
    {
      title: 'Policies',
      description: 'Manage access control and usage policies',
      icon: 'mdi-file-sign',
      color: 'red',
      route: { path: '/modules/eclipsedataspaceconnector/policies' },
    },
    {
      title: 'Assets',
      description: 'Browse and manage available data assets',
      icon: 'mdi-code-json',
      color: 'green',
      route: { path: '/modules/eclipsedataspaceconnector/asset' },
    },
    {
      title: 'Catalogue',
      description: 'Browse catalogue from Business Partners',
      icon: 'mdi-list-box-outline',
      color: 'orange',
      route: { path: '/modules/eclipsedataspaceconnector/catalogue' },
    },
    {
      title: 'Configuration',
      description: 'Set up connector endpoints and security',
      icon: 'mdi-cog',
      color: 'blue-grey',
      route: { path: '/modules/eclipsedataspaceconnector/configuration' },
    },
  ]

  // EDC meta lookup from edc.json based on selected type
  const selectedEdcMeta = computed(() =>
    edcStore.getEdcType
      ? (edcData as any[]).find(e => e.id === edcStore.getEdcType) ?? null
      : null,
  )

  // Configuration status derived from store
  const configurationStatus = computed(() => [
    {
      label: edcStore.getEdcType + (selectedEdcMeta.value?.dataspace_protocol?.version ? ' (DSP ' + selectedEdcMeta.value?.dataspace_protocol?.version + ')' : ''),
      value: ' ',
    },
    {
      label: 'Controlplane Endpoint',
      value: edcStore.getControlplaneEndpoint,
    },
    {
      label: 'Controlplane Management Endpoint',
      value: edcStore.getControlplaneMgmtEndpoint,
    },
    {
      label: 'Controlplane Auth',
      value: edcStore.getControlplaneApiAuthKey
        ? 'X-Api-Key: ' + edcStore.getControlplaneApiAuthKey.replace(/./gs, '*')
        : (edcStore.getControlplaneTokenServerEndpoint
          ? 'Token Endpoint: ' + edcStore.getControlplaneTokenServerEndpoint
          : ''),
    },
  ])

  // Feature list
  const features = [

    'Asset catalog browsing & filtering',
    'Dataspace Protocol (DSP) compliant contract negotiation',
    'Policy and Asset Management',
    'Policy-based access control',
    'Business Partner Management',
    'Tractus-X EDC v0.9 & v0.11.2 support',
    'API key & OAuth2 token authentication',
  ]
</script>
