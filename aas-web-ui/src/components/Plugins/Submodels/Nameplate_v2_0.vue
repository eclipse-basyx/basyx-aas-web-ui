<template>
    <v-container fluid class="pa-0">
        <!-- Header -->
        <v-card class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">
                    {{ nameToDisplay(submodelElementData, 'en', 'Digital Nameplate') }}
                </div>
            </v-card-title>
            <v-card-text v-if="descriptionToDisplay(submodelElementData)" class="pt-0">
                {{ descriptionToDisplay(submodelElementData) }}
            </v-card-text>
        </v-card>
        <!-- Product -->
        <v-card v-if="loading" class="mb-4">
            <v-skeleton-loader type="heading, table-heading@7"></v-skeleton-loader>
        </v-card>
        <v-card v-else class="mb-4">
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
                                    <v-tooltip
                                        v-if="productProperty.description && productProperty.description.length > 0"
                                        activator="parent"
                                        open-delay="600"
                                        transition="slide-y-transition"
                                        max-width="360px"
                                        location="bottom">
                                        <div
                                            v-for="(description, i) in productProperty.description"
                                            :key="i"
                                            class="text-caption">
                                            <span class="font-weight-bold">{{ description.language + ': ' }}</span
                                            >{{ description.text }}
                                        </div>
                                    </v-tooltip>
                                </div>
                            </td>
                            <td>
                                <!-- URIOfTheProduct -->
                                <a
                                    v-if="checkIdShort(productProperty.idShort, 'URIOfTheProduct')"
                                    :href="productProperty.value"
                                    target="_blank"
                                    class="text-caption"
                                    >{{ productProperty.value }}</a
                                >
                                <!-- MultiLanguageProperties -->
                                <template v-else-if="productProperty.modelType == 'MultiLanguageProperty'">
                                    <v-list-item class="pl-0">
                                        <v-list-item-title class="text-caption">{{
                                            productProperty.value[0].text
                                        }}</v-list-item-title>
                                    </v-list-item>
                                </template>
                                <!-- Versions -->
                                <template v-else-if="productProperty.modelType == 'Versions'">
                                    <span
                                        v-for="(version, i) in productProperty.value"
                                        :key="i"
                                        style="white-space: nowrap">
                                        <span class="text-caption mr-2">{{ version.idShort + ':' }}</span>
                                        <v-chip label size="x-small" border class="mr-5">{{
                                            version.value[0].text
                                        }}</v-chip>
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
        <!-- Manufacturer -->
        <v-card v-if="loading" class="mb-4">
            <v-skeleton-loader type="heading, table-heading@5, actions"></v-skeleton-loader>
        </v-card>
        <v-card v-else class="mb-4">
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
                                    <v-tooltip
                                        v-if="
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
                                            <span class="font-weight-bold">{{ description.language + ': ' }}</span
                                            >{{ description.text }}
                                        </div>
                                    </v-tooltip>
                                </div>
                            </td>
                            <td>
                                <!-- Company Logo -->
                                <v-img
                                    v-if="checkIdShort(manufacturerProperty, 'CompanyLogo')"
                                    :src="companyLogoUrl"
                                    max-width="100%"
                                    max-height="100%"
                                    contain
                                    class="my-2"></v-img>
                                <!-- MultiLanguageProperties -->
                                <template v-else-if="manufacturerProperty.modelType == 'MultiLanguageProperty'">
                                    <v-list-item
                                        v-for="(element, i) in manufacturerProperty.value"
                                        :key="i"
                                        class="pl-0">
                                        <v-list-item-title class="text-caption">{{
                                            manufacturerProperty.value[0].text
                                        }}</v-list-item-title>
                                    </v-list-item>
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
                    @click="downloadVCard(vCard, 'ManufacturerContact.vcf')"
                    >{{ 'Download Contact' }}</v-btn
                >
            </v-card-actions>
        </v-card>
        <!-- Leaflet Map -->
        <v-card class="mb-4">
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
        <v-card v-if="loading" class="mb-4">
            <v-skeleton-loader type="heading, image"></v-skeleton-loader>
        </v-card>
        <v-card v-else class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">{{ 'Markings' }}</div>
            </v-card-title>
            <v-card-text>
                <v-row class="text-caption mb-2" justify="start">
                    <v-col v-for="(marking, i) in markings" :key="marking.name" cols="auto">
                        <v-img :src="markingImageUrls[i]" height="150px" width="150px" contain></v-img>
                        <span class="text-subtitleText text-caption">{{ marking.name }}</span>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
        <!-- Asset Specific Properties -->
        <v-card v-if="loading">
            <v-skeleton-loader type="heading, table-heading@2"></v-skeleton-loader>
        </v-card>
        <v-card v-else>
            <v-card-title>
                <div class="text-subtitle-1">{{ 'Asset Specific Properties' }}</div>
            </v-card-title>
            <v-card-text>
                <GenericDataVisu :submodel-element-data="assetSpecificProperties"></GenericDataVisu>
            </v-card-text>
        </v-card>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import 'leaflet/dist/leaflet.css';
    import { LMap, LMarker, LTileLayer } from '@vue-leaflet/vue-leaflet';
    import { latLng } from 'leaflet';
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/SMHandling';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'DigitalNameplate',
        semanticId: 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate',
        components: {
            // Leaflet Map
            LMap,
            LTileLayer,
            LMarker,
        },
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();
            const { calculateSMEPathes } = useSMHandling();
            const { checkIdShort, descriptionToDisplay, nameToDisplay } = useReferableUtils();

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
                checkIdShort,
                descriptionToDisplay,
                nameToDisplay,
                calculateSMEPathes,
            };
        },

        data() {
            return {
                digitalNameplateData: {} as any, // Object to store the data of the digital nameplate
                productProperties: [] as Array<any>, // Array to store the product properties
                manufacturerProperties: [] as Array<any>, // Array to store the manufacturer properties
                markings: [] as Array<any>, // Array to store the markings
                markingImageUrls: [] as Array<string>, // Array to store the marking image urls
                assetSpecificProperties: [] as Array<any>, // Array to store the asset specific properties
                companyLogoUrl: '', // URL of the Company Logo
                // Leaflet Map
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
                center: latLng(51.1657, 10.4515), // Center of the Map
                vCard: '', // vCard String
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
            this.initializeDigitalNameplate(); // initialize DigitalNameplate Plugin
        },

        methods: {
            // Function to initialize the Digital Nameplate
            async initializeDigitalNameplate() {
                this.loading = true;

                if (Object.keys(this.submodelElementData).length === 0) {
                    this.digitalNameplateData = {};
                    this.loading = false;
                    return;
                }

                let digitalNameplateData = { ...this.submodelElementData }; // create local copy of the Nameplate Object
                this.digitalNameplateData = await this.calculateSMEPathes(
                    digitalNameplateData,
                    this.SelectedNode.path,
                    true
                );

                // console.log('Digital Nameplate Data:', this.digitalNameplateData);
                this.extractProductProperties(digitalNameplateData); // Extract the Product Properties
                this.extractManufacturerProperties(digitalNameplateData); // Extract the Manufacturer Properties
                this.extractMarkings(digitalNameplateData); // Extract the Markings
                this.extractAssetSpecificProperties(digitalNameplateData); // Extract the Asset Specific Properties
                this.vCard = this.generateVCard(this.manufacturerProperties);
                this.loading = false;
            },

            // Function to extract the Product Properties
            extractProductProperties(digitalNameplateData: any) {
                let productProperties = [];
                // console.log('Extract Product Properties:', digitalNameplateData);
                // find property with the idShort "URIOfTheProduct" and add that element to the productProperties array
                let uriOfTheProduct = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'URIOfTheProduct')
                );
                if (uriOfTheProduct) {
                    productProperties.push(uriOfTheProduct);
                }
                // find property with the idShort "ManufacturerProductDesignation" and add that element to the productProperties array
                let manufacturerProductDesignation = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'ManufacturerProductDesignation')
                );
                if (manufacturerProductDesignation) {
                    productProperties.push(manufacturerProductDesignation);
                }
                // find property with the idShort "ManufacturerProductRoot" and add that element to the productProperties array
                let manufacturerProductRoot = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'ManufacturerProductRoot')
                );
                if (manufacturerProductRoot) {
                    productProperties.push(manufacturerProductRoot);
                }
                // find property with the idShort "ManufacturerProductFamily" and add that element to the productProperties array
                let manufacturerProductFamily = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'ManufacturerProductFamily')
                );
                if (manufacturerProductFamily) {
                    productProperties.push(manufacturerProductFamily);
                }
                // find property with the idShort "ManufacturerProductType" and add that element to the productProperties array
                let manufacturerProductType = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'ManufacturerProductType')
                );
                if (manufacturerProductType) {
                    productProperties.push(manufacturerProductType);
                }
                // find property with the idShort "ProductArticleNumberOfManufacturer" and add that element to the productProperties array
                let productArticleNumberOfManufacturer = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'ProductArticleNumberOfManufacturer')
                );
                if (productArticleNumberOfManufacturer) {
                    productProperties.push(productArticleNumberOfManufacturer);
                }
                // find property with the idShort "SerialNumber" and add that element to the productProperties array
                let serialNumber = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'SerialNumber')
                );
                if (serialNumber) {
                    productProperties.push(serialNumber);
                }
                // find property with the idShort "YearOfConstruction" and add that element to the productProperties array
                let yearOfConstruction = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'YearOfConstruction')
                );
                if (yearOfConstruction) {
                    productProperties.push(yearOfConstruction);
                }
                // find property with the idShort "DateOfManufacture" and add that element to the productProperties array
                let dateOfManufacture = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'DateOfManufacture')
                );
                if (dateOfManufacture) {
                    productProperties.push(dateOfManufacture);
                }
                let versions = [];
                // find property with the idShort "HardwareVersion" and add that element to the productProperties array
                let hardwareVersion = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'HardwareVersion')
                );
                if (hardwareVersion) {
                    versions.push(hardwareVersion);
                }
                // find property with the idShort "FirmwareVersion" and add that element to the productProperties array
                let firmwareVersion = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'FirmwareVersion')
                );
                if (firmwareVersion) {
                    versions.push(firmwareVersion);
                }
                // find property with the idShort "SoftwareVersion" and add that element to the productProperties array
                let softwareVersion = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'SoftwareVersion')
                );
                if (softwareVersion) {
                    versions.push(softwareVersion);
                }
                if (versions.length > 0) {
                    productProperties.push({ idShort: 'Versions', value: versions, modelType: 'Versions' });
                }
                this.productProperties = productProperties; // Set the Product Properties
                // console.log('Product Properties:', this.productProperties);
            },

            // Function to extract the Manufacturer Properties
            extractManufacturerProperties(digitalNameplateData: any) {
                let manufacturerProperties = [];
                // console.log('Extract Manufacturer Properties:', digitalNameplateData);
                // find property with the idShort "CompanyLogo" and add that element to the manufacturerProperties array
                let companyLogo = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'CompanyLogo')
                );
                if (companyLogo) {
                    this.getImageUrl(companyLogo, 'companyLogoUrl');
                    manufacturerProperties.push(companyLogo);
                }
                // find property with the idShort "ManufacturerName" and add that element to the manufacturerProperties array
                let manufacturerName = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'ManufacturerName')
                );
                if (manufacturerName) {
                    manufacturerProperties.push(manufacturerName);
                }
                // get the Contact Information
                let contactInformation = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'ContactInformation')
                );
                if (contactInformation) {
                    // console.log('Contact Information:', contactInformation)
                    // find property with the idShort "Street" and add that element to the manufacturerProperties array
                    let street = contactInformation.value.find((element: any) => this.checkIdShort(element, 'Street'));
                    if (street) {
                        manufacturerProperties.push(street);
                    }
                    let address = '';
                    // find property with the idShort "NationalCode" and add that element to the manufacturerProperties array
                    let nationalCode = contactInformation.value.find((element: any) =>
                        this.checkIdShort(element, 'NationalCode')
                    );
                    if (nationalCode) {
                        address += nationalCode.value[0].text + ' ';
                    }
                    // find property with the idShort "Zipcode" and add that element to the manufacturerProperties array
                    let zipcode = contactInformation.value.find((element: any) =>
                        this.checkIdShort(element, 'Zipcode')
                    );
                    if (zipcode) {
                        address += zipcode.value[0].text + ' ';
                    }
                    // find property with the idShort "City" and add that element to the manufacturerProperties array
                    let cityTown = contactInformation.value.find((element: any) =>
                        this.checkIdShort(element, 'CityTown')
                    );
                    if (cityTown) {
                        address += cityTown.value[0].text;
                    }
                    this.setMarker(address); // Set the Marker on the Map
                    if (address.length > 0) {
                        manufacturerProperties.push({ idShort: 'Address', value: address, modelType: 'String' });
                    }
                    // get the Phone Information
                    let phone = contactInformation.value.find((element: any) => this.checkIdShort(element, 'Phone'));
                    if (phone) {
                        // find property with the idShort "TelephoneNumber" and add that element to the manufacturerProperties array
                        let telephoneNumber = phone.value.find((element: any) =>
                            this.checkIdShort(element, 'TelephoneNumber')
                        );
                        if (telephoneNumber) {
                            manufacturerProperties.push(telephoneNumber);
                        }
                    }
                    // get the Fax Information
                    let fax = contactInformation.value.find((element: any) => this.checkIdShort(element, 'Fax'));
                    if (fax) {
                        // find property with the idShort "FaxNumber" and add that element to the manufacturerProperties array
                        let faxNumber = fax.value.find((element: any) => this.checkIdShort(element, 'FaxNumber'));
                        if (faxNumber) {
                            manufacturerProperties.push(faxNumber);
                        }
                    }
                    // get the Email Information
                    let email = contactInformation.value.find((element: any) => this.checkIdShort(element, 'Email'));
                    if (email) {
                        // find property with the idShort "EmailAddress" and add that element to the manufacturerProperties array
                        let emailAddress = email.value.find((element: any) =>
                            this.checkIdShort(element, 'EmailAddress')
                        );
                        if (emailAddress) {
                            manufacturerProperties.push(emailAddress);
                        }
                    }
                }
                // find property with the idShort "OrderCodeOfManufacturer" and add that element to the manufacturerProperties array
                let orderCodeOfManufacturer = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'OrderCodeOfManufacturer')
                );
                if (orderCodeOfManufacturer) {
                    manufacturerProperties.push(orderCodeOfManufacturer);
                }
                this.manufacturerProperties = manufacturerProperties; // Set the Manufacturer Properties
                // console.log('Manufacturer Properties:', this.manufacturerProperties);
            },

            // Function to extract the Markings
            extractMarkings(digitalNameplateData: any) {
                let markings = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'Markings')
                );
                let formattedMarkings = [] as Array<any>;
                if (markings?.value) {
                    markings.value.forEach((marking: any) => {
                        // find property with the idShort "MarkingFile"
                        let markingFile = marking.value.find((element: any) =>
                            this.checkIdShort(element, 'MarkingFile')
                        );
                        // find property with the idShort "MarkingName"
                        let markingName = marking.value.find((element: any) =>
                            this.checkIdShort(element, 'MarkingName')
                        );
                        // create the formatted Marking Object
                        let formattedMarking = {
                            idShort: marking.idShort,
                            value: markingFile.value,
                            name: markingName.value,
                            path: markingFile.path,
                        };
                        this.getImageUrl(formattedMarking, 'markingImageUrls', true);
                        formattedMarkings.push(formattedMarking);
                    });
                    // console.log('Formatted Markings:', formattedMarkings);
                    this.markings = formattedMarkings; // Set the Markings
                }
            },

            // Function to extract the Asset Specific Properties
            extractAssetSpecificProperties(digitalNameplateData: any) {
                let assetSpecificProperties = digitalNameplateData.submodelElements.find((element: any) =>
                    this.checkIdShort(element, 'AssetSpecificProperties')
                );
                if (assetSpecificProperties) {
                    // console.log('Asset Specific Properties:', assetSpecificProperties);
                    this.assetSpecificProperties = assetSpecificProperties.value;
                }
            },

            generateVCard(manufacturerProperties: any[]): string {
                let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';

                let manufacturerName = manufacturerProperties.find((element: any) =>
                    this.checkIdShort(element, 'ManufacturerName')
                );
                if (manufacturerName) {
                    vCard += 'FN:' + manufacturerName.value[0].text + '\n';
                }

                let companyLogo = manufacturerProperties.find((element: any) =>
                    this.checkIdShort(element, 'CompanyLogo')
                );
                if (companyLogo) {
                    vCard += 'PHOTO;MEDIATYPE=image/jpeg:' + companyLogo.value[0].text + '\n';
                }

                let address = manufacturerProperties.find((element: any) => this.checkIdShort(element, 'Address'));
                if (address) {
                    vCard += 'ADR;TYPE=WORK:;;' + address.value + ';;;\n';
                }

                let telephoneNumber = manufacturerProperties.find((element: any) =>
                    this.checkIdShort(element, 'TelephoneNumber')
                );
                if (telephoneNumber) {
                    vCard += 'TEL;TYPE=WORK,VOICE:' + telephoneNumber.value[0].text + '\n';
                }

                let faxNumber = manufacturerProperties.find((element: any) => this.checkIdShort(element, 'FaxNumber'));
                if (faxNumber) {
                    vCard += 'TEL;TYPE=WORK,FAX:' + faxNumber.value[0].text + '\n';
                }

                let emailAddress = manufacturerProperties.find((element: any) =>
                    this.checkIdShort(element, 'EmailAddress')
                );
                if (emailAddress) {
                    vCard += 'EMAIL;TYPE=WORK:' + emailAddress.value + '\n';
                }

                vCard += 'END:VCARD';

                return vCard;
            },

            downloadVCard(vCard: string, filename: string) {
                let blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8;' });
                const data = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = data;
                link.download = filename;

                // this part will prompt the user to view the VCard in a new tab on iOS
                if (this.$vuetify.display.platform.ios || this.$vuetify.display.platform.mac) {
                    window.open(data, '_blank');
                } else {
                    // For desktop browsers, download the vCard
                    link.click();
                }

                setTimeout(function () {
                    // For Firefox it is necessary to delay revoking the ObjectURL
                    window.URL.revokeObjectURL(data);
                }, 100);
            },

            // Function to set the Marker on the Map
            setMarker(address: string) {
                // console.log('Address:', address);
                if (address.length > 0) {
                    // convert the address to coordinates using js fetch api on the openstreetmap api (nominatim)
                    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + address)
                        .then((response) => response.json())
                        .then((data) => {
                            // console.log('Coordinates:', data);
                            if (data.length > 0) {
                                let lat = parseFloat(data[0].lat);
                                let lon = parseFloat(data[0].lon);
                                this.center = latLng(lat, lon); // Set the Center of the Map
                                // console.log('Center:', this.center);
                            }
                        })
                        .catch((error) => {
                            this.navigationStore.dispatchSnackbar({
                                status: true,
                                timeout: 4000,
                                color: 'error',
                                btnColor: 'buttonText',
                                text: 'Error fetching the coordinates for the address!',
                                extendedError: error,
                            });
                        });
                }
            },

            getImageUrl(fileProperty: any, dataElementName: string, isMarking: boolean = false) {
                if (!fileProperty.value) return;
                try {
                    new URL(fileProperty.value);
                    if (isMarking) {
                        (this as any)[dataElementName].push(fileProperty.value);
                    } else {
                        (this as any)[dataElementName] = fileProperty.value;
                    }
                } catch {
                    let path = this.getLocalPath(fileProperty.value, fileProperty);
                    let context = 'retrieving Attachment File';
                    let disableMessage = false;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            if (isMarking) {
                                (this as any)[dataElementName].push(URL.createObjectURL(response.data as Blob));
                            } else {
                                (this as any)[dataElementName] = URL.createObjectURL(response.data as Blob);
                            }
                        }
                    });
                }
            },
        },
    });
</script>
