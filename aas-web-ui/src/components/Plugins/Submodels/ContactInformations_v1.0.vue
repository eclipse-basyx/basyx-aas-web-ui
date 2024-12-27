<template>
    <v-container v-if="Object.keys(submodelElementData).length > 0" fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Contact Information"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="loadingState" class="mb-4">
            <v-skeleton-loader type="list-item-avatar, divider, table-heading@8, actions"></v-skeleton-loader>
        </v-card>
        <template v-else-if="Object.keys(contactInformationsData).length > 0 && contactInformations.length > 0">
            <v-expansion-panels v-model="panel">
                <v-expansion-panel v-for="(contactInformation, index) in contactInformations" :key="index">
                    <v-expansion-panel-title>
                        <v-list-item class="pa-0">
                            <template #prepend>
                                <v-icon size="small">mdi-card-account-phone</v-icon>
                            </template>
                            <v-list-item-title>{{ nameToDisplay(contactInformation) }}</v-list-item-title>
                            <!-- <v-list-item-subtitle v-if="descriptionToDisplay(contactInformation)">
                                {{ descriptionToDisplay(contactInformation) }}
                            </v-list-item-subtitle> -->
                        </v-list-item>
                    </v-expansion-panel-title>
                    <v-divider v-if="panel === index"></v-divider>
                    <v-expansion-panel-text>
                        <v-table>
                            <tbody>
                                <tr
                                    v-for="contactInformationProperty in contactInformation.properties"
                                    :key="contactInformationProperty.idShort"
                                    :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                    <td>
                                        <div class="text-subtitleText text-caption">
                                            <span>{{ nameToDisplay(contactInformationProperty) }}</span>
                                            <!-- Show english description, if available -->
                                            <v-tooltip
                                                v-if="descriptionToDisplay(contactInformationProperty)"
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div class="text-caption">
                                                    {{ descriptionToDisplay(contactInformationProperty) }}
                                                </div>
                                            </v-tooltip>
                                            <!-- Otherwise show all available descriptions -->
                                            <v-tooltip
                                                v-else-if="
                                                    contactInformationProperty.description &&
                                                    contactInformationProperty.description.length > 0
                                                "
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div
                                                    v-for="(description, i) in contactInformationProperty.description"
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
                                        <a
                                            v-if="checkIdShort(contactInformationProperty, 'AddressOfAdditionalLink')"
                                            :href="contactInformationProperty.value"
                                            target="_blank"
                                            class="text-caption">
                                            {{ contactInformationProperty.value }}
                                        </a>
                                        <!-- NationalCode -->
                                        <template v-else-if="checkIdShort(contactInformationProperty, 'NationalCode')">
                                            <!-- Show english value, if available -->
                                            <div v-if="valueToDisplay(contactInformationProperty)" class="text-caption">
                                                {{ valueToDisplay(contactInformationProperty) }}
                                                (
                                                <span
                                                    :class="
                                                        'fi fi-' +
                                                        valueToDisplay(contactInformationProperty).toLowerCase()
                                                    ">
                                                </span>
                                                {{ getCountryName(valueToDisplay(contactInformationProperty)) }})
                                            </div>
                                            <!-- Otherwise show all available values -->
                                            <template
                                                v-for="(langStringSet, j) in contactInformationProperty.value"
                                                v-else
                                                :key="j">
                                                <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                    <span class="font-weight-bold">
                                                        {{ langStringSet?.language + ': ' }}
                                                    </span>
                                                    {{ langStringSet?.text }}
                                                </div>
                                            </template>
                                        </template>
                                        <!-- Phone -->
                                        <span
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
                                                size="x-small">
                                                {{ contactInformationProperty.typeOfValue }}
                                            </v-chip>
                                            {{ valueToDisplay(contactInformationProperty) }}
                                        </span>
                                        <!-- MultiLanguageProperties -->
                                        <template
                                            v-else-if="contactInformationProperty.modelType == 'MultiLanguageProperty'">
                                            <!-- Show english value, if available -->
                                            <div v-if="valueToDisplay(contactInformationProperty)" class="text-caption">
                                                {{ valueToDisplay(contactInformationProperty) }}
                                            </div>
                                            <!-- Otherwise show all available values -->
                                            <template
                                                v-for="(langStringSet, j) in contactInformationProperty.value"
                                                v-else
                                                :key="j">
                                                <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                    <span class="font-weight-bold">
                                                        {{ langStringSet?.language + ': ' }}
                                                    </span>
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
                            </tbody>
                        </v-table>
                        <v-card-actions class="pa-0">
                            <v-spacer></v-spacer>
                            <v-btn
                                size="small"
                                color="primary"
                                variant="elevated"
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
    import 'flag-icons/css/flag-icons.min.css'; // Import the flag-icons CSS
    import { computed, onMounted, ref } from 'vue';
    import { downloadVCard } from '@/composables/VirtualContactFile';
    import { useAASStore } from '@/store/AASDataStore';
    import { getCountryName } from '@/utils/generalUtils';
    import { checkIdShort, descriptionToDisplay, nameToDisplay } from '@/utils/ReferableUtils';
    import { firstLangStringSetText } from '@/utils/SubmodelElements/MultiLanguagePropertyUtils';
    import {
        calculateSubmodelElementPathes,
        hasValue,
        valueToDisplay,
    } from '@/utils/SubmodelElements/SubmodelElementUtils';
    import {
        determineAddress,
        determineContactName,
        generateVCard,
        getTypeOfEmailAddress,
        getTypeOfFaxNumber,
        getTypeOfTelephone,
        rolesOfContactPerson,
    } from '@/utils/SubmodelTemplates/ContactInformation_v1.0';

    // Define component options such as custom static properties
    defineOptions({
        name: 'ContactInformation',
        semanticId: [
            'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations', // Visualization for the SMT ContactInformations
            'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation', // Visualization for the SMC ContactInformation, e.g. in the SMT Nameplate v2
        ],
    });

    // Stores
    const aasStore = useAASStore();

    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const loadingState = ref(false);
    const contactInformationsData = ref({} as any);
    const panel = ref(0);
    const contactInformations = ref([] as Array<any>);

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization() {
        // console.log('initializeVisualization()', 'props', props);
        loadingState.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            contactInformationsData.value = {};
            loadingState.value = false;
            return;
        }

        contactInformationsData.value = await calculateSubmodelElementPathes(
            { ...props.submodelElementData },
            selectedNode.value.path
        );

        // Determine ContactInformation SMCs
        let contactInformationSMCs = [];
        if (contactInformationsData.value?.submodelElements) {
            // For SMT ContactInformations
            contactInformationSMCs = contactInformationsData.value.submodelElements.filter((element: any) => {
                return (
                    element.semanticId.keys[0].value ===
                    'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation'
                );
            });
        } else if (contactInformationsData.value?.value) {
            // For SMC ContactInformation
            contactInformationSMCs = [contactInformationsData.value];
        }

        contactInformationSMCs.forEach((contactInformationSMC: any) => {
            let contactInformation = {} as any;

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
            let roleOfContactPersonMlp = contactInformationSMC.value.find((element: any) =>
                checkIdShort(element, 'RoleOfContactPerson')
            );
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
            let phoneSMC = contactInformationSMC.value.find((sme: any) => checkIdShort(sme, 'Phone'));
            if (
                phoneSMC &&
                Object.keys(phoneSMC).length > 0 &&
                Array.isArray(phoneSMC.value) &&
                phoneSMC.value.length > 0
            ) {
                let telephoneNumberMLP = phoneSMC.value.find((sme: any) => checkIdShort(sme, 'TelephoneNumber'));
                let typeOfTelephoneProperty = phoneSMC.value.find((sme: any) => checkIdShort(sme, 'TypeOfTelephone'));
                if (
                    telephoneNumberMLP &&
                    Object.keys(telephoneNumberMLP).length > 0 &&
                    valueToDisplay(telephoneNumberMLP)
                ) {
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
            let faxSMC = contactInformationSMC.value.find((sme: any) => checkIdShort(sme, 'Fax'));
            if (faxSMC && Object.keys(faxSMC).length > 0 && Array.isArray(faxSMC.value) && faxSMC.value.length > 0) {
                let faxNumberMLP = faxSMC.value.find((sme: any) => checkIdShort(sme, 'FaxNumber'));
                let typeOfFaxNumberProperty = faxSMC.value.find((sme: any) => checkIdShort(sme, 'TypeOfFaxNumber'));
                if (faxNumberMLP && Object.keys(faxNumberMLP).length > 0 && valueToDisplay(faxNumberMLP)) {
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
            let emailSMC = contactInformationSMC.value.find((sme: any) => checkIdShort(sme, 'Email'));
            if (
                emailSMC &&
                Object.keys(emailSMC).length > 0 &&
                Array.isArray(emailSMC.value) &&
                emailSMC.value.length > 0
            ) {
                let emailAddressMLP = emailSMC.value.find((sme: any) => checkIdShort(sme, 'EmailAddress'));
                let typeOfEmailAddressProperty = emailSMC.value.find((sme: any) =>
                    checkIdShort(sme, 'TypeOfEmailAddress')
                );
                if (emailAddressMLP && Object.keys(emailAddressMLP).length > 0 && valueToDisplay(emailAddressMLP)) {
                    contactInformation.properties.push({
                        idShort: 'FaxNumber',
                        displayName: [{ language: 'en', text: 'Email Address' }],
                        modelType: 'Property',
                        valueType: 'String',
                        value: valueToDisplay(emailAddressMLP, 'en', firstLangStringSetText(emailAddressMLP)),
                        typeOfValue: getTypeOfEmailAddress(valueToDisplay(typeOfEmailAddressProperty)),
                    });
                }
            }

            contactInformation.vCard = generateVCard(contactInformationSMC);

            contactInformations.value.push(contactInformation);
        });

        loadingState.value = false;
    }
</script>
