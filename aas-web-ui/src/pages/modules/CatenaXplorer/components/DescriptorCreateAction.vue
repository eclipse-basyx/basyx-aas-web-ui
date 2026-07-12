<template>
  <div
    v-if="fixed"
    class="descriptor-create-action--fixed"
  >
    <v-btn
      class="descriptor-create-action__button text-buttonText"
      color="primary"
      elevation="8"
      height="44"
      prepend-icon="mdi-plus"
      rounded="pill"
      variant="flat"
      @click="emit('create')"
    >
      Create descriptor
    </v-btn>
  </div>

  <div v-else>
    <v-divider />

    <div class="pa-2">
      <v-btn
        block
        class="text-buttonText"
        color="primary"
        prepend-icon="mdi-plus"
        rounded="lg"
        variant="flat"
        @click="emit('create')"
      >
        Create descriptor
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
  withDefaults(defineProps<{
    fixed?: boolean
  }>(), {
    fixed: false,
  })

  const emit = defineEmits<{
    create: []
  }>()
</script>

<style scoped>
.descriptor-create-action--fixed {
  bottom: calc(48px + env(safe-area-inset-bottom));
  left: calc(8px + env(safe-area-inset-left));
  position: fixed;
  z-index: 7;
}

.descriptor-create-action__button {
  max-width: calc(100vw - 96px - env(safe-area-inset-left) - env(safe-area-inset-right));
}
</style>
