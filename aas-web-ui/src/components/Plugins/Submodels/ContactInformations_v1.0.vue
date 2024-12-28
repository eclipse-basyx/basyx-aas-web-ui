<template>
    <v-container v-if="Object.keys(submodelElementData).length > 0" fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Contact Information"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="isLoading" class="mb-4">
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
                            <v-list-item-title>{{
                                nameToDisplay(contactInformation, 'en', 'Contact Information')
                            }}</v-list-item-title>
                            <!-- <v-list-item-subtitle v-if="descriptionToDisplay(contactInformation)">
                                {{ descriptionToDisplay(contactInformation) }}
                            </v-list-item-subtitle> -->
                        </v-list-item>
                    </v-expansion-panel-title>
                    <v-divider v-if="panel === index"></v-divider>
                    <v-expansion-panel-text>
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
                                                        v-for="(
                                                            description, j
                                                        ) in contactInformationProperty.description"
                                                        :key="j"
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
                                            <!-- Address of Additional Link -->
                                            <a
                                                v-if="
                                                    checkIdShort(contactInformationProperty, 'AddressOfAdditionalLink')
                                                "
                                                :href="valueToDisplay(contactInformationProperty)"
                                                target="_blank"
                                                class="text-caption">
                                                {{ valueToDisplay(contactInformationProperty) }}
                                            </a>
                                            <!-- Language -->
                                            <template v-else-if="checkIdShort(contactInformationProperty, 'Language')">
                                                <!-- Show english value, if available -->
                                                <div
                                                    v-if="valueToDisplay(contactInformationProperty)"
                                                    class="text-caption">
                                                    <template
                                                        v-if="
                                                            getLanguageName(valueToDisplay(contactInformationProperty))
                                                        ">
                                                        {{
                                                            getLanguageName(valueToDisplay(contactInformationProperty))
                                                        }}
                                                        ({{ valueToDisplay(contactInformationProperty) }})
                                                    </template>
                                                    <template v-else>{{
                                                        valueToDisplay(contactInformationProperty)
                                                    }}</template>
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
                                            <!-- NationalCode -->
                                            <template
                                                v-else-if="checkIdShort(contactInformationProperty, 'NationalCode')">
                                                <!-- Show english value, if available -->
                                                <div
                                                    v-if="valueToDisplay(contactInformationProperty)"
                                                    class="text-caption">
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
                                                    size="x-small"
                                                    class="mr-1">
                                                    {{ contactInformationProperty.typeOfValue }}
                                                </v-chip>
                                                <template
                                                    v-if="
                                                        checkIdShort(contactInformationProperty, 'TelephoneNumber') &&
                                                        isMobile
                                                    ">
                                                    <a
                                                        :href="`tel:${valueToDisplay(contactInformationProperty).replaceAll(' ', '')}`">
                                                        {{ valueToDisplay(contactInformationProperty) }}
                                                    </a>
                                                </template>
                                                <template v-else-if="checkIdShort(contactInformationProperty, 'Email')">
                                                    <a :href="`mailto:${valueToDisplay(contactInformationProperty)}`">
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
                                </template>
                            </tbody>
                        </v-table>
                        <v-card-actions
                            v-if="contactInformation?.vCard && contactInformation.vCard.trim() !== ''"
                            class="pa-0">
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
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getCountryName, getLanguageName } from '@/utils/LocaleUtils';
    import {
        checkIdShort,
        descriptionToDisplay,
        getSubmodelElementByIdShort,
        nameToDisplay,
    } from '@/utils/ReferableUtils';
    import { checkSemanticId } from '@/utils/SemanticIdUtils';
    import { firstLangStringSetText } from '@/utils/SubmodelElements/MultiLanguagePropertyUtils';
    import {
        calculateSubmodelElementPaths,
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
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const isLoading = ref(false);
    const contactInformationsData = ref({} as any);
    const panel = ref(0);
    const contactInformations = ref([] as Array<any>);

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const isMobile = computed(() => navigationStore.getIsMobile);

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization() {
        // console.log('initializeVisualization()', 'props', props);
        isLoading.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            contactInformationsData.value = {};
            isLoading.value = false;
            return;
        }

        contactInformationsData.value = await calculateSubmodelElementPaths(
            { ...props.submodelElementData },
            selectedNode.value.path
        );

        // Determine ContactInformation SMCs
        let contactInformationSMCs = [];
        if (contactInformationsData.value?.submodelElements) {
            // For SMT ContactInformations
            contactInformationSMCs = contactInformationsData.value.submodelElements.filter((sme: any) => {
                return (
                    checkIdShort(sme, 'ContactInformation', true) ||
                    checkSemanticId(
                        sme,
                        'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation'
                    )
                );
            });
        } else if (contactInformationsData.value?.value) {
            // For SMC ContactInformation
            contactInformationSMCs = [contactInformationsData.value];
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

        isLoading.value = false;
    }
</script>
