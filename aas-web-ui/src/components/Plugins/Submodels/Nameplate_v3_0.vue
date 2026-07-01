<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Digital Nameplate for industrial equipment"></VisualizationHeader>
        
        <v-card v-if="isLoading" class="mb-4">
            <v-skeleton-loader type="heading, table-heading@7"></v-skeleton-loader>
        </v-card>

        <template v-else-if="Object.keys(digitalNameplateData).length > 0">
            <v-card v-if="productProperties.length > 0" class="mb-4">
                <v-card-title><div class="text-subtitle-1">Product Properties</div></v-card-title>
                <v-card-text>
                    <v-sheet border rounded>
                        <v-table>
                            <tbody>
                                <tr v-for="(prop, i) in productProperties" :key="prop.idShort" :class="i % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                    <td><div class="text-caption font-weight-bold">{{ nameToDisplay(prop) }}</div></td>
                                    <td><span class="text-caption">{{ valueToDisplay(prop) }}</span></td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-sheet>
                </v-card-text>
            </v-card>

            <v-card class="mt-4 mb-10" border elevation="2">
                <v-card-title class="d-flex align-center">
                    <v-icon start color="primary">mdi-file-certificate</v-icon>
                    <div class="text-subtitle-1">Physical Nameplate (Generator)</div>
                </v-card-title>
                <v-card-text>
                    <v-row align="center" no-gutters>
                        <v-btn color="primary" prepend-icon="mdi-printer-eye" :loading="isGenerating" @click="generatePhysicalNameplate" class="mr-2">
                            Generate Preview
                        </v-btn>
                        <v-btn v-if="generatedHtmlUrl" variant="outlined" color="secondary" prepend-icon="mdi-download" @click="triggerDownload">
                            Download SVG
                        </v-btn>
                    </v-row>
                </v-card-text>

                <v-expand-transition>
                    <div v-if="generatedHtmlUrl">
                        <v-divider></v-divider>
                        <v-card-text class="pa-0 bg-grey-lighten-4">
                            <iframe id="nameplate-iframe" :src="generatedHtmlUrl" style="width: 100%; height: 650px; border: none; display: block;"></iframe>
                        </v-card-text>
                    </div>
                </v-expand-transition>
            </v-card>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import { ref, onMounted } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';

    defineOptions({
        name: 'DigitalNameplate',
        semanticId: 'https://admin-shell.io/idta/nameplate/3/0/Nameplate',
    });

    const props = defineProps({ submodelElementData: { type: Object as any, default: {} as any } });
    const isLoading = ref(false);
    const digitalNameplateData = ref({} as any);
    const productProperties = ref([] as Array<any>);
    const generatedHtmlUrl = ref('');
    const isGenerating = ref(false);

    const { setData } = useSMHandling();
    const { nameToDisplay } = useReferableUtils();
    const { valueToDisplay } = useSME();

    onMounted(() => { initializeVisualization(); });

    async function initializeVisualization() {
        isLoading.value = true;
        try {
            digitalNameplateData.value = await setData({ ...props.submodelElementData }, props.submodelElementData.path);
            if (digitalNameplateData.value?.submodelElements) {
                productProperties.value = digitalNameplateData.value.submodelElements.filter((sme: any) => sme.modelType.includes('Property'));
            }
        } finally {
            isLoading.value = false;
        }
    }

    async function generatePhysicalNameplate() {
        isGenerating.value = true;
        const submodelId = props.submodelElementData.id;
        const encodedId = btoa(unescape(encodeURIComponent(submodelId))).replaceAll('=', '');
        generatedHtmlUrl.value = `http://localhost:8080/NameplateGenerateByReference?http://localhost:8081/submodels?${encodedId}`;
        isGenerating.value = false;
    }

    function triggerDownload() {
        const iframe = document.getElementById('nameplate-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage('trigger-svg-download', '*');
        }
    }
</script>

<style scoped>
.bg-tableEven { background-color: rgba(0, 0, 0, 0.02); }
.bg-tableOdd { background-color: white; }
</style>