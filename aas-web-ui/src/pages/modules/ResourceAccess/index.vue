<template>
  <v-container class="py-6" fluid>
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">
        <div class="d-flex align-center mb-4">
          <v-avatar class="mr-3" color="surface-light" icon="mdi-account-lock-outline" rounded />

          <div>
            <div class="text-title-large">Access Management</div>
            <div class="text-body-medium text-medium-emphasis">Share resources and manage who may create them.</div>
          </div>
        </div>

        <v-alert
          v-if="!managementComponent"
          density="compact"
          text="Sharing is not available on the connected services. Enable ReBAC (rebac.enabled) to use it."
          type="info"
          variant="tonal"
        />

        <template v-else>
          <v-tabs
            v-model="tab"
            class="mb-4"
            color="primary"
            density="compact"
            show-arrows
          >
            <v-tab prepend-icon="mdi-share-variant-outline" text="Resources" value="resources" />
            <v-tab prepend-icon="mdi-database-lock-outline" text="Repositories" value="repositories" />
            <v-tab prepend-icon="mdi-shield-search" text="Audit trail" value="audit" />
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="resources"><ResourceLookupCard /></v-window-item>
            <v-window-item value="repositories"><RepositoryAccessCard /></v-window-item>
            <v-window-item value="audit"><AuditTrailCard :component="managementComponent" /></v-window-item>
          </v-window>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { useManagementComponent } from '@/composables/ResourceAccess/ManagementComponent'
  import AuditTrailCard from '@/pages/modules/ResourceAccess/components/AuditTrailCard.vue'
  import RepositoryAccessCard from '@/pages/modules/ResourceAccess/components/RepositoryAccessCard.vue'
  import ResourceLookupCard from '@/pages/modules/ResourceAccess/components/ResourceLookupCard.vue'

  defineOptions({
    moduleName: 'ResourceAccess',
    moduleTitle: 'Access Management',
    isDesktopModule: true,
    isMobileModule: true,
    isVisibleModule: true,
    needsAuthentication: true,
    supportedInfrastructureTemplates: ['full', 'identifiable', 'mono-repo', 'mono-all'],
  })

  const { managementComponent } = useManagementComponent()

  const tab = ref('resources')
</script>
