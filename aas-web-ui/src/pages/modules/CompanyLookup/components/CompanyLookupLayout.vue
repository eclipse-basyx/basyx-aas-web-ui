<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useCompanyLookupI18n } from '../i18n/useCompanyLookupI18n'
  import CompaniesList from './CompaniesList.vue'
  import CompanyLookupConfigurator from './CompanyLookupConfigurator.vue'
  import CompanyDetail from './detail/CompanyDetail.vue'

  const { t } = useCompanyLookupI18n()
  const navigationStore = useNavigationStore()

  const isMobile = computed(() => navigationStore.getIsMobile)

  const drawer = ref(false)
  const listCollapsed = ref(false)

  // Auto-close mobile drawer when leaving mobile
  watch(isMobile, val => {
    if (!val) drawer.value = false
  })

  function onSelect (id?: string): void {
    if (isMobile.value && hasContent(id)) drawer.value = false
  }
</script>

<template>
  <div class="h-100 w-100 d-flex flex-column">
    <div class="flex-shrink-0 d-flex align-center px-4 py-2 border-b">
      <v-btn
        v-if="isMobile"
        class="mr-2"
        icon="mdi-menu"
        size="small"
        variant="text"
        @click="drawer = !drawer"
      />

      <v-btn
        v-else
        class="mr-2"
        :icon="listCollapsed ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'"
        size="small"
        variant="text"
        @click="listCollapsed = !listCollapsed"
      >
        <v-icon>{{ listCollapsed ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left' }}</v-icon>

        <v-tooltip activator="parent" location="bottom" :open-delay="600">
          {{ listCollapsed ? t('layout.expandList') : t('layout.collapseList') }}
        </v-tooltip>
      </v-btn>

      <span class="text-h6">{{ t('module.title') }}</span>

      <v-spacer />

      <CompanyLookupConfigurator />
    </div>

    <div class="cl-body d-flex flex-grow-1 overflow-hidden">
      <v-navigation-drawer
        v-if="isMobile"
        v-model="drawer"
        temporary
        width="320"
      >
        <CompaniesList @select="onSelect" />
      </v-navigation-drawer>

      <div v-if="!isMobile && !listCollapsed" class="list">
        <CompaniesList @select="onSelect" />
      </div>

      <div class="cl-detail flex-grow-1 overflow-y-auto">
        <CompanyDetail />
      </div>
    </div>
  </div>
</template>

<style scoped>
.list {
  width: 340px;
  max-width: 40%;
  height: 100%;
  overflow-y: auto;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
}
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
