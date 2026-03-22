<template>
  <v-container class="pa-0" fluid>
    <VisualizationHeader
      default-title="Digital Nameplate for industrial equipment"
      :submodel-element-data="submodelElementData"
    />
    <!-- Loading -->
    <v-card v-if="isLoading" class="mb-4">
      <!-- Product properties -->
      <v-skeleton-loader type="heading, table-heading@7" />
      <!-- Manufacturer properties -->
      <v-skeleton-loader type="heading, table-heading@5, actions" />
      <!-- Markings -->
      <v-skeleton-loader type="heading, image" />
      <!-- Asset Specific Properties -->
      <v-skeleton-loader type="heading, table-heading@2" />
    </v-card>
    <template v-else-if="Object.keys(digitalNameplateData).length > 0">
      <!-- Product properties-->
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
                  :key="productProperty.idShort"
                >
                  <tr
                    v-if="hasValue(productProperty)"
                    :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'"
                  >
                    <td>
                      <div class="text-subtitleText text-caption">
                        <span>{{ nameToDisplay(productProperty) }}</span>
                        <DescriptionTooltip :description-array="productProperty?.description" />
                      </div>
                    </td>
                    <td>
                      <!-- URIOfTheProduct -->
                      <template v-if="checkIdShort(productProperty, 'URIOfTheProduct')">
                        <a
                          v-if="valueToDisplay(productProperty).startsWith('http')"
                          class="text-caption text-primary"
                          :href="valueToDisplay(productProperty)"
                          target="_blank"
                        >
                          {{ valueToDisplay(productProperty) }}
                        </a>
                        <span v-else class="text-caption">
                          {{ valueToDisplay(productProperty) }}
                        </span>
                      </template>
                      <!-- CountryOfOrigin -->
                      <template v-else-if="checkIdShort(productProperty, 'CountryOfOrigin')">
                        <div
                          v-if="getCountryName(valueToDisplay(productProperty))"
                          class="text-caption"
                        >
                          {{ getCountryName(valueToDisplay(productProperty)) }} ({{
                            valueToDisplay(productProperty)
                          }})
                        </div>
                        <div v-else class="text-caption">
                          {{ valueToDisplay(productProperty) }}
                        </div>
                      </template>
                      <!-- Versions -->
                      <template v-else-if="checkIdShort(productProperty, 'Versions')">
                        <span
                          v-for="(version, i) in productProperty.value"
                          :key="i"
                          style="white-space: nowrap"
                        >
                          <span class="text-caption mr-2">
                            {{ nameToDisplay(version) + ':' }}
                          </span>
                          <!-- Show english value, if available -->
                          <v-chip
                            v-if="valueToDisplay(version)"
                            border
                            class="mr-5"
                            label
                            size="x-small"
                          >
                            {{ valueToDisplay(version) }}
                          </v-chip>
                          <!-- Otherwise show the first value -->
                          <v-chip
                            v-else
                            border
                            class="mr-5"
                            label
                            size="x-small"
                          >
                            {{ version.value[0].text }}
                          </v-chip>
                        </span>
                      </template>
                      <!-- MultiLanguageProperties -->
                      <template v-else-if="productProperty.modelType == 'MultiLanguageProperty'">
                        <!-- Show english value, if available -->
                        <div v-if="valueToDisplay(productProperty)" class="text-caption">
                          {{ valueToDisplay(productProperty) }}
                        </div>
                        <!-- Otherwise show all available values -->
                        <template
                          v-for="(langStringSet, j) in productProperty.value"
                          v-else
                          :key="j"
                        >
                          <div v-if="langStringSet?.text.length > 0" class="text-caption">
                            <v-chip class="mr-1" label size="x-small">{{
                              langStringSet.language
                            }}</v-chip>
                            {{ langStringSet?.text }}
                          </div>
                        </template>
                      </template>
                      <!-- Default -->
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
      <!-- Manufacturer properties -->
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
                  :key="manufacturerProperty.idShort"
                >
                  <tr
                    v-if="hasValue(manufacturerProperty)"
                    :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'"
                  >
                    <td>
                      <div class="text-subtitleText text-caption">
                        <span>{{ nameToDisplay(manufacturerProperty) }}</span>
                        <DescriptionTooltip
                          :description-array="manufacturerProperty?.description"
                        />
                      </div>
                    </td>
                    <td>
                      <!-- Address of Additional Link -->
                      <template
                        v-if="checkIdShort(manufacturerProperty, 'AddressOfAdditionalLink')"
                      >
                        <a
                          v-if="valueToDisplay(manufacturerProperty).startsWith('http')"
                          class="text-caption text-primary"
                          :href="valueToDisplay(manufacturerProperty)"
                          target="_blank"
                        >
                          {{ valueToDisplay(manufacturerProperty) }}
                        </a>
                        <span v-else class="text-caption">
                          {{ valueToDisplay(manufacturerProperty) }}
                        </span>
                      </template>
                      <!-- Company Logo -->
                      <v-img
                        v-else-if="checkIdShort(manufacturerProperty, 'CompanyLogo')"
                        class="my-2"
                        contain
                        max-height="300px"
                        max-width="300px"
                        :src="valueToDisplay(manufacturerProperty)"
                      />
                      <!-- Telephone number / Fax number / Email -->
                      <span
                        v-else-if="
                          checkIdShort(manufacturerProperty, 'TelephoneNumber') ||
                            checkIdShort(manufacturerProperty, 'FaxNumber') ||
                            checkIdShort(manufacturerProperty, 'Email')
                        "
                        class="text-caption"
                      >
                        <v-chip
                          v-if="
                            manufacturerProperty?.typeOfValue &&
                              manufacturerProperty?.typeOfValue.trim() !== ''
                          "
                          class="mr-2"
                          :prepend-icon="
                            manufacturerProperty.typeOfValue.includes('Office') ||
                              ['Secretary', 'Substitute'].includes(
                                manufacturerProperty.typeOfValue
                              )
                              ? 'mdi-office-building'
                              : 'mdi-home'
                          "
                          size="x-small"
                        >
                          {{ manufacturerProperty.typeOfValue }}
                        </v-chip>
                        <template
                          v-if="
                            checkIdShort(manufacturerProperty, 'TelephoneNumber') &&
                              isMobile
                          "
                        >
                          <a
                            class="text-caption text-primary"
                            :href="`tel:${valueToDisplay(manufacturerProperty).replaceAll(' ', '')}`"
                          >
                            {{ valueToDisplay(manufacturerProperty) }}
                          </a>
                        </template>
                        <template v-else-if="checkIdShort(manufacturerProperty, 'Email')">
                          <a
                            class="text-caption text-primary"
                            :href="`mailto:${valueToDisplay(manufacturerProperty)}`"
                          >
                            {{ valueToDisplay(manufacturerProperty) }}
                          </a>
                        </template>
                        <template v-else>
                          {{ valueToDisplay(manufacturerProperty) }}
                        </template>
                      </span>
                      <!-- MultiLanguageProperties -->
                      <template
                        v-else-if="manufacturerProperty.modelType == 'MultiLanguageProperty'"
                      >
                        <!-- Show english value, if available -->
                        <div v-if="valueToDisplay(manufacturerProperty)" class="text-caption">
                          {{ valueToDisplay(manufacturerProperty) }}
                        </div>
                        <!-- Otherwise show all available values -->
                        <template
                          v-for="(langStringSet, j) in manufacturerProperty.value"
                          v-else
                          :key="j"
                        >
                          <div v-if="langStringSet?.text.length > 0" class="text-caption">
                            <v-chip class="mr-1" label size="x-small">{{
                              langStringSet.language
                            }}</v-chip>
                            {{ langStringSet?.text }}
                          </div>
                        </template>
                      </template>
                      <!-- Default -->
                      <span v-else class="text-caption">
                        {{ valueToDisplay(manufacturerProperty) }}
                      </span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </v-table>
          </v-sheet>
        </v-card-text>
        <v-card-actions v-if="vCardString && vCardString.trim() !== ''" class="py-4 pr-4">
          <v-spacer />
          <v-btn
            class="text-buttonText"
            color="primary"
            prepend-icon="mdi-card-account-details"
            size="small"
            variant="elevated"
            @click="downloadVCard(vCardString, 'ManufacturerContact.vcf')"
          >
            {{ 'Download Contact' }}
          </v-btn>
        </v-card-actions>
      </v-card>
      <!-- Leaflet Map -->
      <v-card v-if="vCardString.length > 0" class="mb-4">
        <l-map
          :center="[center.lat, center.lng]"
          :options="{ scrollWheelZoom: false }"
          style="height: 400px; width: 100%"
          :zoom="5"
        >
          <l-tile-layer :attribution="attribution" :url="url" />
          <l-marker :lat-lng="center" />
        </l-map>
      </v-card>
      <!-- Markings -->
      <v-card v-if="markingsSMC && Object.keys(markingsSMC).length > 0 && markings.length > 0" class="mb-4">
        <v-card-title>
          <div class="text-subtitle-1">
            {{ nameToDisplay(markingsSMC, 'en', 'Markings') }}
            <DescriptionTooltip :description-array="markingsSMC?.description" />
          </div>
        </v-card-title>
        <v-card-text>
          <v-row class="text-caption mb-2" justify="start">
            <v-col v-for="marking in markings" :key="marking.idShort" class="pb-0" cols="auto">
              <v-img contain height="150px" :src="marking.src" width="150px" />
              <span class="text-subtitleText text-caption">{{ marking.name }}</span>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <!-- Asset Specific Properties -->
      <v-card
        v-if="
          assetSpecificPropertiesSMC &&
            Object.keys(assetSpecificPropertiesSMC).length > 0 &&
            assetSpecificPropertiesSMC?.value &&
            Array.isArray(assetSpecificPropertiesSMC?.value) &&
            assetSpecificPropertiesSMC.value.length > 0
        "
      >
        <v-card-title>
          <div class="text-subtitle-1">
            {{ nameToDisplay(assetSpecificPropertiesSMC, 'en', 'Asset Specific Properties') }}
            <DescriptionTooltip :description-array="assetSpecificPropertiesSMC?.description" />
          </div>
        </v-card-title>
        <v-card-text>
          <GenericDataVisu :submodel-element-data="assetSpecificPropertiesSMC.value" />
        </v-card-text>
      </v-card>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import { LMap, LMarker, LTileLayer } from '@vue-leaflet/vue-leaflet'
  import { latLng } from 'leaflet'
  import { computed, onMounted, ref } from 'vue'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'
  import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement'
  import { useContactInformation_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/ContactInformation_v1_0Utils'
  import { useVirtualContactFileUtils } from '@/composables/VirtualContactFileUtils'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { firstLangStringSetText } from '@/utils/AAS/SubmodelElements/MultiLanguagePropertyUtils'
  import { getCountryName } from '@/utils/LocaleUtils'
  import 'leaflet/dist/leaflet.css'

  // Options
  defineOptions({
    name: 'DigitalNameplate',
    semanticId: 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate',
  })

  // Stores
  const navigationStore = useNavigationStore()

  // Composables
  const { setData } = useSMHandling()
  const { checkIdShort, getSubmodelElementByIdShort, nameToDisplay } = useReferableUtils()
  const { hasValue, valueToDisplay } = useSME()
  const { determineAddress, generateVCard, getTypeOfEmailAddress, getTypeOfFaxNumber, getTypeOfTelephone }
    = useContactInformation_v1_0Utils()
  const { downloadVCard } = useVirtualContactFileUtils()
  const { valueBlob } = useSMEFile()

  // Properties
  const props = defineProps({
    submodelElementData: {
      type: Object as any,
      default: {} as any,
    },
  })

  // Data
  const isLoading = ref(false)
  const digitalNameplateData = ref({} as any)
  const productProperties = ref([] as Array<any>)
  const manufacturerProperties = ref([] as Array<any>)
  const markingsSMC = ref({} as any)
  const markings = ref([] as Array<any>)
  const assetSpecificPropertiesSMC = ref({} as any)
  const vCardString = ref('')
  // Leaflet Map
  const url = ref('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
  const attribution = ref('Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors')
  const center = ref(latLng(51.1657, 10.4515)) // Initial center of the Map (center of Germany)

  // Computed Properties
  const isMobile = computed(() => navigationStore.getIsMobile)

  onMounted(() => {
    initializeVisualization()
  })

  async function initializeVisualization (): Promise<void> {
    isLoading.value = true

    if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
      digitalNameplateData.value = {}
      isLoading.value = false
      return
    }

    digitalNameplateData.value = await setData({ ...props.submodelElementData }, props.submodelElementData.path)

    extractProductProperties(digitalNameplateData.value)
    await extractManufacturerProperties(digitalNameplateData.value)
    extractMarkings(digitalNameplateData.value)
    extractAssetSpecificProperties(digitalNameplateData.value)

    isLoading.value = false
  }

  function extractProductProperties (digitalNameplateData: any): void {
    const productPropertyIdShorts = [
      'URIOfTheProduct',
      'ManufacturerProductDesignation',
      'ManufacturerProductRoot',
      'ManufacturerProductFamily',
      'ManufacturerProductType',
      'OrderCodeOfManufacturer',
      'ProductArticleNumberOfManufacturer',
      'SerialNumber',
      'YearOfConstruction',
      'DateOfManufacture',
      'HardwareVersion',
      'FirmwareVersion',
      'SoftwareVersion',
      'CountryOfOrigin',
    ]

    const versions = [] as Array<any>

    for (const sme of digitalNameplateData.submodelElements) {
      for (const idShort of productPropertyIdShorts) {
        if (checkIdShort(sme, idShort)) {
          if (['HardwareVersion', 'FirmwareVersion', 'SoftwareVersion'].includes(idShort)) {
            if (hasValue(sme)) versions.push(sme)
          } else {
            if (hasValue(sme)) productProperties.value.push(sme)
          }
        }
      }
    }

    if (versions.length > 0) {
      productProperties.value.push({ idShort: 'Versions', value: versions, modelType: 'Versions' })
    }
  }

  async function extractManufacturerProperties (digitalNameplateData: any): Promise<void> {
    const manufacturerPropertyIdShorts = ['ManufacturerName', 'CompanyLogo']

    for (const sme of digitalNameplateData.submodelElements) {
      for (const idShort of manufacturerPropertyIdShorts) {
        if (checkIdShort(sme, idShort) && hasValue(sme)) {
          if (idShort === 'CompanyLogo') {
            sme.value = await valueBlob(sme)
          }
          manufacturerProperties.value.push(sme)
        }
      }
    }

    const manufacturerContactInformationSMC = getSubmodelElementByIdShort('ContactInformation', digitalNameplateData)
    if (hasValue(manufacturerContactInformationSMC)) {
      // (postal) address
      const address = determineAddress(manufacturerContactInformationSMC)
      if (address.trim() !== '') {
        setMarker(address)
        manufacturerProperties.value.push({
          idShort: 'Address',
          displayName: [{ language: 'en', text: 'Address' }],
          modelType: 'Property',
          valueType: 'String',
          value: address,
        })
      }

      // Telephone number
      const phoneSMC = getSubmodelElementByIdShort('Phone', manufacturerContactInformationSMC)
      if (hasValue(phoneSMC)) {
        const telephoneNumberMLP = getSubmodelElementByIdShort('TelephoneNumber', phoneSMC)
        const typeOfTelephoneProperty = getSubmodelElementByIdShort('TypeOfTelephone', phoneSMC)
        if (hasValue(telephoneNumberMLP)) {
          manufacturerProperties.value.push({
            idShort: 'TelephoneNumber',
            displayName: [{ language: 'en', text: 'Telephone number' }],
            modelType: 'Property',
            valueType: 'String',
            value: valueToDisplay(telephoneNumberMLP, 'en', firstLangStringSetText(telephoneNumberMLP)),
            typeOfValue: getTypeOfTelephone(valueToDisplay(typeOfTelephoneProperty)),
          })
        }
      }

      // Fax number
      const faxSMC = getSubmodelElementByIdShort('Fax', manufacturerContactInformationSMC)
      if (hasValue(faxSMC)) {
        const faxNumberMLP = getSubmodelElementByIdShort('FaxNumber', faxSMC)
        const typeOfFaxNumberProperty = getSubmodelElementByIdShort('TypeOfFaxNumber', faxSMC)
        if (hasValue(faxNumberMLP)) {
          manufacturerProperties.value.push({
            idShort: 'FaxNumber',
            displayName: [{ language: 'en', text: 'Fax number' }],
            modelType: 'Property',
            valueType: 'String',
            value: valueToDisplay(faxNumberMLP, 'en', firstLangStringSetText(faxNumberMLP)),
            typeOfValue: getTypeOfFaxNumber(valueToDisplay(typeOfFaxNumberProperty)),
          })
        }
      }

      // Email
      const emailSMC = getSubmodelElementByIdShort('Email', manufacturerContactInformationSMC)
      if (hasValue(emailSMC)) {
        const emailAddressMLP = getSubmodelElementByIdShort('EmailAddress', emailSMC)
        const typeOfEmailAddressProperty = getSubmodelElementByIdShort('TypeOfEmailAddress', emailSMC)
        if (hasValue(emailAddressMLP)) {
          manufacturerProperties.value.push({
            idShort: 'Email',
            displayName: [{ language: 'en', text: 'Email Address' }],
            modelType: 'Property',
            valueType: 'String',
            value: valueToDisplay(emailAddressMLP, 'en', firstLangStringSetText(emailAddressMLP)),
            typeOfValue: getTypeOfEmailAddress(valueToDisplay(typeOfEmailAddressProperty)),
          })
        }
      }

      // vCardString.value = generateVCard(manufacturerProperties.value, manufacturerContactInformationSmc.value);
      vCardString.value = generateVCard(
        manufacturerContactInformationSMC,
        getSubmodelElementByIdShort('ManufacturerName', digitalNameplateData),
        getSubmodelElementByIdShort('CompanyLogo', digitalNameplateData),
      )
    }
  }

  async function extractMarkings (digitalNameplateData: any): Promise<void> {
    markingsSMC.value = getSubmodelElementByIdShort('Markings', digitalNameplateData)

    if (hasValue(markingsSMC.value)) {
      const markingSMCs = markingsSMC.value.value

      if (Array.isArray(markingSMCs) && markingSMCs.length > 0) {
        const formattedMarkings = await Promise.all(
          markingSMCs.map(async (markingSMC: any) => {
            const markingFile = getSubmodelElementByIdShort('MarkingFile', markingSMC)
            const markingName = getSubmodelElementByIdShort('MarkingName', markingSMC)

            if (hasValue(markingName) && hasValue(markingFile)) {
              return {
                idShort: markingSMC.idShort,
                name: markingName.value,
                src: await valueBlob(markingFile),
              }
            }
            return null
          }),
        )

        // Filter out any markings that returned null.
        markings.value = formattedMarkings.filter(m => m !== null)
      }
    }
  }

  function extractAssetSpecificProperties (digitalNameplateData: any): void {
    assetSpecificPropertiesSMC.value = getSubmodelElementByIdShort('AssetSpecificProperties', digitalNameplateData)
  }

  // Function to set the marker on the map
  function setMarker (address: string): void {
    if (address.trim().length > 0) {
      // convert the address to coordinates using js fetch api on the openstreetmap api (nominatim)
      const url = 'https://nominatim.openstreetmap.org/search?format=json&q='
      fetch(url + address)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const lat = Number.parseFloat(data[0].lat)
            const lon = Number.parseFloat(data[0].lon)
            center.value = latLng(lat, lon) // Set new center of the map
          }
        })
        .catch(error => {
          navigationStore.dispatchSnackbar({
            status: true,
            timeout: 4000,
            color: 'error',
            btnColor: 'buttonText',
            text: 'Error fetching the coordinates for the address!',
            extendedError: error,
          })
        })
    }
  }
</script>
