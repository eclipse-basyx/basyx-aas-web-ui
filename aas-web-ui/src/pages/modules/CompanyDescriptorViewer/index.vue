<template>
  <v-container>
    <v-card>
      <v-list nav>
        <!-- Company Identification -->
        <IdentificationElement :identification-object="companyDescriptor" />

        <v-divider v-if="companyDescriptor.domain" class="mt-2" />
        <!-- Company Domain -->
        <v-list-item v-if="companyDescriptor.domain">
          <v-hover v-slot="{ isHovering, props }">
            <v-list-item class="pa-0 mt-n2 mb-n2" v-bind="props">
              <template #title>
                <div class="text-title-small">{{ 'Domain:' }}</div>
              </template>

              <v-list-item-subtitle>
                <span
                  :class="isHovering ? 'cursor-pointer' : ''"
                  @click="copyToClipboard(companyDescriptor.domain, 'Domain', getDomainCopyIconAsRef())"
                >
                  <v-icon v-if="isHovering" class="mr-1" color="subtitleText" size="x-small">{{
                    domainCopyIcon
                  }}</v-icon>

                  <span>{{ companyDescriptor.domain }}</span>
                </span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-hover>
        </v-list-item>

        <!-- Company Administrative Information-->
        <v-divider
          v-if="
            companyDescriptor.administration &&
              (companyDescriptor.administration.revision != '' ||
                companyDescriptor.administration.version != '')
          "
          class="mt-2"
        />

        <AdministrativeInformationElement
          v-if="companyDescriptor.administration"
          :administrative-information-object="companyDescriptor.administration"
          :administrative-information-title="'Administrative Information'"
          :small="false"
        />

        <v-divider
          v-if="companyDescriptor.displayName && companyDescriptor.displayName.length > 0"
          class="mt-2"
        />
        <!-- Company DisplayName -->
        <DisplayNameElement
          v-if="companyDescriptor.displayName && companyDescriptor.displayName.length > 0"
          :display-name-array="companyDescriptor.displayName"
          :display-name-title="'Display Name'"
          :small="false"
        />

        <v-divider
          v-if="companyDescriptor.nameOptions && companyDescriptor.nameOptions.length > 0"
          class="mt-2"
        />
        <!-- Company Name Options -->
        <StringListElement
          v-if="companyDescriptor.nameOptions && companyDescriptor.nameOptions.length > 0"
          :small="false"
          :string-array="companyDescriptor.nameOptions"
          :title="'Name Options'"
        />

        <v-divider
          v-if="companyDescriptor.description && companyDescriptor.description.length > 0"
          class="mt-2"
        />
        <!-- Company Description -->
        <DescriptionElement
          v-if="companyDescriptor.description && companyDescriptor.description.length > 0"
          :description-array="companyDescriptor.description"
          :description-title="'Description'"
          :small="false"
        />

        <v-divider
          v-if="companyDescriptor.endpoints && companyDescriptor.endpoints.length > 0"
          class="mt-2"
        />
        <!-- Company Endpoints -->
        <EndpointsElement
          v-if="companyDescriptor.endpoints && companyDescriptor.endpoints.length > 0"
          :endpoints-array="companyDescriptor.endpoints"
          :endpoints-title="'Endpoints'"
          :small="false"
        />

        <v-divider
          v-if="companyDescriptor.assetIdRegexPatterns && companyDescriptor.assetIdRegexPatterns.length > 0"
          class="mt-2"
        />
        <!-- Company Asset ID Regex Patterns -->
        <StringListElement
          v-if="companyDescriptor.assetIdRegexPatterns && companyDescriptor.assetIdRegexPatterns.length > 0"
          :small="false"
          :string-array="companyDescriptor.assetIdRegexPatterns"
          :title="'Asset ID Regex Patterns'"
        />
      </v-list>
    </v-card>
  </v-container>
</template>

  <script lang="ts" setup>
  import type { Ref } from 'vue'
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useCompanyLookupClient } from '@/composables/Client/CompanyLookupClient'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { useEnvStore } from '@/store/EnvironmentStore'

  // Vue Router
  const router = useRouter()

  // Composables
  const { fetchCompanyDescriptorById } = useCompanyLookupClient()
  const { copyToClipboard } = useClipboardUtil()

  // Stores
  const envStore = useEnvStore()

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'Company Data',
    needsInfrastructureEndpoints: ['CompanyLookup'],
    needsEnvVariables: ['COMPANY_LOOKUP_DOMAIN'],
  })

  // Data
  const companyDescriptor = ref({} as any) // Variable to store the Company Descriptor
  const domainCopyIcon = ref<string>('mdi-clipboard-file-outline')
  function getDomainCopyIconAsRef (): Ref {
    return domainCopyIcon
  }

  // Computed
  const companyId = computed(() => envStore.getCompanyLookupDomain)

  onMounted(() => {
    initialize()
  })

  async function initialize () {
    companyDescriptor.value = await fetchCompanyDescriptorById(companyId.value)

    if (!companyDescriptor.value || Object.keys(companyDescriptor.value).length === 0)
      router.push({ name: 'NotFound404', query: {} })
  }
</script>
