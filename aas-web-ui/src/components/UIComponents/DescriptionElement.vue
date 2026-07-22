<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="descriptionArray && Array.isArray(descriptionArray) && descriptionArray.length > 0">
      <!-- Description Title -->
      <template #title>
        <div class="mt-1" :class="small ? 'text-body-small' : 'text-title-small '">
          {{ descriptionTitle + ':' }}
        </div>
      </template>
      <!-- Descriptions List (different Languages) -->
      <v-list-item-subtitle v-for="(description, i) in descriptionArray" :key="i">
        <v-row class="pt-2 ga-4 align-center">
          <v-col cols="auto">
            <v-chip border label size="x-small">{{
              description.language ? description.language : 'no-lang'
            }}</v-chip>
          </v-col>

          <v-col :class="multiline ? '' : 'text-no-wrap text-truncate'">
            <span>{{ description.text }}</span>
          </v-col>
          <!-- Tooltip with Description -->
          <v-tooltip v-if="!multiline" activator="parent" open-delay="600" transition="slide-x-transition">
            <div class="text-body-small">
              <span class="font-weight-bold">{{ description.language + ': ' }}</span>{{ description.text }}
            </div>
          </v-tooltip>
        </v-row>
      </v-list-item-subtitle>
    </v-list-item>
  </v-container>
</template>

<script setup lang="ts">
    // Props
  defineProps({
    descriptionArray: {
      type: Array<any>,
      default: [] as Array<any>,
    },
    descriptionTitle: {
      type: String,
      default: 'Description',
    },
    small: {
      type: Boolean,
      default: false,
    },
    multiline: {
      type: Boolean,
      default: false,
    },
  })
</script>
