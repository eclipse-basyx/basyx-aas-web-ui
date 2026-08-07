<script setup lang="ts">
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import Expand from './components/Expand.vue'
  import ListFooter from './components/Footer.vue'
  import Policies from './Policies.vue'

  const { isListOpen, isMobile } = useAbacNavigation()
</script>

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
    <div v-if="isListOpen" class="list" style="max-width: 40%;">
      <Policies />
      <ListFooter @collapse="isListOpen = !isListOpen" />
    </div>

    <Expand v-else @expand="isListOpen = !isListOpen" />
  </template>
</template>

<style scoped>
.list {
  height: 100%;
  width: 30vw;
  min-width: 320px;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
