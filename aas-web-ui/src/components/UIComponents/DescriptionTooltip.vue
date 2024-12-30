<template>
    <template v-if="descriptionArray && Array.isArray(descriptionArray) && descriptionArray.length > 0">
        <!-- Show english description, if available -->
        <v-tooltip
            v-if="descriptionToDisplay({ description: descriptionArray }, 'en')"
            activator="parent"
            open-delay="600"
            transition="slide-y-transition"
            max-width="360px"
            location="bottom">
            <div class="text-caption">
                {{ descriptionToDisplay({ description: descriptionArray }, 'en') }}
            </div>
        </v-tooltip>
        <!-- Otherwise show all available descriptions -->
        <v-tooltip
            v-else
            activator="parent"
            open-delay="600"
            transition="slide-y-transition"
            max-width="360px"
            location="bottom">
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
    import { getLanguageName } from '@/utils/LocaleUtils';
    import { descriptionToDisplay } from '@/utils/ReferableUtils';

    defineProps({
        descriptionArray: {
            type: Array<any>,
            default: [] as Array<any>,
            required: true,
        },
    });
</script>
