<template>
    <v-container fluid class="pa-0">
        <!-- entityType -->
        <v-list-item class="px-1 pb-1 pt-2">
            <v-list-item-title>
                <span class="text-subtitle-2 mr-2">{{ 'Entity Type: ' }}</span>
                <v-chip label size="x-small" border color="primary" style="margin-top: -3px">{{
                    entityObject.entityType
                }}</v-chip>
            </v-list-item-title>
        </v-list-item>
        <v-divider v-if="entityObject.globalAssetId"></v-divider>
        <!-- globalAssetId -->
        <v-list-item v-if="entityObject.globalAssetId" class="px-1 pb-1 py-2 mb-3">
            <template #title>
                <div class="text-subtitle-2 mt-2" v-html="'Global Asset ID: '"></div>
            </template>
            <template #subtitle>
                <div class="pt-2">
                    <v-btn
                        size="small"
                        class="mr-2 text-buttonText"
                        color="primary"
                        :disabled="isDisabled(entityObject.globalAssetId)"
                        :loading="isLoading(entityObject.globalAssetId)"
                        @click="jump(entityObject.globalAssetId)"
                        >Jump</v-btn
                    >
                    <span v-html="entityObject.globalAssetId"></span>
                </div>
            </template>
        </v-list-item>
        <v-divider v-if="entityObject.specificAssetIds && entityObject.specificAssetIds.length > 0"></v-divider>
        <!-- specificAssetIds -->
        <v-list-item
            v-if="entityObject.specificAssetIds && entityObject.specificAssetIds.length > 0"
            class="px-1 pb-1 py-2 mb-3">
            <template #title>
                <div class="text-subtitle-2 mt-2" v-html="'Specific Asset IDs: '"></div>
            </template>
            <template #subtitle>
                <div v-for="specificAssetId in entityObject.specificAssetIds" :key="specificAssetId.name" class="pt-2">
                    <v-btn
                        size="small"
                        class="mr-2 text-buttonText"
                        color="primary"
                        :disabled="isDisabled(specificAssetId.value)"
                        :loading="isLoading(specificAssetId.value)"
                        @click="jump(specificAssetId.value)"
                        >Jump</v-btn
                    >
                    <v-chip label size="x-small" border color="primary" class="mr-2" style="margin-top: -3px">{{
                        specificAssetId.name
                    }}</v-chip>
                    <span v-html="specificAssetId.value"></span>
                </div>
            </template>
        </v-list-item>
        <!-- Group of contained SubmodelElements -->
        <SubmodelElementGroup
            :sme-object="entityObject"
            :sme-locator="'statements'"
            :top-margin="'mt-1'"></SubmodelElementGroup>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRouter } from 'vue-router';
    import SubmodelElementGroup from '@/components/UIComponents/SubmodelElementGroup.vue';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'Entity',
        components: {
            SubmodelElementGroup,
        },
        mixins: [SubmodelElementHandling],
        props: {
            entityObject: {
                type: Object,
                default: () => ({}),
            },
            isEditable: {
                type: Boolean,
                default: true,
            },
        },

        setup() {
            const aasStore = useAASStore();
            const router = useRouter();

            return {
                aasStore, // AASStore Object
                router, // Router Object
            };
        },

        data() {
            return {
                disabledStates: {} as any,
                loadingStates: {} as any,
                shellDescriptors: {} as any,
            };
        },

        created() {
            // initialize disabledStates, loadingStates and
            if (this.entityObject.globalAssetId) {
                this.checkAndSetDisabledState(this.entityObject.globalAssetId);
                this.loadingStates[this.entityObject.globalAssetId] = false;
            }
            if (this.entityObject.specificAssetIds) {
                this.entityObject.specificAssetIds.forEach((specificAssetId: any) => {
                    this.checkAndSetDisabledState(specificAssetId.name);
                    this.loadingStates[specificAssetId.name] = false;
                });
            }
        },

        methods: {
            isDisabled(assetId: string): boolean {
                return this.disabledStates[assetId] || false;
            },

            isLoading(assetId: string): boolean {
                return this.loadingStates[assetId] || false;
            },

            checkAndSetDisabledState(assetId: string) {
                this.loadingStates[assetId] = true;
                this.checkAssetId(assetId)
                    .then(({ success, aas }) => {
                        this.loadingStates[assetId] = false;
                        if (success) {
                            this.disabledStates[assetId] = false;
                            this.shellDescriptors[assetId] = aas;
                        } else {
                            this.disabledStates[assetId] = true;
                        }
                    })
                    .catch(() => {
                        this.loadingStates[assetId] = false;
                        this.disabledStates[assetId] = true;
                    });
            },

            jump(assetId: string) {
                // console.log('Jump to AAS with assetId: ', assetId);
                let aas = this.shellDescriptors[assetId];
                this.jumpToReferencedElement(aas, []);
            },
        },
    });
</script>
