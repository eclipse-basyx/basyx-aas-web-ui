<template>
  <v-sheet border rounded="lg">
    <v-card-title class="bg-cardHeader">Repository access</v-card-title>
    <v-divider />
    <v-progress-linear v-if="loading" color="primary" indeterminate />

    <v-card-text>
      <p class="text-body-medium text-medium-emphasis mb-4">
        Creators may add new resources and become their owners. Administrators have full access to every resource of the repository.
      </p>

      <v-select
        v-model="kind"
        class="mb-2"
        density="compact"
        :items="families"
        label="Repository"
        variant="outlined"
      />

      <v-alert
        v-if="error"
        class="mb-3"
        closable
        density="compact"
        :text="error"
        type="error"
        variant="tonal"
        @click:close="error = ''"
      />

      <v-alert
        v-if="loaded && !document && !error"
        density="compact"
        text="Only administrators of this repository can manage its access."
        type="info"
        variant="tonal"
      />

      <template v-if="document">
        <v-list-subheader class="mb-1">Add a creator or administrator</v-list-subheader>

        <AccessPrincipalForm
          :current-principal="currentPrincipal"
          :disabled="loading"
          :roles="repositoryRoles"
          submit-label="Add"
          @add="addGrant"
        />

        <v-list-subheader class="mt-2 mb-1">Creators and administrators</v-list-subheader>

        <AccessGrantList
          :current-principal="currentPrincipal"
          :disabled="loading"
          empty-text="Nobody can create resources in this repository through ReBAC yet."
          :grants="document.grants"
          :roles="repositoryRoles"
          @change="changeRole"
          @remove="removeGrant"
        />
      </template>
    </v-card-text>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { BaSyxComponentKey } from '@/types/BaSyx'
  import type { AccessDocument, AccessGrant, AccessPrincipal, GrantRelation, RepositoryKind } from '@/types/ResourceAccess'
  import { useCurrentPrincipal } from '@/composables/Auth/CurrentPrincipal'
  import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { repositoryRoles } from '@/utils/AccessRoles'

  const repositoryFamilies: Array<{ title: string, value: RepositoryKind, component: BaSyxComponentKey }> = [
    { title: 'Asset Administration Shells', value: 'aas', component: 'AASRepo' },
    { title: 'Submodels', value: 'submodel', component: 'SubmodelRepo' },
    { title: 'Concept Descriptions', value: 'concept_description', component: 'ConceptDescriptionRepo' },
    { title: 'AAS Descriptors', value: 'aas_descriptor', component: 'AASRegistry' },
    { title: 'Submodel Descriptors', value: 'submodel_descriptor', component: 'SubmodelRegistry' },
    { title: 'Discovery entries', value: 'asset_links', component: 'AASDiscovery' },
  ]

  const client = useResourceAccessClient()
  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()
  const { currentPrincipal } = useCurrentPrincipal()

  const kind = ref<RepositoryKind>('aas')
  const document = ref<AccessDocument>()
  const etag = ref('')
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  const families = computed(() => repositoryFamilies.filter(family => infrastructureStore.supportsResourceAccess(family.component)))
  const component = computed(() => repositoryFamilies.find(family => family.value === kind.value)?.component ?? 'AASRepo')

  watch(families, available => {
    if (!available.some(family => family.value === kind.value) && available[0]) kind.value = available[0].value
  }, { immediate: true })

  watch(kind, load, { immediate: true })

  async function load (): Promise<void> {
    loading.value = true
    error.value = ''
    const result = await client.getRepositoryAccess(component.value, kind.value)
    loading.value = false
    loaded.value = true
    document.value = result.ok ? result.data : undefined
    etag.value = result.etag ?? ''
    if (!result.ok && result.status !== 404) error.value = result.message ?? 'Repository access could not be loaded.'
  }

  function addGrant (principal: AccessPrincipal, relation: GrantRelation): Promise<void> {
    const grant: AccessGrant = { relation, subjectType: principal.type, issuer: principal.issuer, subject: principal.subject }
    return save([...(document.value?.grants ?? []), grant], `${principal.subject} added.`)
  }

  function changeRole (changed: AccessGrant, relation: GrantRelation): Promise<void> {
    return save((document.value?.grants ?? []).map(grant => grant === changed ? { ...grant, relation } : grant), 'Role changed.')
  }

  function removeGrant (removed: AccessGrant): Promise<void> {
    return save((document.value?.grants ?? []).filter(grant => grant !== removed), 'Access removed.')
  }

  async function save (grants: AccessGrant[], successText: string): Promise<void> {
    loading.value = true
    const result = await client.replaceRepositoryGrants(component.value, kind.value, grants, etag.value)
    loading.value = false
    if (!result.ok || !result.data) {
      error.value = result.message ?? 'The change could not be saved.'
      if (result.status === 412) await load()
      return
    }
    document.value = result.data
    etag.value = result.etag ?? etag.value
    navigationStore.dispatchSnackbar({ status: true, timeout: 4000, color: 'success', btnColor: 'buttonText', text: successText })
  }
</script>
