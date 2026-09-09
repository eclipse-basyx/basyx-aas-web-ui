<template>
  <template v-if="isMobile">
    <v-navigation-drawer v-if="isListOpen" v-model="isListOpen" temporary width="320">
      <div class="list">
        <Policies />
        <ListFooter @collapse="isListOpen = !isListOpen" />
      </div>
    </v-navigation-drawer>

    <Expand v-else @expand="isListOpen = !isListOpen" />
  </template>

  <template v-else>
    <div v-if="isListOpen" class="list">
      <Policies />
      <ListFooter @collapse="isListOpen = !isListOpen" />
    </div>

    <Expand v-else @expand="isListOpen = !isListOpen" />
  </template>
</template>

<script setup lang="ts">
  import Expand from '@/pages/modules/ABAC/components/policy/list/components/Expand.vue'
  import ListFooter from '@/pages/modules/ABAC/components/policy/list/components/Footer.vue'
  import Policies from '@/pages/modules/ABAC/components/policy/list/Policies.vue'
  import { useAbacNavigation } from '@/pages/modules/ABAC/hooks/useAbacNavigation'

  const { isListOpen, isMobile } = useAbacNavigation()
</script>

<style scoped>
.list {
  height: 100%;
  width: 320px;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
