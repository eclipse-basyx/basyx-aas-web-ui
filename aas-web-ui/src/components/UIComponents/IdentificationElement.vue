<template>
    <v-container fluid class="pa-0">
        <v-hover v-slot="{ isHovering, props }">
            <v-list-item>
                <!-- Tooltip with idShort and identification id -->
                <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-if="identificationObject.idShort" class="text-caption">
                        <span class="font-weight-bold">{{ nameType + ': ' }}</span
                        >{{ identificationObject['idShort'] }}
                    </div>
                    <div v-if="identificationObject && identificationObject.id" class="text-caption">
                        <span class="font-weight-bold">{{ 'ID: ' }}</span
                        >{{ identificationObject['id'] }}
                    </div>
                </v-tooltip>
                <!-- idShort -->
                <template #title>
                    <div class="text-primary text-subtitle-1">{{ nameToDisplay(identificationObject) }}</div>
                    <div v-if="identificationObject.id">{{ idType + ':' }}</div>
                </template>
                <!-- identification id -->
                <template #subtitle>
                    <div
                        v-if="identificationObject.id"
                        v-bind="props"
                        :class="isHovering ? 'cursor-pointer' : ''"
                        @click="copyToClipboard(identificationObject.id, idType, getCopyIconAsRef())">
                        <v-icon v-if="isHovering" color="subtitleText" size="x-small" class="mr-1">{{
                            copyIcon
                        }}</v-icon>
                        <span>{{ identificationObject.id ? identificationObject.id : '' }}</span>
                    </div>
                </template>
                <!-- modelType -->
                <template #append>
                    <v-chip size="x-small" color="primary">{{ modelType }}</v-chip>
                </template>
            </v-list-item>
        </v-hover>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent, Ref, ref } from 'vue';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'IdentificationElement',
        mixins: [SubmodelElementHandling],
        props: ['identificationObject', 'modelType', 'idType', 'nameType'],

        setup() {
            const navigationStore = useNavigationStore();

            const { copyToClipboard } = useClipboardUtil();

            const copyIcon = ref<string>('mdi-clipboard-file-outline');

            const getCopyIconAsRef = (): Ref => {
                return copyIcon;
            };

            return {
                navigationStore, // NavigationStore Object
                copyToClipboard,
                copyIcon,
                getCopyIconAsRef,
            };
        },
    });
</script>
