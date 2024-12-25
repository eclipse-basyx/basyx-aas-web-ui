<template>
    <v-container v-if="Object.keys(submodelElementData).length > 0" fluid class="pa-0">
        <!-- Header -->
        <v-card class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">
                    {{ nameToDisplay(submodelElementData, 'Digital Nameplate') }}
                </div>
            </v-card-title>
            <v-card-text v-if="descriptionToDisplay(submodelElementData)" class="pt-0">
                {{ descriptionToDisplay(submodelElementData) }}
            </v-card-text>
        </v-card>
        <!-- Product -->
        <v-card v-if="loadingState" class="mb-4">
            <!-- Product properties -->
            <v-skeleton-loader type="heading, table-heading@7"></v-skeleton-loader>
            <!-- Manufacturer properties -->
            <v-skeleton-loader type="heading, table-heading@5, actions"></v-skeleton-loader>
            <!-- Markings -->
            <v-skeleton-loader type="heading, image"></v-skeleton-loader>
            <!-- Asset Specific Properties -->
            <v-skeleton-loader type="heading, table-heading@2"></v-skeleton-loader>
        </v-card>
        <template v-else-if="Object.keys(digitalNameplateData).length > 0">
            <!-- Product properties-->
            <v-card v-if="Object.keys(productProperties).length > 0" class="mb-4">
                <v-card-title>
                    <div class="text-subtitle-1">{{ 'Product' }}</div>
                </v-card-title>
                <v-card-text>
                    <v-table>
                        <tbody>
                            <tr
                                v-for="(productProperty, index) in productProperties"
                                :key="productProperty.idShort"
                                :class="index % 2 === 0 ? 'tableEven' : 'bg-tableOdd'">
                                <td>
                                    <div class="text-subtitleText text-caption">
                                        <span>{{ nameToDisplay(productProperty) }}</span>
                                        <!-- Show english description, if available -->
                                        <v-tooltip
                                            v-if="descriptionToDisplay(productProperty)"
                                            activator="parent"
                                            open-delay="600"
                                            transition="slide-y-transition"
                                            max-width="360px"
                                            location="bottom">
                                            <div class="text-caption">
                                                {{ descriptionToDisplay(productProperty) }}
                                            </div>
                                        </v-tooltip>
                                        <!-- Otherwise show all available descriptions -->
                                        <v-tooltip
                                            v-else-if="
                                                productProperty.description && productProperty.description.length > 0
                                            "
                                            activator="parent"
                                            open-delay="600"
                                            transition="slide-y-transition"
                                            max-width="360px"
                                            location="bottom">
                                            <div
                                                v-for="(description, i) in productProperty.description"
                                                :key="i"
                                                class="text-caption">
                                                <span class="font-weight-bold">
                                                    {{ description.language + ': ' }}
                                                </span>
                                                {{ description.text }}
                                            </div>
                                        </v-tooltip>
                                    </div>
                                </td>
                                <td>
                                    <!-- URIOfTheProduct -->
                                    <a
                                        v-if="checkIdShort(productProperty, 'URIOfTheProduct')"
                                        :href="productProperty.value"
                                        target="_blank"
                                        class="text-caption">
                                        {{ productProperty.value }}
                                    </a>
                                    <!-- MultiLanguageProperties -->
                                    <template v-else-if="productProperty.modelType == 'MultiLanguageProperty'">
                                        <!-- Show english value, if available -->
                                        <div v-if="valueToDisplay(productProperty)" class="text-caption">
                                            {{ valueToDisplay(productProperty) }}
                                        </div>
                                        <!-- Otherwise show all available values -->
                                        <template v-for="(langStringSet, j) in productProperty.value" v-else :key="j">
                                            <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                <span class="font-weight-bold">
                                                    {{ langStringSet?.language + ': ' }}
                                                </span>
                                                {{ langStringSet?.text }}
                                            </div>
                                        </template>
                                    </template>
                                    <!-- Versions -->
                                    <template v-else-if="productProperty.modelType == 'Versions'">
                                        <span
                                            v-for="(version, i) in productProperty.value"
                                            :key="i"
                                            style="white-space: nowrap">
                                            <span class="text-caption mr-2">{{ nameToDisplay(version) + ':' }}</span>
                                            <!-- Show english value, if available -->
                                            <v-chip
                                                v-if="valueToDisplay(version)"
                                                label
                                                size="x-small"
                                                border
                                                class="mr-5">
                                                {{ valueToDisplay(version) }}
                                            </v-chip>
                                            <!-- Otherwise show the first value -->
                                            <v-chip v-else label size="x-small" border class="mr-5">
                                                {{ version.value[0].text }}
                                            </v-chip>
                                        </span>
                                    </template>
                                    <!-- Default -->
                                    <span v-else class="text-caption">{{ productProperty.value }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>
            </v-card>
            <!-- Manufacturer properties -->
            <v-card v-if="Object.keys(manufacturerProperties).length > 0" class="mb-4">
                <v-card-title>
                    <div class="text-subtitle-1">{{ 'Manufacturer' }}</div>
                </v-card-title>
                <v-card-text>
                    <v-table>
                        <tbody>
                            <tr
                                v-for="(manufacturerProperty, index) in manufacturerProperties"
                                :key="manufacturerProperty.idShort"
                                :class="index % 2 === 0 ? 'tableEven' : 'bg-tableOdd'">
                                <td>
                                    <div class="text-subtitleText text-caption">
                                        <span>{{ nameToDisplay(manufacturerProperty) }}</span>
                                        <!-- Show english description, if available -->
                                        <v-tooltip
                                            v-if="descriptionToDisplay(manufacturerProperty)"
                                            activator="parent"
                                            open-delay="600"
                                            transition="slide-y-transition"
                                            max-width="360px"
                                            location="bottom">
                                            <div class="text-caption">
                                                {{ descriptionToDisplay(manufacturerProperty) }}
                                            </div>
                                        </v-tooltip>
                                        <!-- Otherwise show all available descriptions -->
                                        <v-tooltip
                                            v-else-if="
                                                manufacturerProperty.description &&
                                                manufacturerProperty.description.length > 0
                                            "
                                            activator="parent"
                                            open-delay="600"
                                            transition="slide-y-transition"
                                            max-width="360px"
                                            location="bottom">
                                            <div
                                                v-for="(description, i) in manufacturerProperty.description"
                                                :key="i"
                                                class="text-caption">
                                                <span class="font-weight-bold">
                                                    {{ description.language + ': ' }}
                                                </span>
                                                {{ description.text }}
                                            </div>
                                        </v-tooltip>
                                    </div>
                                </td>
                                <td>
                                    <!-- Company Logo -->
                                    <v-img
                                        v-if="checkIdShort(manufacturerProperty, 'CompanyLogo')"
                                        :src="manufacturerProperty.path + '/attachment'"
                                        max-width="100%"
                                        max-height="100%"
                                        contain
                                        class="my-2"></v-img>
                                    <!-- MultiLanguageProperties -->
                                    <template v-else-if="manufacturerProperty.modelType == 'MultiLanguageProperty'">
                                        <!-- Show english value, if available -->
                                        <div v-if="valueToDisplay(manufacturerProperty)" class="text-caption">
                                            {{ valueToDisplay(manufacturerProperty) }}
                                        </div>
                                        <!-- Otherwise show all available values -->
                                        <template
                                            v-for="(langStringSet, j) in manufacturerProperty.value"
                                            v-else
                                            :key="j">
                                            <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                <span class="font-weight-bold">
                                                    {{ langStringSet.language + ': ' }}
                                                </span>
                                                {{ langStringSet.text }}
                                            </div>
                                        </template>
                                    </template>
                                    <!-- Default -->
                                    <span v-else class="text-caption">{{ manufacturerProperty.value }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>
                <v-card-actions class="pt-0 pr-4">
                    <v-spacer></v-spacer>
                    <v-btn
                        size="small"
                        color="primary"
                        variant="elevated"
                        class="text-buttonText"
                        @click="downloadVCard(vCardString, 'ManufacturerContact.vcf')">
                        {{ 'Download Contact' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
            <!-- Leaflet Map -->
            <v-card v-if="vCardString.length > 0" class="mb-4">
                <l-map
                    :zoom="5"
                    :center="[center.lat, center.lng]"
                    :options="{ scrollWheelZoom: false }"
                    style="height: 400px; width: 100%">
                    <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
                    <l-marker :lat-lng="center"></l-marker>
                </l-map>
            </v-card>
            <!-- Markings -->
            <v-card v-if="Object.keys(markings).length > 0" class="mb-4">
                <v-card-title>
                    <div class="text-subtitle-1">{{ 'Markings' }}</div>
                </v-card-title>
                <v-card-text>
                    <v-row class="text-caption mb-2" justify="start">
                        <v-col v-for="marking in markings" :key="marking.idShort" cols="auto">
                            <v-img :src="marking.path + '/attachment'" height="150px" width="150px" contain></v-img>
                            <span class="text-subtitleText text-caption">{{ marking.name }}</span>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
            <!-- Asset Specific Properties -->
            <v-card v-if="Object.keys(assetSpecificProperties).length > 0">
                <v-card-title>
                    <div class="text-subtitle-1">{{ 'Asset Specific Properties' }}</div>
                </v-card-title>
                <v-card-text>
                    <GenericDataVisu :submodel-element-data="assetSpecificProperties"></GenericDataVisu>
                </v-card-text>
            </v-card>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import 'leaflet/dist/leaflet.css';
    import { LMap, LMarker, LTileLayer } from '@vue-leaflet/vue-leaflet';
    import { latLng } from 'leaflet';
    import { computed, onMounted, ref } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getCountryName } from '@/utils/generalUtils';
    import { valueToDisplay } from '@/utils/MultiLanguagePropertyUtils';
    import { checkIdShort } from '@/utils/ReferableUtils';
    import { descriptionToDisplay, nameToDisplay } from '@/utils/ReferableUtils';
    import { calculateSubmodelElementPathes } from '@/utils/SubmodelElementUtils';

    // Define component options such as custom static properties
    defineOptions({
        name: 'DigitalNameplate',
        semanticId: 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate',
    });

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const loadingState = ref(false);
    const digitalNameplateData = ref({} as any);
    const productProperties = ref([] as Array<any>);
    const manufacturerProperties = ref([] as Array<any>);
    const markings = ref([] as Array<any>);
    const assetSpecificProperties = ref([]);
    const vCardString = ref('');
    // Leaflet Map
    const url = ref('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    const attribution = ref('Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors');
    const center = ref(latLng(51.1657, 10.4515)); // Initial center of the Map (center of Germany)

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const isMac = computed(() => navigationStore.getPlatform.mac);
    const isIOs = computed(() => navigationStore.getPlatform.ios);

    onMounted(() => {
        initializeDigitalNameplate();
    });

    async function initializeDigitalNameplate() {
        // console.log('initializeDigitalNameplate()', 'props', props);
        loadingState.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            digitalNameplateData.value = {};
            loadingState.value = false;
            return;
        }

        digitalNameplateData.value = await calculateSubmodelElementPathes(
            { ...props.submodelElementData },
            selectedNode.value.path
        );

        extractProductProperties(digitalNameplateData.value);
        extractManufacturerProperties(digitalNameplateData.value);
        extractMarkings(digitalNameplateData.value);
        extractAssetSpecificProperties(digitalNameplateData.value);
        loadingState.value = false;
    }

    function extractProductProperties(digitalNameplateData: any) {
        // console.log('extractProductProperties()', 'digitalNameplateData:', digitalNameplateData);

        const productPropertyIdShorts = [
            'URIOfTheProduct',
            'ManufacturerProductDesignation',
            'ManufacturerProductRoot',
            'ManufacturerProductFamily',
            'ManufacturerProductType',
            'ProductArticleNumberOfManufacturer',
            'OrderCodeOfManufacturer',
            'SerialNumber',
            'YearOfConstruction',
            'DateOfManufacture',
            'HardwareVersion',
            'FirmwareVersion',
            'SoftwareVersion',
        ];

        let versions = [] as Array<any>;

        digitalNameplateData.submodelElements.forEach((sme: any) => {
            productPropertyIdShorts.forEach((idShort: any) => {
                if (checkIdShort(sme, idShort)) {
                    if (['HardwareVersion', 'FirmwareVersion', 'SoftwareVersion'].includes(idShort)) {
                        versions.push(sme);
                    } else {
                        productProperties.value.push(sme);
                    }
                }
            });
        });

        if (versions.length > 0) {
            productProperties.value.push({ idShort: 'Versions', value: versions, modelType: 'Versions' });
        }
    }

    function extractManufacturerProperties(digitalNameplateData: any) {
        // console.log('extractManufacturerProperties()', 'digitalNameplateData:', digitalNameplateData);

        const manufacturerPropertyIdShorts = ['CompanyLogo', 'ManufacturerName'];

        digitalNameplateData.submodelElements.forEach((sme: any) => {
            manufacturerPropertyIdShorts.forEach((idShort: any) => {
                if (checkIdShort(sme, idShort)) {
                    manufacturerProperties.value.push(sme);
                }
            });
        });

        // let address = '';
        let manufacturerContactInformationSmc = digitalNameplateData.submodelElements.find((sme: any) =>
            checkIdShort(sme, 'ContactInformation')
        );
        if (
            manufacturerContactInformationSmc &&
            Object.keys(manufacturerContactInformationSmc).length > 0 &&
            Array.isArray(manufacturerContactInformationSmc.value) &&
            manufacturerContactInformationSmc.value.length > 0
        ) {
            const addressTemplate = (street: string, zipcode: string, cityTown: string, country: string) =>
                `${street}, ${zipcode} ${cityTown}, ${country}`;

            let street = valueToDisplay(
                manufacturerContactInformationSmc.value.find((element: any) => checkIdShort(element, 'Street'))
            );
            let zipcode = valueToDisplay(
                manufacturerContactInformationSmc.value.find((element: any) => checkIdShort(element, 'Zipcode'))
            );
            let cityTown = valueToDisplay(
                manufacturerContactInformationSmc.value.find((element: any) => checkIdShort(element, 'CityTown'))
            );
            let country = getCountryName(
                valueToDisplay(
                    manufacturerContactInformationSmc.value.find((element: any) =>
                        checkIdShort(element, 'NationalCode')
                    )
                )
            );

            let address = addressTemplate(street, zipcode, cityTown, country);
            // console.log('extractManufacturerProperties()', ''Address:', address);
            if (address.trim().length > 0) {
                setMarker(address); // Set the Marker on the Map
                manufacturerProperties.value.push({ idShort: 'Address', value: address, modelType: 'String' });
            }

            let phoneSmc = manufacturerContactInformationSmc.value.find((sme: any) => checkIdShort(sme, 'Phone'));
            if (
                phoneSmc &&
                Object.keys(phoneSmc).length > 0 &&
                Array.isArray(phoneSmc.value) &&
                phoneSmc.value.length > 0
            ) {
                let telephoneNumber = phoneSmc.value.find((element: any) => checkIdShort(element, 'TelephoneNumber'));
                if (telephoneNumber && Object.keys(telephoneNumber).length > 0) {
                    manufacturerProperties.value.push(telephoneNumber);
                }
            }

            let faxSmc = manufacturerContactInformationSmc.value.find((sme: any) => checkIdShort(sme, 'Fax'));
            if (faxSmc && Object.keys(faxSmc).length > 0 && Array.isArray(faxSmc.value) && faxSmc.value.length > 0) {
                let faxNumber = faxSmc.value.find((element: any) => checkIdShort(element, 'FaxNumber'));
                if (faxNumber && Object.keys(faxNumber).length > 0) {
                    manufacturerProperties.value.push(faxNumber);
                }
            }

            let emailSmc = manufacturerContactInformationSmc.value.find((sme: any) => checkIdShort(sme, 'Email'));
            if (
                emailSmc &&
                Object.keys(emailSmc).length > 0 &&
                Array.isArray(emailSmc.value) &&
                emailSmc.value.length > 0
            ) {
                let emailAddress = emailSmc.value.find((element: any) => checkIdShort(element, 'EmailAddress'));
                if (emailAddress && Object.keys(emailAddress).length > 0) {
                    manufacturerProperties.value.push(emailAddress);
                }
            }

            vCardString.value = generateVCard(manufacturerProperties.value, manufacturerContactInformationSmc.value);
            // console.log('extractManufacturerProperties()', 'vCard:', vCardString.value);
        }
    }

    function extractMarkings(digitalNameplateData: any) {
        // console.log('extractMarkings()', 'digitalNameplateData:', digitalNameplateData);

        let markingsSMC = digitalNameplateData.submodelElements.find((element: any) =>
            checkIdShort(element, 'Markings')
        );

        if (markingsSMC && Object.keys(markingsSMC).length > 0) {
            let markingSMCs = markingsSMC.value;

            if (Array.isArray(markingSMCs) && markingSMCs.length > 0) {
                let formattedMarkings = [] as Array<any>;

                markingSMCs.forEach((markingSMC: any) => {
                    let markingFile = markingSMC.value.find((element: any) => checkIdShort(element, 'MarkingFile'));
                    let markingName = markingSMC.value.find((element: any) => checkIdShort(element, 'MarkingName'));

                    if (
                        markingName &&
                        Object.keys(markingName).length > 0 &&
                        markingFile &&
                        Object.keys(markingFile).length > 0
                    ) {
                        let formattedMarking = {
                            idShort: markingSMC.idShort,
                            value: markingFile.value,
                            name: markingName.value,
                            path: markingFile.path,
                        };
                        formattedMarkings.push(formattedMarking);
                    }
                });

                markings.value = formattedMarkings;
            }
        }
    }

    function extractAssetSpecificProperties(digitalNameplateData: any) {
        let assetSpecificPropertiesLocal = digitalNameplateData.submodelElements.find((element: any) =>
            checkIdShort(element, 'AssetSpecificProperties')
        );

        if (assetSpecificPropertiesLocal && Object.keys(assetSpecificPropertiesLocal).length > 0) {
            assetSpecificProperties.value = assetSpecificPropertiesLocal.value;
        }
    }

    function generateVCard(manufacturerProperties: any[], manufacturerContactInformations: any[]): string {
        // console.log('generateVCard()', 'manufacturerProperties:', manufacturerProperties);
        let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';

        let manufacturerName = manufacturerProperties.find((sme: any) => checkIdShort(sme, 'ManufacturerName'));
        if (manufacturerName) {
            vCard +=
                'FN:' +
                (valueToDisplay(manufacturerName).length > 0
                    ? valueToDisplay(manufacturerName)
                    : manufacturerName.value[0].text) +
                '\n';
        }

        let companyLogo = manufacturerProperties.find((sme: any) => checkIdShort(sme, 'CompanyLogo'));
        if (companyLogo) {
            vCard += 'PHOTO;MEDIATYPE=' + companyLogo.contentType + ':' + companyLogo.path + '/attachment' + '\n';
        }

        // vCard ADR
        vCard += 'ADR;TYPE=WORK:;;';
        let street = manufacturerContactInformations.find((sme: any) => checkIdShort(sme, 'Street'));
        if (street) {
            // vCard ADR; street
            vCard += valueToDisplay(street).length > 0 ? valueToDisplay(street) : (vCard += street.value[0].text);
        }
        vCard += ';';

        let ciytTown = manufacturerContactInformations.find((sme: any) => checkIdShort(sme, 'CityTown'));
        if (ciytTown) {
            // vCard ADR; city/town
            vCard += valueToDisplay(ciytTown).length > 0 ? valueToDisplay(ciytTown) : (vCard += ciytTown.value[0].text);
        }
        vCard += ';';

        // vCard ADR; federal state (not available in SMT Nameplate v2 specification)
        vCard += ';';

        let zipcode = manufacturerContactInformations.find((sme: any) => checkIdShort(sme, 'Zipcode'));
        if (zipcode) {
            // vCard ADR; zip code
            vCard += valueToDisplay(zipcode).length > 0 ? valueToDisplay(zipcode) : (vCard += zipcode.value[0].text);
        }
        vCard += ';';

        // vCard ADR; country
        let nationalCode = manufacturerContactInformations.find((sme: any) => checkIdShort(sme, 'NationalCode'));
        if (nationalCode) {
            const country = getCountryName(valueToDisplay(nationalCode));
            vCard += country.trim().length > 0 ? country : '';
        }
        vCard += '\n';

        let telephoneNumber = manufacturerProperties.find((sme: any) => checkIdShort(sme, 'TelephoneNumber'));
        if (telephoneNumber) {
            vCard += 'TEL;TYPE=WORK,VOICE:' + telephoneNumber.value[0].text + '\n';
        }

        let faxNumber = manufacturerProperties.find((sme: any) => checkIdShort(sme, 'FaxNumber'));
        if (faxNumber) {
            vCard += 'TEL;TYPE=WORK,FAX:' + faxNumber.value[0].text + '\n';
        }

        let emailAddress = manufacturerProperties.find((sme: any) => checkIdShort(sme, 'EmailAddress'));
        if (emailAddress) {
            vCard += 'EMAIL;TYPE=WORK:' + emailAddress.value + '\n';
        }

        vCard += 'END:VCARD';

        return vCard;
    }

    function downloadVCard(vCard: string, filename: string) {
        let blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8;' });
        const data = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = data;
        link.download = filename;

        // this part will prompt the user to view the VCard in a new tab on iOS
        if (isIOs.value || isMac.value) {
            window.open(data, '_blank');
        } else {
            // For desktop browsers, download the vCard
            link.click();
        }

        setTimeout(function () {
            // For Firefox it is necessary to delay revoking the ObjectURL
            window.URL.revokeObjectURL(data);
        }, 100);
    }

    // Function to set the marker on the map
    function setMarker(address: string) {
        // console.log('setMarker()', 'address:', address);
        if (address.trim().length > 0) {
            // convert the address to coordinates using js fetch api on the openstreetmap api (nominatim)
            const url = 'https://nominatim.openstreetmap.org/search?format=json&q=';
            fetch(url + address)
                .then((response) => response.json())
                .then((data) => {
                    // console.log('setMarker()', url, 'data:', data);
                    if (Array.isArray(data) && data.length > 0) {
                        let lat = parseFloat(data[0].lat);
                        let lon = parseFloat(data[0].lon);
                        center.value = latLng(lat, lon); // Set new center of the map
                        // console.log('setMarker()', 'center:', center);
                    }
                })
                .catch((error) => {
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Error fetching the coordinates for the address!',
                        extendedError: error,
                    });
                });
        }
    }
</script>
