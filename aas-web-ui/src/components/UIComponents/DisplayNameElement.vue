<template>
    <v-container v-if="displayNames && Array.isArray(displayNames) && displayNames.length > 0" fluid class="pa-0">
        <v-expansion-panel elevation="0" tile static :class="backgroundColor ? 'bg-' + backgroundColor : ''">
            <v-expansion-panel-title class="px-2 py-0">
                <!-- Tooltip with DisplayName -->
                <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-for="(displayName, i) in displayNames" :key="i" class="text-caption">
                        <span class="font-weight-bold">{{ displayName.language + ': ' }}</span
                        >{{ displayName.text }}
                    </div>
                </v-tooltip>
                <span v-if="displayNameTitle !== ''" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                    {{ displayNameTitle }}
                </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                <v-list nav class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                    <v-list-item class="py-3">
                        <!-- DisplayNames (different Languages) -->
                        <v-list-item-subtitle
                            v-for="(displayName, i) in displayNames"
                            :key="i"
                            :class="i === 0 ? '' : 'pt-1'">
                            <v-chip label size="x-small" border class="mr-2">
                                {{ displayName.language ? displayName.language : 'no-lang' }}
                            </v-chip>
                            <span>{{ displayName.text }}</span>
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
        displayNameArray: {
            type: Array<any>,
            default: [] as Array<any>,
        },
        displayNameTitle: {
            type: String,
            default: 'Display Name',
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

    const displayNames = ref([] as Array<any>);

    // Watcher
    watch(
        () => props.displayNameArray,
        () => {
            initialize();
        },
        { deep: true }
    );

    onMounted(() => {
        initialize();
    });

    function initialize(): void {
        if (props.displayNameArray.length > 0) {
            displayNames.value = [...props.displayNameArray];
            // Order display names regarding language tag
            displayNames.value.sort((displayNameA: any, displayNameB: any) => {
                let languageA: string = displayNameA?.language || '';
                let languageB: string = displayNameB?.language || '';

                return languageA.localeCompare(languageB);
            });
        } else {
            displayNames.value = [];
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
