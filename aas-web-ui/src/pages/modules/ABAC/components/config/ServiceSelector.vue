<template>
  <ActionMenu v-model="isMenuOpen">
    <template #activator="{ props: menuProps }">
      <span
        v-bind="menuProps"
        class="text-subtitle-2 cursor-pointer"
        :class="{ 'text-warning': isEmpty, 'text-error': isInvalid }"
      >
        {{ selectedServiceName }}
      </span>
    </template>

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
          :text="service.available ? t('config.selector.available') : t('config.selector.unavailable')"
        >
          <template #activator="{ props }">
            <v-icon v-bind="props" :color="service.available?'success':'error'" :icon="service.available?ICONS.AVAILABLE:ICONS.UNAVAILABLE" size="18" />
          </template>
        </v-tooltip>

      </template>
    </v-list-item>
  </ActionMenu>
</template>

<script setup lang="ts">
  import type { AbacService } from '../../types/service'
  import { hasItems } from '@/utils/array'
  import { useAbacNavigation } from '../../hooks/useAbacNavigation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import { useAbacConfigStore } from '../../stores/useAbacConfigStore'
  import ActionMenu from '../shared/menu/ActionMenu.vue'

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
    if (isEmpty.value) return t('config.selector.noServiceAvailable')
    if (isInvalid.value) return t('config.selector.noValidServiceSelected')
    return abacServices.value.find(s => s.url === configStore.apiUrl)?.name || t('config.selector.noServiceSelected')
  })

  function onSelect (service: AbacService): void {
    configStore.setApiUrl(service.url)
    onSelectService(service.componentKey)
  }
</script>
