<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="displayNameArray && Array.isArray(displayNameArray) && displayNameArray.length > 0">
      <!-- Tooltip with DisplayName -->
      <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
        <div v-for="(displayName, i) in displayNameArray" :key="i" class="text-body-small">
          <span class="font-weight-bold">{{ displayName.language + ': ' }}</span>{{ displayName.text }}
        </div>
      </v-tooltip>
      <!-- DisplayName Title -->
      <template #title>
        <div class="mt-1" :class="small ? 'text-body-small' : 'text-title-small '">
          {{ displayNameTitle + ':' }}
        </div>
      </template>
      <!-- DisplayNames List (different Languages) -->
      <v-list-item-subtitle v-for="(displayName, i) in displayNameArray" :key="i">
        <div class="pt-2">
          <v-chip border class="mr-2" label size="x-small">{{
            displayName.language ? displayName.language : 'no-lang'
          }}</v-chip>

          <span>{{ displayName.text }}</span>
        </div>
      </v-list-item-subtitle>
    </v-list-item>
  </v-container>
</template>

<script setup lang="ts">
    // Props
  defineProps({
    displayNameArray: {
      type: Object as any,
      default: {} as any,
    },
    displayNameTitle: {
      type: String,
      default: 'Display Name',
    },
    small: {
      type: Boolean,
      default: false,
    },
  })
</script>
