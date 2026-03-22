<template>
  <template v-if="descriptionArray && Array.isArray(descriptionArray) && descriptionArray.length > 0">
    <!-- Show english description, if available -->
    <v-tooltip
      v-if="descriptionToDisplay({ description: descriptionArray }, 'en')"
      activator="parent"
      location="bottom"
      max-width="360px"
      open-delay="600"
      transition="slide-y-transition"
    >
      <div class="text-caption">
        {{ descriptionToDisplay({ description: descriptionArray }, 'en') }}
      </div>
    </v-tooltip>
    <!-- Otherwise show all available descriptions -->
    <v-tooltip
      v-else
      activator="parent"
      location="bottom"
      max-width="360px"
      open-delay="600"
      transition="slide-y-transition"
    >
      <div v-for="(description, i) in descriptionArray" :key="i" class="text-caption">
        <span class="font-weight-thin">
          {{
            (getLanguageName(description.language)
              ? getLanguageName(description.language)
              : description.language) + ': '
          }}
        </span>
        {{ description.text }}
      </div>
    </v-tooltip>
  </template>
</template>

<script lang="ts" setup>
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { getLanguageName } from '@/utils/LocaleUtils'

  // Composables
  const { descriptionToDisplay } = useReferableUtils()

  defineProps({
    descriptionArray: {
      type: Array<any>,
      default: [] as Array<any>,
    },
  })
</script>
