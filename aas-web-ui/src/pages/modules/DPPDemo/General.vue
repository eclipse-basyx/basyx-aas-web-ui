<template>
    <v-card rounded="lg" border>
        <v-card-title class="d-flex flex-column flex-sm-row align-start align-sm-center ga-2 px-4 py-3">
            <span class="text-h6">General Product Passport Information</span>
            <v-chip size="small" variant="tonal" color="primary">Digital Nameplate v3.0</v-chip>
        </v-card-title>
        <v-card-text class="pt-0 px-0 px-sm-4 pb-4">
            <v-sheet v-if="isLoading" class="px-4 pt-2" color="transparent">
                <v-skeleton-loader type="table-heading@3, table-row-divider@8" />
            </v-sheet>

            <v-alert
                v-else-if="!hasSelectedAas"
                class="mx-4"
                type="info"
                variant="tonal"
                icon="mdi-information-outline"
                text="Select an Asset Administration Shell to load Digital Nameplate data." />

            <v-alert
                v-else-if="!hasNameplateSubmodel"
                class="mx-4"
                type="warning"
                variant="tonal"
                icon="mdi-alert-outline"
                text="No Digital Nameplate v3.0 submodel was found for the selected AAS." />

            <div v-else class="overflow-x-auto">
                <v-table density="comfortable" class="text-no-wrap border rounded-lg">
                    <thead>
                        <tr>
                            <th class="text-left text-caption text-sm-body-2">Property</th>
                            <th class="text-left text-caption text-sm-body-2">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(row, index) in generalRows"
                            :key="`${row.idShort}-${index}`"
                            :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                            <td class="text-caption text-sm-body-2">{{ row.label }}</td>
                            <td class="text-caption text-sm-body-2">
                                <v-img
                                    v-if="row.type === 'logo' && logoSrc"
                                    :src="logoSrc"
                                    width="140"
                                    max-height="80"
                                    contain
                                    class="my-1" />
                                <span v-else>{{ getDisplayValue(row.value) }}</span>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { useContactInformation_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/ContactInformation_v1_0Utils';
    import { useDppSubmodelResolver } from '@/pages/modules/DPPDemo/submodelResolver';
    import { useAASStore } from '@/store/AASDataStore';
    import { firstLangStringSetText } from '@/utils/AAS/SubmodelElements/MultiLanguagePropertyUtils';
    import { getCountryName } from '@/utils/LocaleUtils';

    type GeneralRow = {
        idShort: string;
        label: string;
        value: string;
        type?: 'logo' | 'text';
    };

    type SubmodelWithPath = Record<string, unknown> & { path: string };
    type NameplateSubmodel = Record<string, unknown> & {
        submodelElements?: Array<Record<string, unknown>>;
    };

    const semanticIdDigitalNameplate = 'https://admin-shell.io/idta/nameplate/3/0/Nameplate';

    const aasStore = useAASStore();
    const { resolveSubmodelBySemanticId } = useDppSubmodelResolver();
    const { getSubmodelElementByIdShort, checkIdShort, nameToDisplay } = useReferableUtils();
    const { setData } = useSMHandling();
    const { hasValue, valueToDisplay } = useSME();
    const { valueBlob } = useSMEFile();
    const { determineAddress, getTypeOfEmailAddress, getTypeOfFaxNumber, getTypeOfTelephone } =
        useContactInformation_v1_0Utils();

    const selectedAas = computed(() => aasStore.getSelectedAAS);
    const isLoading = ref(false);
    const nameplateSubmodel = ref({} as NameplateSubmodel);
    const generalRows = ref([] as Array<GeneralRow>);
    const logoSrc = ref('');

    const hasSelectedAas = computed(() => !!selectedAas.value && Object.keys(selectedAas.value).length > 0);
    const hasNameplateSubmodel = computed(
        () => !!nameplateSubmodel.value && Object.keys(nameplateSubmodel.value).length > 0
    );

    onMounted(() => {
        initializeGeneralData();
    });

    watch(
        () => selectedAas.value?.id,
        () => {
            initializeGeneralData();
        }
    );

    async function initializeGeneralData(): Promise<void> {
        isLoading.value = true;
        generalRows.value = [];
        logoSrc.value = '';
        nameplateSubmodel.value = {};

        if (!selectedAas.value || Object.keys(selectedAas.value).length === 0) {
            isLoading.value = false;
            return;
        }

        const resolvedNameplate = (await resolveSubmodelBySemanticId(
            selectedAas.value,
            semanticIdDigitalNameplate
        )) as SubmodelWithPath;

        if (!resolvedNameplate || Object.keys(resolvedNameplate).length === 0) {
            isLoading.value = false;
            return;
        }

        if (!resolvedNameplate.path || resolvedNameplate.path.trim() === '') {
            isLoading.value = false;
            return;
        }

        nameplateSubmodel.value = await setData({ ...resolvedNameplate }, resolvedNameplate.path);

        extractRows();
        await extractLogo();

        isLoading.value = false;
    }

    function extractRows(): void {
        if (!nameplateSubmodel.value?.submodelElements || !Array.isArray(nameplateSubmodel.value.submodelElements)) {
            return;
        }

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
        ];

        const manufacturerPropertyIdShorts = ['ManufacturerName', 'UniqueFacilityIdentifier', 'CompanyLogo'];

        for (const sme of nameplateSubmodel.value.submodelElements) {
            for (const idShort of productPropertyIdShorts) {
                if (checkIdShort(sme, idShort) && hasValue(sme)) {
                    let value = valueToDisplay(sme, '');

                    if (checkIdShort(sme, 'CountryOfOrigin')) {
                        value = getCountryName(value, value) || value;
                    }

                    generalRows.value.push({
                        idShort: idShort,
                        label: nameToDisplay(sme, 'en', idShort),
                        value,
                        type: 'text',
                    });
                }
            }

            for (const idShort of manufacturerPropertyIdShorts) {
                if (checkIdShort(sme, idShort) && hasValue(sme)) {
                    generalRows.value.push({
                        idShort: idShort,
                        label: nameToDisplay(sme, 'en', idShort),
                        value: idShort === 'CompanyLogo' ? 'Logo' : valueToDisplay(sme, ''),
                        type: idShort === 'CompanyLogo' ? 'logo' : 'text',
                    });
                }
            }
        }

        extractContactRows();
    }

    function extractContactRows(): void {
        const manufacturerContactInformation = getSubmodelElementByIdShort(
            'AddressInformation',
            nameplateSubmodel.value
        );

        if (!hasValue(manufacturerContactInformation)) return;

        const address = determineAddress(manufacturerContactInformation);
        if (address.trim() !== '') {
            generalRows.value.push({
                idShort: 'Address',
                label: 'Address',
                value: address,
                type: 'text',
            });
        }

        const phoneSMC = getSubmodelElementByIdShort('Phone', manufacturerContactInformation);
        if (hasValue(phoneSMC)) {
            const telephoneNumberMLP = getSubmodelElementByIdShort('TelephoneNumber', phoneSMC);
            const typeOfTelephoneProperty = getSubmodelElementByIdShort('TypeOfTelephone', phoneSMC);
            if (hasValue(telephoneNumberMLP)) {
                const type = getTypeOfTelephone(valueToDisplay(typeOfTelephoneProperty));
                generalRows.value.push({
                    idShort: 'TelephoneNumber',
                    label: type ? `Telephone (${type})` : 'Telephone',
                    value: valueToDisplay(telephoneNumberMLP, 'en', firstLangStringSetText(telephoneNumberMLP)),
                    type: 'text',
                });
            }
        }

        const faxSMC = getSubmodelElementByIdShort('Fax', manufacturerContactInformation);
        if (hasValue(faxSMC)) {
            const faxNumberMLP = getSubmodelElementByIdShort('FaxNumber', faxSMC);
            const typeOfFaxNumberProperty = getSubmodelElementByIdShort('TypeOfFaxNumber', faxSMC);
            if (hasValue(faxNumberMLP)) {
                const type = getTypeOfFaxNumber(valueToDisplay(typeOfFaxNumberProperty));
                generalRows.value.push({
                    idShort: 'FaxNumber',
                    label: type ? `Fax (${type})` : 'Fax',
                    value: valueToDisplay(faxNumberMLP, 'en', firstLangStringSetText(faxNumberMLP)),
                    type: 'text',
                });
            }
        }

        const emailSMC = getSubmodelElementByIdShort('Email', manufacturerContactInformation);
        if (hasValue(emailSMC)) {
            const emailAddressMLP = getSubmodelElementByIdShort('EmailAddress', emailSMC);
            const typeOfEmailAddressProperty = getSubmodelElementByIdShort('TypeOfEmailAddress', emailSMC);
            if (hasValue(emailAddressMLP)) {
                const type = getTypeOfEmailAddress(valueToDisplay(typeOfEmailAddressProperty));
                generalRows.value.push({
                    idShort: 'Email',
                    label: type ? `Email (${type})` : 'Email',
                    value: valueToDisplay(emailAddressMLP, 'en', firstLangStringSetText(emailAddressMLP)),
                    type: 'text',
                });
            }
        }
    }

    async function extractLogo(): Promise<void> {
        const companyLogo = getSubmodelElementByIdShort('CompanyLogo', nameplateSubmodel.value);
        if (!companyLogo || Object.keys(companyLogo).length === 0) return;

        logoSrc.value = await valueBlob(companyLogo);
    }

    function getDisplayValue(value: string): string {
        return value && value.trim() !== '' ? value : '-';
    }
</script>
