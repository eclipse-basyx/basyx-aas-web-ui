<template>
    <v-container fluid class="pa-0">
        <v-list nav>
            <!-- Header -->
            <v-list-item v-if="loading" class="pt-0 pb-0">
                <v-skeleton-loader type="heading"></v-skeleton-loader>
            </v-list-item>
            <v-list-item v-else-if="Object.keys(propertyData ?? {}).length > 0" class="pt-0 pb-0">
                <template #title>
                    <div class="text-primary text-subtitle-1">
                        {{ nameToDisplay(propertyData) + ':' }}
                        <v-chip variant="outlined" class="ml-2">{{ propertyData.value + ' mm²' }}</v-chip>
                        <v-chip variant="outlined" class="ml-2">{{ 'AWG: ' + getAwg(propertyData.value) }}</v-chip>
                    </div>
                </template>
            </v-list-item>
            <v-list-item v-if="loading">
                <v-skeleton-loader type="text@2"></v-skeleton-loader>
            </v-list-item>
            <v-list-item v-else-if="Object.keys(propertyData ?? {}).length > 0">
                <v-table v-if="getAwg(propertyData.value)">
                    <tbody>
                        <tr>
                            <td><v-icon class="ml-2">mdi-diameter-outline</v-icon> diameter</td>
                            <td>
                                <p>
                                    {{
                                        Number(0.127 * 92 ** ((36 - getAwg(propertyData.value)) / 39)).toFixed(3) +
                                        ' mm'
                                    }}
                                </p>
                                <p>
                                    {{
                                        Number(0.005 * 92 ** ((36 - getAwg(propertyData.value)) / 39)).toFixed(4) +
                                        ' inch'
                                    }}
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td><v-icon class="ml-2">mdi-circle-outline</v-icon> area</td>
                            <td>
                                <p>
                                    {{
                                        Number((0.127 * 92 ** ((36 - getAwg(propertyData.value)) / 39)) ** 2).toFixed(
                                            3
                                        ) + ' mm²'
                                    }}
                                </p>
                                <p>
                                    {{
                                        Number((0.005 * 92 ** ((36 - getAwg(propertyData.value)) / 39)) ** 2).toFixed(
                                            4
                                        ) + ' inch²'
                                    }}
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-list-item>
        </v-list>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'Awg',
        semanticId: [
            '0173-1#02-AAB940#007',
            '0173-1#02-AAB789#007',
            '0173-1#02-AAB937#007',
            '0173-1#02-AAB787#007',
            '0173-1#02-BAC740#007',
            '0173-1#02-BAC677#007',
            '0173-1#02-BAC739#007',
            '0173-1#02-BAC676#007',
            '0173-1#02-AAB935#006',
            '0173-1#02-AAB785#006',
        ],
        mixins: [SubmodelElementHandling],
        props: ['submodelElementData'],

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                propertyData: {} as any, // Object to store the data of the property
                awg: [
                    {
                        awg: 1,
                        crossection_eq_mm: 50,
                    },
                    {
                        awg: 2,
                        crossection_eq_mm: 35,
                    },
                    {
                        awg: 4,
                        crossection_eq_mm: 25,
                    },
                    {
                        awg: 6,
                        crossection_eq_mm: 16,
                    },
                    {
                        awg: 8,
                        crossection_eq_mm: 10,
                    },
                    {
                        awg: 10,
                        crossection_eq_mm: 6,
                    },
                    {
                        awg: 12,
                        crossection_eq_mm: 4,
                    },
                    {
                        awg: 14,
                        crossection_eq_mm: 2.5,
                    },
                    {
                        awg: 16,
                        crossection_eq_mm: 1.5,
                    },
                    {
                        awg: 18,
                        crossection_eq_mm: 1,
                    },
                    {
                        awg: 19,
                        crossection_eq_mm: 0.75,
                    },
                    {
                        awg: 20,
                        crossection_eq_mm: 0.75,
                    },
                    {
                        awg: 21,
                        crossection_eq_mm: 0.5,
                    },
                    {
                        awg: 22,
                        crossection_eq_mm: 0.34,
                    },
                    {
                        awg: 24,
                        crossection_eq_mm: 0.25,
                    },
                    {
                        awg: 26,
                        crossection_eq_mm: 0.14,
                    },
                    {
                        awg: 28,
                        crossection_eq_mm: 0.09,
                    },
                ],
                loading: false, // Loading State
            };
        },

        computed: {
            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },
        },

        mounted() {
            this.initializeVisualization(); // Initialize plugin when the component is mounted
        },

        methods: {
            initializeVisualization() {
                this.loading = true;

                // Check if a Node is selected
                if (Object.keys(this.submodelElementData).length == 0) {
                    this.propertyData = {}; // Reset the DigitalNameplate Data when no Node is selected
                    this.loading = false;
                    return;
                }

                let propertyData = { ...this.propertyData }; // create local copy of the Nameplate Object
                this.propertyData = propertyData;
                this.loading = false;
            },

            getAwg(crossection_eq_mm: number): number {
                let awgObject = this.awg.find((awgObject) => awgObject.crossection_eq_mm === crossection_eq_mm);
                if (awgObject) return awgObject.awg;
                return 0;
            },
        },
    });
</script>
