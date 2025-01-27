<template>
    <v-container v-if="descriptions && Array.isArray(descriptions) && descriptions.length > 0" fluid class="pa-0">
        <v-expansion-panel elevation="0" tile static>
            <v-expansion-panel-title class="px-2 py-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                <!-- Tooltip with Description -->
                <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-for="(description, i) in descriptions" :key="i" class="text-caption">
                        <span class="font-weight-bold">{{ description.language + ': ' }}</span>
                        {{ description.text }}
                    </div>
                </v-tooltip>
                <span v-if="descriptionTitle !== ''" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ descriptionTitle }}
                </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                <v-list nav class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                    <v-list-item class="py-3">
                        <!-- Descriptions (different Languages) -->
                        <v-list-item-subtitle
                            v-for="(description, i) in descriptions"
                            :key="i"
                            :class="i === 0 ? '' : 'pt-1'">
                            <v-chip label size="x-small" border class="mr-2">
                                {{ description.language ? description.language : 'no-lang' }}
                            </v-chip>
                            <span>{{ description.text }}</span>
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, ref, watch } from 'vue';

    // Props
    const props = defineProps({
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
        backgroundColor: {
            type: String,
            default: '',
        },
    });

    const descriptions = ref([] as Array<any>);

    // Watcher
    watch(
        () => props.descriptionArray,
        () => {
            initialize();
        },
        { deep: true }
    );

    onMounted(() => {
        initialize();
    });

    function initialize(): void {
        if (props.descriptionArray.length > 0) {
            descriptions.value = [...props.descriptionArray];
            // Order display names regarding language tag
            descriptions.value.sort((descriptionA: any, descriptionB: any) => {
                let languageA: string = descriptionA?.language || '';
                let languageB: string = descriptionB?.language || '';

                return languageA.localeCompare(languageB);
            });
        } else {
            descriptions.value = [];
        }
    }
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding-left: 0px !important;
        padding-right: 0px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
    }
</style>
