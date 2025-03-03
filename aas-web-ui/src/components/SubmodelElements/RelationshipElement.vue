<template>
    <v-container fluid class="pa-0">
        <div v-for="(referenceKey, j) in referenceKeys" :key="j">
            <v-list-item class="px-1 pb-1 pt-0">
                <v-list-item-title class="text-subtitle-2 mt-2">{{
                    capitalizeFirstLetter(referenceKey) +
                    ' (' +
                    getReferences[referenceKey as 'first' | 'second'].type +
                    '): '
                }}</v-list-item-title>
            </v-list-item>
            <v-card v-if="relationshipElementObject" color="elevatedCard">
                <!-- Value of the Property -->
                <v-list nav class="bg-elevatedCard pt-0">
                    <template v-for="(keys, i) in getReferences[referenceKey as 'first' | 'second'].keys" :key="i">
                        <v-list-item>
                            <!-- Tooltip with Reference ID -->
                            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                                <div class="text-caption">
                                    <span class="font-weight-bold">{{ '(' + keys.type + ') ' }}</span
                                    >{{ keys.value }}
                                </div>
                            </v-tooltip>
                            <!-- Reference Representation -->
                            <template #subtitle>
                                <div class="pt-2">
                                    <v-chip label size="x-small" border class="mr-2">{{ keys.type }}</v-chip>
                                    <span>{{ keys.value }}</span>
                                </div>
                            </template>
                        </v-list-item>
                        <v-divider
                            v-if="i < getReferences[referenceKey as 'first' | 'second'].keys.length - 1"
                            class="mt-3"></v-divider>
                    </template>
                </v-list>
                <v-divider></v-divider>
                <!-- Action Buttons for Reference Jump -->
                <v-list nav class="bg-elevatedCard pa-0">
                    <v-list-item>
                        <template #append>
                            <!-- Jump-Button -->
                            <v-btn
                                size="small"
                                class="text-buttonText"
                                color="primary"
                                :disabled="getDisabledState[referenceKey as 'first' | 'second']"
                                @click="jumpToReference(getReferences[referenceKey as 'first' | 'second'])"
                                >Jump</v-btn
                            >
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>
        </div>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRouter } from 'vue-router';
    import { useReferenceComposable } from '@/composables/AAS/ReferenceComposable';
    import { useJumpHandling } from '@/composables/JumpHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { capitalizeFirstLetter } from '@/utils/StringUtils';

    export default defineComponent({
        name: 'RelationshipElement',
        props: {
            relationshipElementObject: {
                type: Object,
                default: () => ({}),
            },
        },

        setup() {
            const aasStore = useAASStore();
            const router = useRouter();
            const { checkReference } = useReferenceComposable();
            const { jumpToReference } = useJumpHandling();

            return {
                aasStore, // AASStore Object
                router, // Router Object
                capitalizeFirstLetter,
                checkReference,
                jumpToReference,
            };
        },

        data() {
            return {
                referenceKeys: ['first', 'second'], // Keys of the References
                firstReference: {} as any,
                secondReference: {} as any,
                firstLoading: false, // Loading State of the first Jump-Button (loading when checking if referenced element exists in one of the registered AAS)
                secondLoading: false, // Loading State of the second Jump-Button (loading when checking if referenced element exists in one of the registered AAS)
                firstDisabled: true, // Disabled State of the first Jump-Button (disabled when referenced element does not exist in one of the registered AAS)
                secondDisabled: true, // Disabled State of the second Jump-Button (disabled when referenced element does not exist in one of the registered AAS)
            };
        },

        computed: {
            // Get the referenceObject based on the referenceKey
            getReferences() {
                return {
                    first: this.firstReference,
                    second: this.secondReference,
                };
            },

            // Get the loadingState based on the referenceKey
            getLoadingState() {
                return {
                    first: this.firstLoading,
                    second: this.secondLoading,
                };
            },

            // Get the disabledState based on the referenceKey
            getDisabledState() {
                return {
                    first: this.firstDisabled,
                    second: this.secondDisabled,
                };
            },
        },

        watch: {
            // Watch for changes in the relationshipElementObject
            relationshipElementObject: {
                deep: true,
                handler() {
                    this.firstReference = this.relationshipElementObject.first;
                    this.secondReference = this.relationshipElementObject.second;
                    this.validateReference('first');
                    this.validateReference('second');
                },
            },
        },

        mounted() {
            this.firstReference = this.relationshipElementObject.first;
            this.secondReference = this.relationshipElementObject.second;
            this.validateReference('first');
            this.validateReference('second');
        },

        methods: {
            // Function to check if the referenced Element exists
            validateReference(referenceKey: string) {
                (this as any)[referenceKey + 'Loading'] = true;

                this.checkReference((this as any)[referenceKey + 'Reference'])
                    .then((success) => {
                        (this as any)[referenceKey + 'Disabled'] = !success;
                        (this as any)[referenceKey + 'Loading'] = false;
                    })
                    .catch((error) => {
                        // Handle any errors
                        console.error('Error:', error);
                        (this as any)[referenceKey + 'Loading'] = false;
                    });
            },
        },
    });
</script>
