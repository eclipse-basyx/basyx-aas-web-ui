<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Digital Nameplate for industrial equipment"></VisualizationHeader>
        
        <v-card v-if="isLoading" class="mb-4">
            <v-skeleton-loader type="heading, table-heading@7"></v-skeleton-loader>
            <v-skeleton-loader type="heading, table-heading@5, actions"></v-skeleton-loader>
            <v-skeleton-loader type="heading, image"></v-skeleton-loader>
            <v-skeleton-loader type="heading, table-heading@2"></v-skeleton-loader>
        </v-card>

        <template v-else-if="Object.keys(digitalNameplateData).length > 0">
            <v-card v-if="productProperties.length > 0" class="mb-4">
                <v-card-title>
                    <div class="text-subtitle-1">{{ 'Product' }}</div>
                </v-card-title>
                <v-card-text>
                    <v-sheet border rounded>
                        <v-table>
                            <tbody>
                                <template
                                    v-for="(productProperty, index) in productProperties"
                                    :key="productProperty.idShort">
                                    <tr
                                        v-if="hasValue(productProperty)"
                                        :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                        <td>
                                            <div class="text-subtitleText text-caption">
                                                <span>{{ nameToDisplay(productProperty) }}</span>
                                                <DescriptionTooltip :description-array="productProperty?.description" />
                                            </div>
                                        </td>
                                        <td>
                                            <template v-if="checkIdShort(productProperty, 'URIOfTheProduct')">
                                                <a
                                                    v-if="valueToDisplay(productProperty).startsWith('http')"
                                                    :href="valueToDisplay(productProperty)"
                                                    target="_blank"
                                                    class="text-caption text-primary">
                                                    {{ valueToDisplay(productProperty) }}
                                                </a>
                                                <span v-else class="text-caption">
                                                    {{ valueToDisplay(productProperty) }}
                                                </span>
                                            </template>
                                            <template v-else-if="checkIdShort(productProperty, 'CountryOfOrigin')">
                                                <div v-if="getCountryName(valueToDisplay(productProperty))" class="text-caption">
                                                    {{ getCountryName(valueToDisplay(productProperty)) }} ({{ valueToDisplay(productProperty) }})
                                                </div>
                                                <div v-else class="text-caption">
                                                    {{ valueToDisplay(productProperty) }}
                                                </div>
                                            </template>
                                            <template v-else-if="checkIdShort(productProperty, 'Versions')">
                                                <span v-for="(version, i) in productProperty.value" :key="i" style="white-space: nowrap">
                                                    <span class="text-caption mr-2">{{ nameToDisplay(version) + ':' }}</span>
                                                    <v-chip v-if="valueToDisplay(version)" label size="x-small" border class="mr-5">
                                                        {{ valueToDisplay(version) }}
                                                    </v-chip>
                                                    <v-chip v-else label size="x-small" border class="mr-5">
                                                        {{ version.value[0].text }}
                                                    </v-chip>
                                                </span>
                                            </template>
                                            <template v-else-if="productProperty.modelType == 'MultiLanguageProperty'">
                                                <div v-if="valueToDisplay(productProperty)" class="text-caption">
                                                    {{ valueToDisplay(productProperty) }}
                                                </div>
                                                <template v-for="(langStringSet, j) in productProperty.value" v-else :key="j">
                                                    <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                        <v-chip size="x-small" label class="mr-1">{{ langStringSet.language }}</v-chip>
                                                        {{ langStringSet?.text }}
                                                    </div>
                                                </template>
                                            </template>
                                            <span v-else class="text-caption">
                                                {{ valueToDisplay(productProperty) }}
                                            </span>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </v-table>
                    </v-sheet>
                </v-card-text>
            </v-card>

            <v-card v-if="manufacturerProperties.length > 0" class="mb-4">
                <v-card-title>
                    <div class="text-subtitle-1">{{ 'Manufacturer' }}</div>
                </v-card-title>
                <v-card-text class="pb-0">
                    <v-sheet border rounded>
                        <v-table>
                            <tbody>
                                <template
                                    v-for="(manufacturerProperty, index) in manufacturerProperties"
                                    :key="manufacturerProperty.idShort">
                                    <tr
                                        v-if="hasValue(manufacturerProperty)"
                                        :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                        <td>
                                            <div class="text-subtitleText text-caption">
                                                <span>{{ nameToDisplay(manufacturerProperty) }}</span>
                                                <DescriptionTooltip :description-array="manufacturerProperty?.description" />
                                            </div>
                                        </td>
                                        <td>
                                            <template v-if="checkIdShort(manufacturerProperty, 'AddressOfAdditionalLink')">
                                                <a v-if="valueToDisplay(manufacturerProperty).startsWith('http')" :href="valueToDisplay(manufacturerProperty)" target="_blank" class="text-caption text-primary">
                                                    {{ valueToDisplay(manufacturerProperty) }}
                                                </a>
                                                <span v-else class="text-caption">{{ valueToDisplay(manufacturerProperty) }}</span>
                                            </template>
                                            <v-img v-else-if="checkIdShort(manufacturerProperty, 'CompanyLogo')" :src="valueToDisplay(manufacturerProperty)" max-width="300px" max-height="300px" contain class="my-2"></v-img>
                                            <span v-else-if="['TelephoneNumber', 'FaxNumber', 'EmailAddress', 'Email'].some(id => checkIdShort(manufacturerProperty, id))" class="text-caption">
                                                <v-chip v-if="manufacturerProperty?.typeOfValue" size="x-small" class="mr-2">{{ manufacturerProperty.typeOfValue }}</v-chip>
                                                <template v-if="checkIdShort(manufacturerProperty, 'Email') || checkIdShort(manufacturerProperty, 'EmailAddress')">
                                                    <a :href="`mailto:${valueToDisplay(manufacturerProperty)}`" class="text-caption text-primary">{{ valueToDisplay(manufacturerProperty) }}</a>
                                                </template>
                                                <template v-else>{{ valueToDisplay(manufacturerProperty) }}</template>
                                            </span>
                                            <span v-else class="text-caption">{{ valueToDisplay(manufacturerProperty) }}</span>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </v-table>
                    </v-sheet>
                </v-card-text>
                <v-card-actions v-if="vCardString && vCardString.trim() !== ''" class="py-4 pr-4">
                    <v-spacer></v-spacer>
                    <v-btn size="small" color="primary" variant="elevated" prepend-icon="mdi-card-account-details" @click="downloadVCard(vCardString, 'ManufacturerContact.vcf')">
                        Download Contact
                    </v-btn>
                </v-card-actions>
            </v-card>

            <v-card v-if="vCardString.length > 0" class="mb-4">
                <l-map :zoom="5" :center="[center.lat, center.lng]" :options="{ scrollWheelZoom: false }" style="height: 400px; width: 100%">
                    <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
                    <l-marker :lat-lng="center"></l-marker>
                </l-map>
            </v-card>

            <v-card v-if="markingsSMC && Object.keys(markingsSMC).length > 0 && markings.length > 0" class="mb-4">
                <v-card-title>
                    <div class="text-subtitle-1">
                        {{ nameToDisplay(markingsSMC, 'en', 'Markings') }}
                        <DescriptionTooltip :description-array="markingsSMC?.description" />
                    </div>
                </v-card-title>
                <v-card-text>
                    <v-row class="text-caption mb-2" justify="start">
                        <v-col v-for="marking in markings" :key="marking.idShort" cols="auto" class="pb-0">
                            <v-img :src="marking.src" height="150px" width="150px" contain></v-img>
                            <span class="text-subtitleText text-caption">{{ marking.name }}</span>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <v-card v-if="assetSpecificPropertiesSMC && assetSpecificPropertiesSMC?.value?.length > 0" class="mb-4">
                <v-card-title>
                    <div class="text-subtitle-1">
                        {{ nameToDisplay(assetSpecificPropertiesSMC, 'en', 'Asset Specific Properties') }}
                        <DescriptionTooltip :description-array="assetSpecificPropertiesSMC?.description" />
                    </div>
                </v-card-title>
                <v-card-text>
                    <GenericDataVisu :submodel-element-data="assetSpecificPropertiesSMC.value"></GenericDataVisu>
                </v-card-text>
            </v-card>

            <v-card class="mt-4 mb-10" border elevation="2">
                <v-card-title class="d-flex align-center">
                    <v-icon start color="primary">mdi-file-certificate</v-icon>
                    <div class="text-subtitle-1">Physical Nameplate (Generator)</div>
                </v-card-title>
                <v-card-text>
                    <p class="text-caption mb-4">
                        Generate a standards-compliant physical layout based on AAS data and the IEC 63365 standard.
                    </p>
                    <v-btn 
                        color="primary" 
                        prepend-icon="mdi-printer-eye" 
                        :loading="isGenerating"
                        @click="generatePhysicalNameplate"
                    >
                        Generate Nameplate Preview
                    </v-btn>
                </v-card-text>

                <v-expand-transition>
                    <div v-if="generatedHtmlUrl">
                        <v-divider></v-divider>
                        <v-card-text class="pa-0 bg-grey-lighten-4">
                            <iframe 
                                :src="generatedHtmlUrl" 
                                style="width: 100%; height: 650px; border: none; display: block;"
                            ></iframe>
                        </v-card-text>
                    </div>
                </v-expand-transition>
            </v-card>

        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import 'leaflet/dist/leaflet.css';
    import { LMap, LMarker, LTileLayer } from '@vue-leaflet/vue-leaflet';
    import { latLng } from 'leaflet';
    import { computed, onMounted, ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { useContactInformation_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/ContactInformation_v1_0Utils';
    import { useVirtualContactFileUtils } from '@/composables/VirtualContactFileUtils';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { firstLangStringSetText } from '@/utils/AAS/SubmodelElements/MultiLanguagePropertyUtils';
    import { getCountryName } from '@/utils/LocaleUtils';

    defineOptions({
        name: 'DigitalNameplate',
        semanticId: 'https://admin-shell.io/idta/nameplate/3/0/Nameplate',
    });

    const navigationStore = useNavigationStore();
    const { setData } = useSMHandling();
    const { checkIdShort, getSubmodelElementByIdShort, nameToDisplay } = useReferableUtils();
    const { hasValue, valueToDisplay } = useSME();
    const { determineAddress, generateVCard, getTypeOfEmailAddress, getTypeOfFaxNumber, getTypeOfTelephone } = useContactInformation_v1_0Utils();
    const { downloadVCard } = useVirtualContactFileUtils();
    const { valueBlob } = useSMEFile();

    const props = defineProps({
        submodelElementData: { type: Object as any, default: {} as any },
    });

    const isLoading = ref(false);
    const digitalNameplateData = ref({} as any);
    const productProperties = ref([] as Array<any>);
    const manufacturerProperties = ref([] as Array<any>);
    const markingsSMC = ref({} as any);
    const markings = ref([] as Array<any>);
    const assetSpecificPropertiesSMC = ref({} as any);
    const vCardString = ref('');
    const url = ref('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    const attribution = ref('Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors');
    const center = ref(latLng(51.1657, 10.4515));

    // Generator State
    const isGenerating = ref(false);
    const generatedHtmlUrl = ref('');

    const isMobile = computed(() => navigationStore.getIsMobile);

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization(): Promise<void> {
        isLoading.value = true;
        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            digitalNameplateData.value = {};
            isLoading.value = false;
            return;
        }
        digitalNameplateData.value = await setData({ ...props.submodelElementData }, props.submodelElementData.path);
        extractProductProperties(digitalNameplateData.value);
        extractManufacturerProperties(digitalNameplateData.value);
        extractMarkings(digitalNameplateData.value);
        extractAssetSpecificProperties(digitalNameplateData.value);
        isLoading.value = false;
    }

    async function generatePhysicalNameplate(): Promise<void> {
        isGenerating.value = true;
        try {
            const submodelId = props.submodelElementData.id;
            // Base64 encoding for API compatibility
            const encodedId = btoa(unescape(encodeURIComponent(submodelId))).replaceAll('=', '');

            const backendBase = "http://localhost:8080/NameplateGenerateByReference";
            const dockerRepo = "http://localhost:8081/submodels";

            // Construct URL for the Iframe
            generatedHtmlUrl.value = `${backendBase}?${dockerRepo}?${encodedId}`;
        } catch (error) {
            console.error("Generator Error:", error);
        } finally {
            isGenerating.value = false;
        }
    }

    function extractProductProperties(digitalNameplateData: any): void {
        const productPropertyIdShorts = ['URIOfTheProduct', 'ManufacturerProductDesignation', 'ManufacturerProductRoot', 'ManufacturerProductFamily', 'ManufacturerProductType', 'OrderCodeOfManufacturer', 'ProductArticleNumberOfManufacturer', 'SerialNumber', 'YearOfConstruction', 'DateOfManufacture', 'HardwareVersion', 'FirmwareVersion', 'SoftwareVersion', 'CountryOfOrigin'];
        let versions = [] as Array<any>;
        digitalNameplateData.submodelElements.forEach((sme: any) => {
            productPropertyIdShorts.forEach((idShort: any) => {
                if (checkIdShort(sme, idShort)) {
                    if (['HardwareVersion', 'FirmwareVersion', 'SoftwareVersion'].includes(idShort)) {
                        if (hasValue(sme)) versions.push(sme);
                    } else {
                        if (hasValue(sme)) productProperties.value.push(sme);
                    }
                }
            });
        });
        if (versions.length > 0) productProperties.value.push({ idShort: 'Versions', value: versions, modelType: 'Versions' });
    }

    function extractManufacturerProperties(digitalNameplateData: any): void {
        const manufacturerPropertyIdShorts = ['ManufacturerName', 'CompanyLogo', 'UniqueFacilityIdentifier'];
        digitalNameplateData.submodelElements.forEach((sme: any) => {
            manufacturerPropertyIdShorts.forEach(async (idShort: any) => {
                if (checkIdShort(sme, idShort) && hasValue(sme)) {
                    if (idShort === 'CompanyLogo') sme.value = await valueBlob(sme);
                    manufacturerProperties.value.push(sme);
                }
            });
        });
        let manufacturerContactInformationSMC = getSubmodelElementByIdShort('AddressInformation', digitalNameplateData);
        if (hasValue(manufacturerContactInformationSMC)) {
            let address = determineAddress(manufacturerContactInformationSMC);
            if (address.trim() !== '') {
                setMarker(address);
                manufacturerProperties.value.push({ idShort: 'Address', value: address, modelType: 'Property' });
            }
        }
    }

    async function extractMarkings(digitalNameplateData: any): Promise<void> {
        markingsSMC.value = getSubmodelElementByIdShort('Markings', digitalNameplateData);
        if (hasValue(markingsSMC.value)) {
            const markingSMCs = markingsSMC.value.value;
            if (Array.isArray(markingSMCs) && markingSMCs.length > 0) {
                const formattedMarkings = await Promise.all(markingSMCs.map(async (markingSMC: any) => {
                    const markingFile = getSubmodelElementByIdShort('MarkingFile', markingSMC);
                    const markingName = getSubmodelElementByIdShort('MarkingName', markingSMC);
                    if (hasValue(markingName) && hasValue(markingFile)) {
                        return { idShort: markingSMC.idShort, name: markingName.value, src: await valueBlob(markingFile) };
                    }
                    return null;
                }));
                markings.value = formattedMarkings.filter((m) => m !== null);
            }
        }
    }

    function extractAssetSpecificProperties(digitalNameplateData: any): void {
        assetSpecificPropertiesSMC.value = getSubmodelElementByIdShort('AssetSpecificProperties', digitalNameplateData);
    }

    function setMarker(address: string): void {
        if (address.trim().length > 0) {
            const url = 'https://nominatim.openstreetmap.org/search?format=json&q=';
            fetch(url + address).then((response) => response.json()).then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    center.value = latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
                }
            });
        }
    }
</script>