<template>
    <v-container
        v-if="
            semanticIdObject &&
            semanticIdObject.keys &&
            Array.isArray(semanticIdObject.keys) &&
            semanticIdObject.keys.length > 0
        "
        fluid
        class="pa-0">
        <template v-if="withExpansionPanel">
            <v-expansion-panel elevation="0" tile static>
                <v-expansion-panel-title class="px-2 py-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                    <!-- Tooltip with Semantic ID -->
                    <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                        <div v-for="(semanticId, i) in semanticIdObject.keys" :key="i" class="text-caption">
                            <span class="font-weight-bold">{{ '(' + semanticId.type + ') ' }}</span>
                            {{ semanticId.value }}
                        </div>
                    </v-tooltip>
                    <span v-if="semanticIdTitle !== ''" :class="small ? 'text-caption' : 'text-subtitle-2 '">
                        {{ semanticIdTitle }}
                    </span>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                    <v-list nav class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                        <v-list-item class="py-3">
                            <!-- Semantic ID keys -->
                            <v-list-item-subtitle
                                v-for="(semanticId, i) in semanticIdObject.keys"
                                :key="i"
                                :class="i === 0 ? '' : 'pt-1'">
                                <v-chip label size="x-small" border class="mr-2">
                                    {{ semanticId.type ? semanticId.type : 'no-type' }}
                                </v-chip>
                                <span>{{ semanticId.value }}</span>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </template>
        <template v-else>
            <v-list nav class="pa-0" :class="backgroundColor ? 'bg-' + backgroundColor : ''">
                <v-list-item class="py-3">
                    <v-list-item-title v-if="semanticIdTitle !== ''">
                        <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                            <div v-for="(semanticId, i) in semanticIdObject.keys" :key="i" class="text-caption">
                                <span class="font-weight-bold">{{ '(' + semanticId.type + ') ' }}</span>
                                {{ semanticId.value }}
                            </div>
                        </v-tooltip>
                        <span :class="small ? 'text-caption' : 'text-subtitle-2 '">
                            {{ semanticIdTitle }}
                        </span>
                    </v-list-item-title>
                    <!-- Semantic ID keys -->
                    <v-list-item-subtitle
                        v-for="(semanticId, i) in semanticIdObject.keys"
                        :key="i"
                        :class="i === 0 ? '' : 'pt-1'">
                        <v-chip label size="x-small" border class="mr-2">
                            {{ semanticId.type ? semanticId.type : 'no-type' }}
                        </v-chip>
                        <span>{{ semanticId.value }}</span>
                    </v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    // Props
    defineProps({
        semanticIdObject: {
            type: Object as any,
            default: {} as any,
        },
        semanticIdTitle: {
            type: String,
            default: 'Semantic ID',
        },
        small: {
            type: Boolean,
            default: false,
        },
        withExpansionPanel: {
            type: Boolean,
            default: true,
        },
        backgroundColor: {
            type: String,
            default: '',
        },
    });
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding-left: 0px !important;
        padding-right: 0px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
    }
</style>
