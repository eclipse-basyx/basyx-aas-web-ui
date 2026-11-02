<template>
  <v-row align="start" class="my-0 ga-4" no-gutters>
    <v-col cols="12" sm="4">
      <slot name="source" />
    </v-col>

    <v-col cols="12" sm>
      <slot />
    </v-col>

    <v-col v-if="$slots.actions" cols="auto">
      <slot name="actions" />
    </v-col>
  </v-row>
</template>
