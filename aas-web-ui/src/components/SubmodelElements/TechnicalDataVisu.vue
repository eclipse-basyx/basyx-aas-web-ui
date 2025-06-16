<template>
    <v-container fluid class="pa-0">

        <h1>Technical Data Visualization</h1>

        <div v-if="localSubmodelElementData.submodelElements"> 
            <h3>{{ localSubmodelElementData.submodelElements[0].idShort }}</h3>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <h4>Manufacturer</h4>
                        </td>
                        <td>{{ localSubmodelElementData.submodelElements[0].value[0].value }}</td>
                    </tr>
                    
                    <tr>
                        <td>
                            <h4>{{ localSubmodelElementData.submodelElements[0].value[1].idShort }}</h4>
                        </td>
                        <td>{{ localSubmodelElementData.submodelElements[0].value[1].value }}</td>
                    </tr>
                    <tr>
                        <td>
                            <h4>{{ localSubmodelElementData.submodelElements[0].value[2].idShort }}</h4>
                        </td>
                        <td>{{ localSubmodelElementData.submodelElements[0].value[2].value }}</td>
                    </tr>
                    <tr>
                        <td>
                            <h4>{{ localSubmodelElementData.submodelElements[0].value[3].idShort }}</h4> <!--product designation-->
                        </td>
                        <td>{{ localSubmodelElementData.submodelElements[0].value[3].value }}</td>
                    </tr>
                    <tr>
                        <td>
                            <h4>Logo</h4>
                        </td>
                        <td><img width="100px" height="100px" :src="localSubmodelElementData.submodelElements[0].value[4].value" /></td>
                    </tr>
                    <tr>
                        <td>
                            <h4>Product image</h4>
                        </td>
                        <td><img width="100px" height="100px" :src="localSubmodelElementData.submodelElements[0].value[5].value" /></td>
                    </tr>

                    <tr>
                        <td>
                            <h4>Product classifications</h4>
                        </td>
                        <td><GenericDataVisu :submodel-element-data="submodelElementData.submodelElements[1].value"></GenericDataVisu></td>
                    </tr>

                    
                </tbody>
            </table>

            <div v-for="(submodelElement, index) in localSubmodelElementData.submodelElements" :key="submodelElement.id">

            {{ console.log("SubmodelElement: ", submodelElement) }}

            </div>
        </div>
        <p v-else>Technical data not found.</p>

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
    name: 'TechnicalDataVisu',
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