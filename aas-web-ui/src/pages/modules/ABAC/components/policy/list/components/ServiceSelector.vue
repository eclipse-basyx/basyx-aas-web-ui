<template>
  <v-menu v-model="isMenuOpen">
    <template #activator="{ props: menuProps }">
      <span
        v-bind="menuProps"
        class="text-subtitle-2 cursor-pointer"
        :class="{ 'text-warning': isEmpty, 'text-error': isInvalid }"
      >{{ selectedServiceName }}</span>
    </template>

    <v-sheet border>
      <v-list class="py-0" density="compact">
        <v-list-item
          v-for="service in abacServices"
          :key="service.url"
          :active="configStore.apiUrl === service.url"
          slim
          @click="onSelect(service)"
        >
          <template #prepend>
            <v-icon :icon="ICONS.SERVICE" size="21" />
          </template>

          <v-list-item-title>{{ service.name }}</v-list-item-title>

          <template #append>
            <v-tooltip
              location="bottom"
              open-delay="600"
              :text="service.available ? t('policies.list.selector.available') : t('policies.list.selector.unavailable')"
            >
              <template #activator="{ props }">
                <v-icon v-bind="props" :color="service.available?'success':'error'" :icon="service.available?ICONS.AVAILABLE:ICONS.UNAVAILABLE" size="18" /></template>
            </v-tooltip>

          </template>
        </v-list-item>
      </v-list>
    </v-sheet>
  </v-menu>

</template>

<script setup lang="ts">
  import type { AbacService } from '@/pages/modules/ABAC/types/service'
  import { useAbacNavigation } from '@/pages/modules/ABAC/hooks/useAbacNavigation'
  import { useAbacI18n } from '@/pages/modules/ABAC/i18n/useAbacI18n'
  import { useAbacConfigStore } from '@/pages/modules/ABAC/stores/useAbacConfigStore'
  import { hasItems } from '@/utils/array'

  const ICONS = {
    SERVICE: 'mdi-server',
    AVAILABLE: 'mdi-check-circle',
    UNAVAILABLE: 'mdi-alert-circle',
  } as const

  const { t } = useAbacI18n()
  const configStore = useAbacConfigStore()
  const { onSelectService } = useAbacNavigation()

  const isMenuOpen = ref(false)

  const abacServices = computed(() => configStore.services)

  const isEmpty = computed(() => !hasItems(abacServices.value))
  const isInvalid = computed(() => hasItems(abacServices.value) && !configStore.apiUrl)

  const selectedServiceName = computed(() => {
    if (isEmpty.value) return t('policies.list.selector.noServiceAvailable')
    if (isInvalid.value) return t('policies.list.selector.noValidServiceSelected')
    return abacServices.value.find(s => s.url === configStore.apiUrl)?.name || t('policies.list.selector.noServiceSelected')
  })

  function onSelect (service: AbacService): void {
    configStore.setApiUrl(service.url)
    onSelectService(service.componentKey)
  }
</script>
