<template>
    <v-container v-if="Object.keys(submodelElementData).length > 0" fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Contact Information"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="loadingState" class="mb-4">
            <v-skeleton-loader type="list-item-avatar, divider, table-heading@8, actions"></v-skeleton-loader>
        </v-card>
        <template v-else-if="Object.keys(contactInformationsData).length > 0 && contacts.length > 0">
            <v-expansion-panels v-model="panel">
                <v-expansion-panel v-for="(contact, index) in contacts" :key="index">
                    <v-expansion-panel-title>
                        <v-list-item class="pa-0">
                            <template #prepend>
                                <v-icon size="small">mdi-card-account-phone</v-icon>
                            </template>
                            <v-list-item-title>{{ nameToDisplay(contact) }}</v-list-item-title>
                        </v-list-item>
                    </v-expansion-panel-title>
                    <v-divider v-if="panel === index"></v-divider>
                    <v-expansion-panel-text>
                        <!-- General Properties -->
                        <v-table>
                            <tbody>
                                <tr
                                    v-for="(contactProperty, index) in contact.propertiesForVisualization"
                                    :key="contactProperty.idShort"
                                    :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                    <td>
                                        <div class="text-subtitleText text-caption">
                                            <span>{{ nameToDisplay(contactProperty) }}</span>
                                            <!-- Show english description, if available -->
                                            <v-tooltip
                                                v-if="descriptionToDisplay(contactProperty)"
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div class="text-caption">
                                                    {{ descriptionToDisplay(contactProperty) }}
                                                </div>
                                            </v-tooltip>
                                            <!-- Otherwise show all available descriptions -->
                                            <v-tooltip
                                                v-else-if="
                                                    contactProperty.description &&
                                                    contactProperty.description.length > 0
                                                "
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div
                                                    v-for="(description, i) in contactProperty.description"
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
                                        <!-- NationalCode -->
                                        <template v-if="checkIdShort(contactProperty, 'NationalCode')">
                                            <!-- Show english value, if available -->
                                            <div v-if="valueToDisplay(contactProperty)" class="text-caption">
                                                {{ valueToDisplay(contactProperty) }}
                                                (
                                                <span :class="'fi fi-' + valueToDisplay(contactProperty).toLowerCase()">
                                                </span>
                                                {{ getCountryName(valueToDisplay(contactProperty)) }})
                                            </div>
                                            <!-- Otherwise show all available values -->
                                            <template
                                                v-for="(langStringSet, j) in contactProperty.value"
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
                                        <!-- MultiLanguageProperties -->
                                        <template v-else-if="contactProperty.modelType == 'MultiLanguageProperty'">
                                            <!-- Show english value, if available -->
                                            <div v-if="valueToDisplay(contactProperty)" class="text-caption">
                                                {{ valueToDisplay(contactProperty) }}
                                            </div>
                                            <!-- Otherwise show all available values -->
                                            <template
                                                v-for="(langStringSet, j) in contactProperty.value"
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
                                        <span v-else class="text-caption">{{ valueToDisplay(contactProperty) }}</span>
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
                                @click="downloadVCard(contact.vCardString, nameToDisplay(contact) + '.vcf')">
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
    const contacts = ref([] as Array<any>);
    const rolesOfContactPerson = [
        {
            valueId: '0173-1#07-AAS927#001',
            value: 'Administrativ contact',
        },
        {
            valueId: '0173-1#07-AAS928#001',
            value: 'Commercial contact',
        },
        {
            valueId: '0173-1#07-AAS929#001',
            value: 'Other contact',
        },
        {
            valueId: '0173-1#07-AAS930#001',
            value: 'Hazardous goods contact',
        },
        {
            valueId: '0173-1#07-AAS931#001',
            value: 'Technical contact',
        },
    ];

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

        let contactInformations = [];
        if (contactInformationsData.value?.submodelElements) {
            // For SMT ContactInformations
            contactInformations = contactInformationsData.value.submodelElements.filter((element: any) => {
                return (
                    element.semanticId.keys[0].value ===
                    'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation'
                );
            });
        } else if (contactInformationsData.value?.value) {
            // For SMC ContactInformation
            contactInformations = [contactInformationsData.value];
        }

        contactInformations.forEach((contactInformation: any) => {
            contactInformation.propertiesForVisualization = [] as Array<any>;

            // create Contact Person Property
            let nameParts: string[] = [];

            // Title
            let titleMlp = contactInformation.value.find((element: any) => checkIdShort(element, 'Title'));
            let title = valueToDisplay(titleMlp, 'en', firstLangStringSetText(titleMlp));
            if (title.trim() !== '') {
                nameParts.push(title);
            }

            // FirstName
            let firstNameMlp = contactInformation.value.find((element: any) => checkIdShort(element, 'FirstName'));
            let firstName = valueToDisplay(firstNameMlp, 'en', firstLangStringSetText(firstNameMlp));
            if (firstName.trim() !== '') {
                nameParts.push(firstName);
            }

            // MiddleNames
            let middleNamesMlp = contactInformation.value.find((element: any) => checkIdShort(element, 'MiddleNames'));
            let middleNames = valueToDisplay(middleNamesMlp, 'en', firstLangStringSetText(middleNamesMlp));
            if (middleNames.trim() !== '') {
                nameParts.push(middleNames);
            }

            // Name
            let nameOfContactMlp = contactInformation.value.find((element: any) =>
                checkIdShort(element, 'NameOfContact')
            );
            let nameOfContact = valueToDisplay(nameOfContactMlp, 'en', firstLangStringSetText(nameOfContactMlp));
            if (nameOfContact.trim() !== '') {
                nameParts.push(nameOfContact);
            }

            // join all name parts with a space
            let name = nameParts.filter(Boolean).join(' ');

            // AcademicTitle
            let academicTitleMlp = contactInformation.value.find((element: any) =>
                checkIdShort(element, 'AcademicTitle')
            );
            let academicTitle = valueToDisplay(academicTitleMlp, 'en', firstLangStringSetText(academicTitleMlp));
            if (academicTitle.trim() !== '') {
                // add a comma before academic title
                name += (name ? ', ' : '') + academicTitle;
            }
            // add Contact Person Property to the generalProperties
            if (name.trim() !== '') {
                contactInformation.propertiesForVisualization.push({
                    idShort: 'ContactPerson',
                    value: name,
                    modelType: 'Property',
                });
            }

            // RoleOfContactPerson
            let roleOfContactPersonMlp = contactInformation.value.find((element: any) =>
                checkIdShort(element, 'RoleOfContactPerson')
            );
            const roleOfContactPerson = valueToDisplay(
                roleOfContactPersonMlp,
                'en',
                firstLangStringSetText(roleOfContactPersonMlp)
            );
            if (roleOfContactPerson.trim() !== '') {
                // Delete (old) property
                contactInformation.value = contactInformation.value.filter(function (sme: any) {
                    return !checkIdShort(sme, 'RoleOfContactPerson');
                });
                const foundRoleOfContactPerson = rolesOfContactPerson.find(
                    (rolesOfContactPersonElement) => rolesOfContactPersonElement.valueId === roleOfContactPerson
                );
                if (foundRoleOfContactPerson) {
                    roleOfContactPersonMlp.value = foundRoleOfContactPerson.value;
                    roleOfContactPersonMlp.valueId = foundRoleOfContactPerson.valueId;
                }
                // Add (new) property
                contactInformation.value.push(roleOfContactPersonMlp);
                contactInformation.propertiesForVisualization.push(roleOfContactPersonMlp);
            }

            const generalPropertiesIdShorts = [
                'FurtherDetailsOfContact',
                'Company',
                'Department',
                'Language',
                'TimeZone',
                'POBox',
                'ZipCodeOfPOBox',
                'AddressOfAdditionalLink',
            ];

            contactInformation.value.forEach((sme: any) => {
                generalPropertiesIdShorts.forEach((idShort: any) => {
                    if (checkIdShort(sme, idShort) && hasValue(sme)) {
                        contactInformation.propertiesForVisualization.push(sme);
                    }
                });
            });

            const addressTemplate = (street: string, zipcode: string, cityTown: string, country: string) => {
                let address = '';
                if (street.trim() !== '') address += street + ', ';
                if (zipcode.trim() !== '') address += zipcode;
                if (zipcode.trim() !== '' && cityTown.trim() !== '') address += ' ';
                if (cityTown.trim() !== '') address += cityTown;
                if (country.trim() !== '') address += ', ' + country;
                return address;
            };

            // Street
            const streetSme = contactInformation.value.find((sme: any) => checkIdShort(sme, 'Street'));
            const street = valueToDisplay(streetSme, 'en', firstLangStringSetText(streetSme));

            // Zipcode
            const zipcodeSme = contactInformation.value.find((sme: any) => checkIdShort(sme, 'Zipcode'));
            const zipcode = valueToDisplay(zipcodeSme, 'en', firstLangStringSetText(zipcodeSme));

            // CityTown
            const cityTownSme = contactInformation.value.find((sme: any) => checkIdShort(sme, 'CityTown'));
            const cityTown = valueToDisplay(cityTownSme, 'en', firstLangStringSetText(cityTownSme));

            // Country
            const nationalCodeSme = contactInformation.value.find((sme: any) => checkIdShort(sme, 'NationalCode'));
            const nationalCode = valueToDisplay(nationalCodeSme, 'en', firstLangStringSetText(nationalCodeSme));
            if (nationalCode.trim() !== '') {
                contactInformation.propertiesForVisualization.push(nationalCodeSme);
            }
            const country = getCountryName(nationalCode);

            const address = addressTemplate(street, zipcode, cityTown, country);
            // console.log('address:', address);
            if (address.trim() !== '') {
                contactInformation.propertiesForVisualization.push({
                    idShort: 'Address',
                    modelType: 'Property',
                    valueType: 'String',
                    value: address,
                });
            }

            let phoneSmc = contactInformation.value.find((sme: any) => checkIdShort(sme, 'Phone'));
            if (
                phoneSmc &&
                Object.keys(phoneSmc).length > 0 &&
                Array.isArray(phoneSmc.value) &&
                phoneSmc.value.length > 0
            ) {
                let telephoneNumber = phoneSmc.value.find((sme: any) => checkIdShort(sme, 'TelephoneNumber'));
                if (telephoneNumber && Object.keys(telephoneNumber).length > 0 && valueToDisplay(telephoneNumber)) {
                    contactInformation.value.push(telephoneNumber);
                    contactInformation.propertiesForVisualization.push(telephoneNumber);
                }
            }

            let faxSmc = contactInformation.value.find((sme: any) => checkIdShort(sme, 'Fax'));
            if (faxSmc && Object.keys(faxSmc).length > 0 && Array.isArray(faxSmc.value) && faxSmc.value.length > 0) {
                let faxNumber = faxSmc.value.find((sme: any) => checkIdShort(sme, 'FaxNumber'));
                if (faxNumber && Object.keys(faxNumber).length > 0 && valueToDisplay(faxNumber)) {
                    contactInformation.value.push(faxNumber);
                    contactInformation.propertiesForVisualization.push(faxNumber);
                }
            }

            let emailSmc = contactInformation.value.find((sme: any) => checkIdShort(sme, 'Email'));
            if (
                emailSmc &&
                Object.keys(emailSmc).length > 0 &&
                Array.isArray(emailSmc.value) &&
                emailSmc.value.length > 0
            ) {
                let emailAddress = emailSmc.value.find((sme: any) => checkIdShort(sme, 'EmailAddress'));
                if (emailAddress && Object.keys(emailAddress).length > 0 && valueToDisplay(emailAddress)) {
                    contactInformation.value.push(emailAddress);
                    contactInformation.propertiesForVisualization.push(emailAddress);
                }
            }

            contactInformation.vCardString = generateVCard(contactInformation.value);

            contacts.value.push(contactInformation);
        });

        loadingState.value = false;
    }

    function generateVCard(contactInformationSmes: any[]): string {
        // console.log('generateVCard()', 'manufacturerProperties:', manufacturerProperties);
        let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';

        const contactPersonSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'ContactPerson'));
        const contactPerson = valueToDisplay(contactPersonSme, 'en', firstLangStringSetText(contactPersonSme));
        if (contactPerson.trim() !== '') {
            vCard += 'FN:' + contactPerson + '\n';
        }

        const companySme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'Company'));
        const company = valueToDisplay(companySme, 'en', firstLangStringSetText(companySme));
        if (company.trim() !== '') {
            vCard += 'ORG:' + company + '\n';
        }

        const departmentSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'Department'));
        const department = valueToDisplay(departmentSme, 'en', firstLangStringSetText(departmentSme));
        if (department.trim() !== '') {
            vCard += 'TITLE:' + department + '\n';
        }

        const roleOfContactPersonSme = contactInformationSmes.find((sme: any) =>
            checkIdShort(sme, 'RoleOfContactPerson')
        );
        const roleOfContactPerson = valueToDisplay(
            roleOfContactPersonSme,
            'en',
            firstLangStringSetText(roleOfContactPersonSme)
        );
        if (roleOfContactPerson.trim() !== '') {
            vCard += 'ROLE:' + roleOfContactPerson + '\n';
        }

        const languageSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'Language'));
        const language = valueToDisplay(languageSme, 'en', firstLangStringSetText(languageSme));
        if (language.trim() !== '') {
            vCard += 'LANG:' + language + '\n';
        }

        // const companyLogoSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'CompanyLogo'));
        // if (companyLogoSme) {
        //     vCard += 'PHOTO;MEDIATYPE=' + companyLogoSme.contentType + ':' + valueUrl(companyLogoSme) + '\n';
        // }

        // vCard ADR
        vCard += 'ADR;TYPE=WORK:;;';
        const streetSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'Street'));
        const street = valueToDisplay(streetSme, 'en', firstLangStringSetText(streetSme));
        if (street.trim() !== '') {
            // vCard ADR; street
            vCard += street;
        }
        vCard += ';';

        const ciytTownSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'CityTown'));
        const ciytTown = valueToDisplay(ciytTownSme, 'en', firstLangStringSetText(ciytTownSme));
        if (ciytTown.trim() !== '') {
            // vCard ADR; city/town
            vCard += ciytTown;
        }
        vCard += ';';

        const stateCountySme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'StateCounty'));
        const stateCounty = valueToDisplay(stateCountySme, 'en', firstLangStringSetText(stateCountySme));
        if (stateCounty.trim() !== '') {
            // vCard ADR; city/town
            vCard += stateCounty;
        }
        vCard += ';';

        const zipcodeSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'Zipcode'));
        const zipcode = valueToDisplay(zipcodeSme, 'en', firstLangStringSetText(zipcodeSme));
        if (zipcode.trim() !== '') {
            // vCard ADR; zip code
            vCard += zipcode;
        }
        vCard += ';';

        // vCard ADR; country
        const nationalCodeSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'NationalCode'));
        const nationalCode = valueToDisplay(nationalCodeSme, 'en', firstLangStringSetText(nationalCodeSme));
        const country = getCountryName(valueToDisplay(nationalCode));
        if (country.trim() !== '') {
            vCard += country;
        }
        vCard += '\n';

        const telephoneNumberSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'TelephoneNumber'));
        const telephoneNumber = valueToDisplay(telephoneNumberSme, 'en', firstLangStringSetText(telephoneNumberSme));
        if (telephoneNumber.trim() !== '') {
            vCard += 'TEL;TYPE=WORK,VOICE:' + telephoneNumber + '\n';
        }

        const faxNumberSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'FaxNumber'));
        const faxNumber = valueToDisplay(faxNumberSme, 'en', firstLangStringSetText(faxNumberSme));
        if (faxNumber.trim() !== '') {
            vCard += 'TEL;TYPE=WORK,FAX:' + faxNumber + '\n';
        }

        const emailAddressSme = contactInformationSmes.find((sme: any) => checkIdShort(sme, 'EmailAddress'));
        const emailAddress = valueToDisplay(emailAddressSme, 'en', firstLangStringSetText(emailAddressSme));
        if (emailAddress.trim() !== '') {
            vCard += 'EMAIL;TYPE=WORK:' + emailAddress + '\n';
        }

        const addressOfAdditionalLinkSme = contactInformationSmes.find((sme: any) =>
            checkIdShort(sme, 'AddressOfAdditionalLink')
        );
        const addressOfAdditionalLink = valueToDisplay(
            addressOfAdditionalLinkSme,
            'en',
            firstLangStringSetText(addressOfAdditionalLinkSme)
        );
        if (addressOfAdditionalLink.trim() !== '') {
            vCard += 'URL:' + addressOfAdditionalLink + '\n';
        }

        vCard += 'END:VCARD';

        // console.log('generateVCard()', 'vCard:', vCard);

        return vCard;
    }
</script>
