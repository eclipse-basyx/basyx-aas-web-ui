<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Contact Information"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="loading" class="mb-4">
            <v-skeleton-loader type="list-item-avatar, divider, table-heading@8, actions"></v-skeleton-loader>
        </v-card>
        <template v-else-if="Object.keys(submodelElementData).length > 0">
            <v-expansion-panels v-if="contactInformations.length > 0" v-model="panel">
                <v-expansion-panel v-for="(contactInformation, index) in contactInformations" :key="index">
                    <v-expansion-panel-title>
                        <v-list-item class="pa-0">
                            <template #prepend>
                                <v-icon size="small">mdi-card-account-phone</v-icon>
                            </template>
                            <v-list-item-title>
                                {{ nameToDisplay(contactInformation, 'en', 'Contact Information') }}
                                <DescriptionTooltip :description-array="contactInformation?.description" />
                            </v-list-item-title>
                        </v-list-item>
                    </v-expansion-panel-title>
                    <v-divider v-if="panel === index"></v-divider>
                    <v-expansion-panel-text class="pt-4">
                        <v-sheet border rounded>
                            <v-table>
                                <tbody>
                                    <template
                                        v-for="(contactInformationProperty, i) in contactInformation.properties"
                                        :key="contactInformationProperty.idShort">
                                        <tr
                                            v-if="hasValue(contactInformationProperty)"
                                            :class="i % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                            <td>
                                                <div class="text-subtitleText text-caption">
                                                    <span>{{ nameToDisplay(contactInformationProperty) }}</span>
                                                    <DescriptionTooltip
                                                        :description-array="contactInformationProperty?.description" />
                                                </div>
                                            </td>
                                            <td>
                                                <!-- Address of Additional Link -->
                                                <template
                                                    v-if="
                                                        checkIdShort(
                                                            contactInformationProperty,
                                                            'AddressOfAdditionalLink'
                                                        )
                                                    ">
                                                    <a
                                                        v-if="
                                                            valueToDisplay(contactInformationProperty).startsWith(
                                                                'http'
                                                            )
                                                        "
                                                        :href="valueToDisplay(contactInformationProperty)"
                                                        target="_blank"
                                                        class="text-caption text-primary">
                                                        {{ valueToDisplay(contactInformationProperty) }}
                                                    </a>
                                                    <span v-else class="text-caption">{{
                                                        valueToDisplay(contactInformationProperty)
                                                    }}</span>
                                                </template>
                                                <!-- Language -->
                                                <template
                                                    v-else-if="checkIdShort(contactInformationProperty, 'Language')">
                                                    <!-- Show english value, if available -->
                                                    <div
                                                        v-if="valueToDisplay(contactInformationProperty)"
                                                        class="text-caption">
                                                        <template
                                                            v-if="
                                                                getLanguageName(
                                                                    valueToDisplay(contactInformationProperty)
                                                                )
                                                            ">
                                                            {{
                                                                getLanguageName(
                                                                    valueToDisplay(contactInformationProperty)
                                                                )
                                                            }}
                                                            ({{ valueToDisplay(contactInformationProperty) }})
                                                        </template>
                                                        <template v-else>
                                                            {{ valueToDisplay(contactInformationProperty) }}
                                                        </template>
                                                    </div>
                                                    <!-- Otherwise show all available values -->
                                                    <template
                                                        v-for="(langStringSet, j) in contactInformationProperty.value"
                                                        v-else
                                                        :key="j">
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                            <v-chip size="x-small" label class="mr-1">{{
                                                                langStringSet.language
                                                            }}</v-chip>
                                                            {{ langStringSet?.text }}
                                                        </div>
                                                    </template>
                                                </template>
                                                <!-- NationalCode -->
                                                <template
                                                    v-else-if="
                                                        checkIdShort(contactInformationProperty, 'NationalCode')
                                                    ">
                                                    <!-- Show english value, if available -->
                                                    <div
                                                        v-if="valueToDisplay(contactInformationProperty)"
                                                        class="text-caption">
                                                        {{ valueToDisplay(contactInformationProperty) }}
                                                        {{
                                                            getCountryName(valueToDisplay(contactInformationProperty))
                                                                ? ' (' +
                                                                  getCountryName(
                                                                      valueToDisplay(contactInformationProperty)
                                                                  ) +
                                                                  ')'
                                                                : ''
                                                        }}
                                                    </div>
                                                    <!-- Otherwise show all available values -->
                                                    <template
                                                        v-for="(langStringSet, j) in contactInformationProperty.value"
                                                        v-else
                                                        :key="j">
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                            <v-chip size="x-small" label class="mr-1">{{
                                                                langStringSet.language
                                                            }}</v-chip>
                                                            {{ langStringSet?.text }}
                                                        </div>
                                                    </template>
                                                </template>
                                                <!-- Telephone number / Fax number / Email -->
                                                <div
                                                    v-else-if="
                                                        checkIdShort(contactInformationProperty, 'TelephoneNumber') ||
                                                        checkIdShort(contactInformationProperty, 'FaxNumber') ||
                                                        checkIdShort(contactInformationProperty, 'Email')
                                                    "
                                                    class="text-caption">
                                                    <v-chip
                                                        v-if="
                                                            contactInformationProperty?.typeOfValue &&
                                                            contactInformationProperty?.typeOfValue.trim() !== ''
                                                        "
                                                        :prepend-icon="
                                                            contactInformationProperty.typeOfValue.includes('Office') ||
                                                            ['Secretary', 'Substitute'].includes(
                                                                contactInformationProperty.typeOfValue
                                                            )
                                                                ? 'mdi-office-building'
                                                                : 'mdi-home'
                                                        "
                                                        size="x-small"
                                                        class="mr-2">
                                                        {{ contactInformationProperty.typeOfValue }}
                                                    </v-chip>
                                                    <template
                                                        v-if="
                                                            checkIdShort(contactInformationProperty, 'TelephoneNumber')
                                                        ">
                                                        <a
                                                            :href="`tel:${valueToDisplay(contactInformationProperty).replaceAll(' ', '')}`"
                                                            class="text-caption text-primary">
                                                            {{ valueToDisplay(contactInformationProperty) }}
                                                        </a>
                                                    </template>
                                                    <template
                                                        v-else-if="checkIdShort(contactInformationProperty, 'Email')">
                                                        <a
                                                            :href="`mailto:${valueToDisplay(contactInformationProperty)}`"
                                                            class="text-caption text-primary">
                                                            {{ valueToDisplay(contactInformationProperty) }}
                                                        </a>
                                                    </template>
                                                    <template v-else>
                                                        {{ valueToDisplay(contactInformationProperty) }}
                                                    </template>
                                                </div>
                                                <!-- MultiLanguageProperties -->
                                                <template
                                                    v-else-if="
                                                        contactInformationProperty.modelType == 'MultiLanguageProperty'
                                                    ">
                                                    <!-- Show english value, if available -->
                                                    <div
                                                        v-if="valueToDisplay(contactInformationProperty)"
                                                        class="text-caption">
                                                        {{ valueToDisplay(contactInformationProperty) }}
                                                    </div>
                                                    <!-- Otherwise show all available values -->
                                                    <template
                                                        v-for="(langStringSet, j) in contactInformationProperty.value"
                                                        v-else
                                                        :key="j">
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                            <v-chip size="x-small" label class="mr-1">{{
                                                                langStringSet.language
                                                            }}</v-chip>
                                                            {{ langStringSet?.text }}
                                                        </div>
                                                    </template>
                                                </template>
                                                <!-- Default -->
                                                <span v-else class="text-caption">
                                                    {{ valueToDisplay(contactInformationProperty) }}
                                                </span>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </v-table>
                        </v-sheet>
                        <v-card-actions
                            v-if="contactInformation.vCard && contactInformation.vCard.trim() !== ''"
                            class="pt-4 pb-0 pr-0">
                            <v-spacer></v-spacer>
                            <v-btn
                                size="small"
                                color="primary"
                                variant="elevated"
                                prepend-icon="mdi-card-account-details"
                                class="text-buttonText"
                                @click="
                                    downloadVCard(contactInformation.vCard, nameToDisplay(contactInformation) + '.vcf')
                                ">
                                {{ 'Download Contact' }}
                            </v-btn>
                        </v-card-actions>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, ref, watch } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { useContactInformation_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/ContactInformation_v1_0Utils';
    import { useVirtualContactFileUtils } from '@/composables/VirtualContactFileUtils';
    import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';
    import { firstLangStringSetText } from '@/utils/AAS/SubmodelElements/MultiLanguagePropertyUtils';
    import { getCountryName, getLanguageName } from '@/utils/LocaleUtils';

    // Options
    defineOptions({
        name: 'ContactInformation',
        semanticId: [
            'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations', // Visualization for the SMT ContactInformations
            'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation', // Visualization for the SMC ContactInformation, e.g. in the SMT Nameplate v2
            'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/AddressInformation', // Visualization for the SMC ContactInformation, e.g. in the SMT Nameplate v3
        ],
    });

    // Composables
    const { setData } = useSMHandling();
    const { checkIdShort, getSubmodelElementByIdShort, nameToDisplay } = useReferableUtils();
    const {
        semanticIdSMCContactInformation,
        determineAddress,
        determineContactName,
        generateVCard,
        getTypeOfEmailAddress,
        getTypeOfFaxNumber,
        getTypeOfTelephone,
        rolesOfContactPerson,
    } = useContactInformation_v1_0Utils();
    const { hasValue, valueToDisplay } = useSME();
    const { downloadVCard } = useVirtualContactFileUtils();

    // Props
    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const loading = ref(false);
    const panel = ref(0);
    const contactInformations = ref([] as Array<any>);

    //Watchers
    watch(
        // Watcher to ensure data is initialized in case of switching between a SM 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations' and a SMC 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation'
        () => props.submodelElementData,
        () => {
            initializeVisualization();
        }
    );

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization(): Promise<void> {
        loading.value = true;
        // Reset contactInformations because it is filled by .push()
        // Otherwise in case of switching between a SM 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations' and a SMC 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation' wrong data will be displayed
        contactInformations.value = [];

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            contactInformations.value = [];
            loading.value = false;
            return;
        }

        let submodelElementData = await setData(
            { ...props.submodelElementData },
            props.submodelElementData.path,
            false,
            props.submodelElementData.timestamp
        );

        // Determine ContactInformation SMCs
        let contactInformationSMCs = [];
        if (submodelElementData.submodelElements) {
            // For SMT ContactInformations
            contactInformationSMCs = submodelElementData.submodelElements.filter((sme: any) => {
                return (
                    checkIdShort(sme, 'ContactInformation', true) ||
                    checkSemanticId(sme, semanticIdSMCContactInformation)
                );
            });
        } else if (submodelElementData.value) {
            // For SMC ContactInformation
            contactInformationSMCs = [submodelElementData];
        }

        contactInformationSMCs.forEach((contactInformationSMC: any) => {
            let contactInformation = {} as any;

            contactInformation.idShort = contactInformationSMC.idShort;
            contactInformation.description = contactInformationSMC.description;
            contactInformation.displayName = contactInformationSMC.displayName;

            contactInformation.properties = [] as Array<any>;

            // Contact name
            let contactName = determineContactName(contactInformationSMC);
            if (contactName.trim() !== '') {
                contactInformation.properties.push({
                    idShort: 'ContactPerson',
                    displayName: [{ language: 'en', text: 'Contact person' }],
                    modelType: 'Property',
                    valueType: 'String',
                    value: contactName,
                });
            }

            // Role of Contact Person
            let roleOfContactPersonMlp = getSubmodelElementByIdShort('RoleOfContactPerson', contactInformationSMC);
            let roleOfContactPerson = valueToDisplay(
                roleOfContactPersonMlp,
                'en',
                firstLangStringSetText(roleOfContactPersonMlp)
            );
            if (roleOfContactPerson.trim() !== '') {
                const foundRoleOfContactPerson = rolesOfContactPerson.find(
                    (rolesOfContactPersonElement: any) => rolesOfContactPersonElement.valueId === roleOfContactPerson
                );
                if (foundRoleOfContactPerson) {
                    roleOfContactPersonMlp.value = foundRoleOfContactPerson.value;
                    roleOfContactPersonMlp.valueId = foundRoleOfContactPerson.valueId;
                }
                contactInformation.properties.push(roleOfContactPersonMlp);
            }

            // General properties
            contactInformationSMC.value.forEach((sme: any) => {
                [
                    'FurtherDetailsOfContact',
                    'Company',
                    'Department',
                    'Language',
                    'TimeZone',
                    'AddressOfAdditionalLink',
                    'NationalCode',
                ].forEach((idShort: any) => {
                    if (checkIdShort(sme, idShort) && hasValue(sme)) {
                        contactInformation.properties.push(sme);
                    }
                });
            });

            // (postal) address
            let address = determineAddress(contactInformationSMC);
            if (address.trim() !== '') {
                contactInformation.properties.push({
                    idShort: 'Address',
                    displayName: [{ language: 'en', text: 'Address' }],
                    modelType: 'Property',
                    valueType: 'String',
                    value: address,
                });
            }

            // Telephone number
            let phoneSMC = getSubmodelElementByIdShort('Phone', contactInformationSMC);
            if (hasValue(phoneSMC)) {
                let telephoneNumberMLP = getSubmodelElementByIdShort('TelephoneNumber', phoneSMC);
                let typeOfTelephoneProperty = getSubmodelElementByIdShort('TypeOfTelephone', phoneSMC);
                if (hasValue(telephoneNumberMLP)) {
                    contactInformation.properties.push({
                        idShort: 'TelephoneNumber',
                        displayName: [{ language: 'en', text: 'Telephone number' }],
                        modelType: 'Property',
                        valueType: 'String',
                        value: valueToDisplay(telephoneNumberMLP, 'en', firstLangStringSetText(telephoneNumberMLP)),
                        typeOfValue: getTypeOfTelephone(valueToDisplay(typeOfTelephoneProperty)),
                    });
                }
            }

            // Fax number
            let faxSMC = getSubmodelElementByIdShort('Fax', contactInformationSMC);
            if (faxSMC && Object.keys(faxSMC).length > 0 && Array.isArray(faxSMC.value) && faxSMC.value.length > 0) {
                let faxNumberMLP = getSubmodelElementByIdShort('FaxNumber', faxSMC);
                let typeOfFaxNumberProperty = getSubmodelElementByIdShort('TypeOfFaxNumber', faxSMC);
                if (hasValue(faxNumberMLP)) {
                    contactInformation.properties.push({
                        idShort: 'FaxNumber',
                        displayName: [{ language: 'en', text: 'Fax number' }],
                        modelType: 'Property',
                        valueType: 'String',
                        value: valueToDisplay(faxNumberMLP, 'en', firstLangStringSetText(faxNumberMLP)),
                        typeOfValue: getTypeOfFaxNumber(valueToDisplay(typeOfFaxNumberProperty)),
                    });
                }
            }

            // Email
            let emailSMC = getSubmodelElementByIdShort('Email', contactInformationSMC);
            if (
                emailSMC &&
                Object.keys(emailSMC).length > 0 &&
                Array.isArray(emailSMC.value) &&
                emailSMC.value.length > 0
            ) {
                let emailAddressMLP = getSubmodelElementByIdShort('EmailAddress', emailSMC);
                let typeOfEmailAddressProperty = getSubmodelElementByIdShort('TypeOfEmailAddress', emailSMC);
                if (hasValue(emailAddressMLP)) {
                    contactInformation.properties.push({
                        idShort: 'Email',
                        displayName: [{ language: 'en', text: 'Email Address' }],
                        modelType: 'Property',
                        valueType: 'String',
                        value: valueToDisplay(emailAddressMLP, 'en', firstLangStringSetText(emailAddressMLP)),
                        typeOfValue: getTypeOfEmailAddress(valueToDisplay(typeOfEmailAddressProperty)),
                    });
                }
            }

            contactInformation.vCard = generateVCard(contactInformationSMC);
            // console.log('vCard:', contactInformation.vCard);

            contactInformations.value.push(contactInformation);
        });

        loading.value = false;
    }
</script>
