<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="strings && Array.isArray(strings) && strings.length > 0">
      <!-- Tooltip with Name Options -->
      <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
        <div v-for="(nameOption, i) in strings" :key="i" class="text-body-small">
          {{ nameOption }}
        </div>
      </v-tooltip>
      <!-- Name Options Title -->
      <template #title>
        <div class="mt-1" :class="small ? 'text-body-small' : 'text-title-small '">
          {{ title + ':' }}
        </div>
      </template>
      <!-- Name Options List -->
      <v-list-item-subtitle v-for="(nameOption, i) in strings" :key="i">
        <div class="pt-2">
          <span>{{ nameOption }}</span>
        </div>
      </v-list-item-subtitle>
    </v-list-item>
  </v-container>
</template>

<script lang="ts" setup>
    // Props
  defineProps({
    strings: {
      type: Array<string>,
      default: [] as Array<string>,
    },
    title: {
      type: String,
      default: 'Strings',
    },
    small: {
      type: Boolean,
      default: false,
    },
  })
</script>
