<template>
    <v-container fluid class="pa-0">

        <h1>Nameplate Visualization</h1>

        <div v-if="localSubmodelElementData.submodelElements">
            <!--Manufacturer general information-->
            <br>
            <h3>Manufacturer information</h3>

            <table>
                <tbody>
                    <tr>
                        <td>
                            <h4>Name</h4>
                        </td>
                        <td>{{ localSubmodelElementData.submodelElements[0].value[0].text }}</td>
                    </tr>

                    <tr>
                        <td>
                            <h4>Product designation</h4>
                        </td>
                        <td>{{ localSubmodelElementData.submodelElements[1].value[0].text }}</td>
                    </tr>

                    <tr>
                        <td>
                            <h4>Order code</h4>
                        </td>
                        <td>{{ localSubmodelElementData.submodelElements[2].value[0].text }}</td>
                    </tr>
                </tbody>
            </table>

        </div>

        <div v-for="(submodelElement, index) in localSubmodelElementData.submodelElements" :key="submodelElement.id">
            <div v-if="submodelElement.value.length > 1"> <!--Contact information-->
                <br>
                <h3>Contact information</h3>
                <!--Company name-->
                <p>{{ submodelElement.value[2].value[0].text }}</p>

                <!--Street-->
                <p>{{ submodelElement.value[3].value[0].text }}</p>

                <!--ZIP - City-->
                <p>{{ submodelElement.value[0].value[0].text }}-{{ submodelElement.value[4].value[0].text }} {{
                    submodelElement.value[1].value[0].text }}</p>

                <!--Mail-->
                <br>
                <p>E-Mail: {{ submodelElement.value[8].value[0].value }}</p>

                <!--Phone-->
                <p>Phone: {{ submodelElement.value[7].value[0].value[0].text }}</p>
            </div>
        </div>

        {{ console.log(localSubmodelElementData) /* DEBUG */ }}

    </v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useTheme } from 'vuetify';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';

export default defineComponent({
    name: 'NameplateVisu',
    props: ['submodelElementData'],

    setup() {
        const theme = useTheme();
        const aasStore = useAASStore();

        const { nameToDisplay } = useReferableUtils();
        const { putRequest } = useRequestHandling();

        return {
            theme, // Theme Object
            aasStore, // AASStore Object
            nameToDisplay,
            putRequest,
        };
    },

    data() {
        return {
            localSubmodelElementData: [] as any, // SubmodelElement Data
            // conceptDescriptions: {}, // Data of Concept Descriptions
        };
    },

    watch: {
        submodelElementData: {
            handler() {
                this.initializeSubmodelElementData();
            },
            deep: true,
        },
    },

    mounted() {
        this.initializeSubmodelElementData();
    },

    methods: {
        // Initialize the SubmodelElement Data
        initializeSubmodelElementData() {
            if (!this.submodelElementData) return;

            // console.log('SubmodelElementData: ', this.submodelElementData)
            if (Object.keys(this.submodelElementData).length === 0) {
                this.localSubmodelElementData = null; // Reset the SubmodelElement Data when no Node is selected
                return;
            }
            let submodelElementData = this.submodelElementData;
            // console.log('SubmodelElementData: ', submodelElementData);
            this.localSubmodelElementData = submodelElementData;
        },
    },
});
</script>