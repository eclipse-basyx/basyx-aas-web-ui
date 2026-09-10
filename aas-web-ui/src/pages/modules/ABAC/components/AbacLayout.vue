<template>
  <v-container v-if="loading" class="h-100 w-100 d-flex justify-center align-center">
    <v-progress-circular color="primary" indeterminate :size="70" :width="8" />
  </v-container>

  <v-container
    v-else
    class="d-flex px-0 position-relative abac-scroll"
    fluid
    style="height: calc(100dvh - var(--v-layout-top, 64px) - var(--v-layout-bottom, 40px) - 2px)"
  >
    <template v-if="isMobile">
      <v-navigation-drawer v-if="isListOpen" v-model="isListOpen" temporary width="320">
        <PoliciesList @collapse="isListOpen = !isListOpen" />
      </v-navigation-drawer>

      <ListExpand v-else @expand="isListOpen = !isListOpen" />
    </template>

    <template v-else>
      <PoliciesList v-if="isListOpen" class="my-2" @collapse="isListOpen = !isListOpen" />
      <ListExpand v-else @expand="isListOpen = !isListOpen" />
    </template>

    <PolicyDetail />
  </v-container>
</template>

<script setup lang="ts">
  import { useAbacNavigation } from '../hooks/useAbacNavigation'
  import PolicyDetail from './policy/detail/PolicyDetail.vue'
  import PoliciesList from './policy/list/PoliciesList.vue'
  import ListExpand from './shared/ListExpand.vue'

  defineProps<{ loading: boolean }>()

  const { isListOpen, isMobile } = useAbacNavigation()
</script>

<style scoped>
.abac-scroll :deep(::-webkit-scrollbar) {
  width: 4px;
  height: 4px;
}

.abac-scroll :deep(::-webkit-scrollbar-track) {
  background: transparent;
}

.abac-scroll :deep(::-webkit-scrollbar-thumb) {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 2px;
}

.abac-scroll :deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(var(--v-theme-on-surface), 0.4);
}
</style>
