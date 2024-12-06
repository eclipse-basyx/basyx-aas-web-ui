<template>
    <v-container fluid class="pa-0">
        <!-- Header -->
        <v-card class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">
                    {{ visualizationTitle }}
                </div>
            </v-card-title>
            <v-card-text v-if="descriptionToDisplay(submodelElementData)" class="pt-0">
                {{ descriptionToDisplay(submodelElementData) }}
            </v-card-text>
        </v-card>
        <!-- Documents -->
        <v-card v-if="loading">
            <v-skeleton-loader type="list-item-avatar, divider, table-heading@8, actions"></v-skeleton-loader>
        </v-card>
        <v-expansion-panels v-else v-model="panel">
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
                                v-for="(generalProperty, index) in contact.generalProperties"
                                :key="generalProperty.idShort"
                                :class="index % 2 === 0 ? 'tableEven' : 'bg-tableOdd'">
                                <td>
                                    <div class="text-subtitleText text-caption">
                                        <span>{{ nameToDisplay(generalProperty) }}</span>
                                        <v-tooltip
                                            v-if="generalProperty.description && generalProperty.description.length > 0"
                                            activator="parent"
                                            open-delay="600"
                                            transition="slide-y-transition"
                                            max-width="360px"
                                            location="bottom">
                                            <div
                                                v-for="(description, i) in generalProperty.description"
                                                :key="i"
                                                class="text-caption">
                                                <span class="font-weight-bold">{{ description.language + ': ' }}</span
                                                >{{ description.text }}
                                            </div>
                                        </v-tooltip>
                                    </div>
                                </td>
                                <td>
                                    <!-- MultiLanguageProperties -->
                                    <template v-if="generalProperty.modelType == 'MultiLanguageProperty'">
                                        <v-list-item class="pl-0">
                                            <v-list-item-title class="text-caption">{{
                                                generalProperty.value[0].text
                                            }}</v-list-item-title>
                                        </v-list-item>
                                    </template>
                                    <!-- Default -->
                                    <span v-else class="text-caption">{{ generalProperty.value }}</span>
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
                            @click="downloadVCard(contact.vCard, 'ContactPerson.vcf')"
                            >{{ 'Download Contact' }}</v-btn
                        >
                    </v-card-actions>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'ContactInformation',
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                contactInformationData: {} as any,
                panel: 0 as number | null,
                contacts: [] as Array<any>,
                loading: false,
            };
        },

        computed: {
            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },

            visualizationTitle() {
                const visualizationTitle = this.nameToDisplay(this.submodelElementData);
                if ([this.submodelElementData.idShort, ''].includes(visualizationTitle)) return 'Contact Information';
                return visualizationTitle;
            },
        },

        mounted() {
            this.initContactInformation();
        },

        methods: {
            async initContactInformation() {
                this.loading = true;
                // console.log('Initialize Contact Information Plugin: ', this.submodelElementData);
                let submodelElementData = { ...this.submodelElementData };
                submodelElementData = await this.calculateSubmodelElementPathes(
                    submodelElementData,
                    this.SelectedNode.path
                );
                this.contactInformationData = submodelElementData;
                // create array of contacts
                let contacts = this.contactInformationData.submodelElements.filter((element: any) => {
                    return (
                        element.semanticId.keys[0].value ===
                        'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation'
                    );
                });
                contacts.forEach((contact: any) => {
                    contact.generalProperties = [] as Array<any>;
                    // create Contact Person Property
                    let nameParts = [];
                    // find property with the idShort "Title"
                    let title = contact.value.find((element: any) => this.checkIdShort(element, 'Title'));
                    if (title && title.value && title.value.length > 0) {
                        nameParts.push(title.value[0].text);
                    }
                    // find property with the idShort "FirstName"
                    let firstName = contact.value.find((element: any) => this.checkIdShort(element, 'FirstName'));
                    if (firstName && firstName.value && firstName.value.length > 0) {
                        nameParts.push(firstName.value[0].text);
                    }
                    // find property with the idShort "MiddleNames"
                    let middleNames = contact.value.find((element: any) => this.checkIdShort(element, 'MiddleNames'));
                    if (middleNames && middleNames.value && middleNames.value.length > 0) {
                        nameParts.push(middleNames.value[0].text);
                    }
                    // find property with the idShort "NameOfContact"
                    let nameOfContact = contact.value.find((element: any) =>
                        this.checkIdShort(element, 'NameOfContact')
                    );
                    if (nameOfContact && nameOfContact.value && nameOfContact.value.length > 0) {
                        nameParts.push(nameOfContact.value[0].text);
                    }
                    // join all name parts with a space
                    let name = nameParts.filter(Boolean).join(' ');
                    // find property with the idShort "AcademicTitle"
                    let academicTitle = contact.value.find((element: any) =>
                        this.checkIdShort(element, 'AcademicTitle')
                    );
                    if (academicTitle && academicTitle.value && academicTitle.value.length > 0) {
                        // add a comma before the academic title if the name is not empty
                        name += (name ? ', ' : '') + academicTitle.value[0].text;
                    }
                    // add Contact Person Property to the generalProperties
                    if (name.length > 0) {
                        contact.generalProperties.push({
                            idShort: 'ContactPerson',
                            value: name,
                            modelType: 'Property',
                        });
                    }
                    // find property with the idShort "Company" and add that element to the generalProperties
                    let company = contact.value.find((element: any) => this.checkIdShort(element, 'Company'));
                    if (company) {
                        contact.generalProperties.push(company);
                    }
                    // find property with the idShort "Department" and add that element to the generalProperties
                    let department = contact.value.find((element: any) => this.checkIdShort(element, 'Department'));
                    if (department) {
                        contact.generalProperties.push(department);
                    }
                    // find property with the idShort "RoleOfContactPerson" and add that element to the generalProperties
                    let roleOfContactPerson = contact.value.find((element: any) =>
                        this.checkIdShort(element, 'RoleOfContactPerson')
                    );
                    if (roleOfContactPerson) {
                        contact.generalProperties.push(this.translateRole(roleOfContactPerson));
                    }
                    // find property with the idShort "Language" and add that element to the generalProperties
                    let language = contact.value.find((element: any) => this.checkIdShort(element, 'Language'));
                    if (language) {
                        contact.generalProperties.push(language);
                    }
                    // find property with the idShort "Street" and add that element to the generalProperties
                    let street = contact.value.find((element: any) => this.checkIdShort(element, 'Street'));
                    if (street) {
                        contact.generalProperties.push(street);
                    }
                    let address = '';
                    // find property with the idShort "NationalCode"
                    let nationalCode = contact.value.find((element: any) => this.checkIdShort(element, 'NationalCode'));
                    if (nationalCode) {
                        address += nationalCode.value[0].text + ' ';
                    }
                    // find property with the idShort "Zipcode"
                    let zipcode = contact.value.find((element: any) => this.checkIdShort(element, 'Zipcode'));
                    if (zipcode) {
                        address += zipcode.value[0].text + ' ';
                    }
                    // find property with the idShort "City"
                    let cityTown = contact.value.find((element: any) => this.checkIdShort(element, 'CityTown'));
                    if (cityTown) {
                        address += cityTown.value[0].text;
                    }
                    // add Address Property to the generalProperties
                    if (address.length > 0) {
                        contact.generalProperties.push({ idShort: 'Address', value: address, modelType: 'String' });
                    }
                    // get the Phone Information
                    let phone = contact.value.find((element: any) => this.checkIdShort(element, 'Phone'));
                    if (phone) {
                        // find property with the idShort "TelephoneNumber" and add that element to the generalProperties
                        let telephoneNumber = phone.value.find((element: any) =>
                            this.checkIdShort(element, 'TelephoneNumber')
                        );
                        if (telephoneNumber) {
                            contact.generalProperties.push(telephoneNumber);
                        }
                    }
                    // get the Fax Information
                    let fax = contact.value.find((element: any) => this.checkIdShort(element, 'Fax'));
                    if (fax) {
                        // find property with the idShort "FaxNumber" and add that element to the generalProperties
                        let faxNumber = fax.value.find((element: any) => this.checkIdShort(element, 'FaxNumber'));
                        if (faxNumber) {
                            contact.generalProperties.push(faxNumber);
                        }
                    }
                    // get the Email Information
                    let email = contact.value.find((element: any) => this.checkIdShort(element, 'Email'));
                    if (email) {
                        // find property with the idShort "EmailAddress" and add that element to the generalProperties
                        let emailAddress = email.value.find((element: any) =>
                            this.checkIdShort(element, 'EmailAddress')
                        );
                        if (emailAddress) {
                            contact.generalProperties.push(emailAddress);
                        }
                    }
                    // find property with the idShort "AddressOfAdditionalLink" and add that element to the generalProperties
                    let addressOfAdditionalLink = contact.value.find((element: any) =>
                        this.checkIdShort(element, 'AddressOfAdditionalLink')
                    );
                    if (addressOfAdditionalLink) {
                        contact.generalProperties.push(addressOfAdditionalLink);
                    }
                    this.generateVCard(contact);
                });
                this.contacts = contacts;
                this.loading = false;
            },

            // Function to generate a vCard from the given contact
            generateVCard(contact: any) {
                let vCard = 'BEGIN:VCARD\n';
                vCard += 'VERSION:3.0\n';
                // add Contact Person Property to the vCard
                let contactPerson = contact.generalProperties.find((element: any) =>
                    this.checkIdShort(element, 'ContactPerson')
                );
                if (contactPerson) {
                    vCard += 'FN:' + contactPerson.value + '\n';
                }
                // add Company Property to the vCard
                let company = contact.generalProperties.find((element: any) => this.checkIdShort(element, 'Company'));
                if (company) {
                    vCard += 'ORG:' + company.value[0].text + '\n';
                }
                // add Department Property to the vCard
                let department = contact.generalProperties.find((element: any) =>
                    this.checkIdShort(element, 'Department')
                );
                if (department) {
                    vCard += 'TITLE:' + department.value[0].text + '\n';
                }
                // add RoleOfContactPerson Property to the vCard
                let roleOfContactPerson = contact.generalProperties.find((element: any) =>
                    this.checkIdShort(element, 'RoleOfContactPerson')
                );
                if (roleOfContactPerson) {
                    vCard += 'ROLE:' + roleOfContactPerson.value + '\n';
                }
                // add Language Property to the vCard
                let language = contact.generalProperties.find((element: any) => this.checkIdShort(element, 'Language'));
                if (language) {
                    vCard += 'LANG:' + language.value + '\n';
                }
                // add Address Property to the vCard
                let street = contact.generalProperties.find((element: any) => this.checkIdShort(element, 'Street'));
                let address = contact.generalProperties.find((element: any) => this.checkIdShort(element, 'Address'));
                if (address) {
                    vCard +=
                        'ADR;TYPE=WORK:;;' +
                        (street && street.value && street.value.length > 0 ? street.value[0].text + ' ' : '') +
                        address.value +
                        ';;;\n';
                }
                // get the Phone Information
                let phone = contact.value.find((element: any) => this.checkIdShort(element, 'Phone'));
                if (phone) {
                    // find property with the idShort "TelephoneNumber" and add that element to the vCard
                    let telephoneNumber = phone.value.find((element: any) =>
                        this.checkIdShort(element, 'TelephoneNumber')
                    );
                    if (telephoneNumber) {
                        vCard += 'TEL;TYPE=WORK,VOICE:' + telephoneNumber.value[0].text + '\n';
                    }
                }
                // get the Fax Information
                let fax = contact.value.find((element: any) => this.checkIdShort(element, 'Fax'));
                if (fax) {
                    // find property with the idShort "FaxNumber" and add that element to the vCard
                    let faxNumber = fax.value.find((element: any) => this.checkIdShort(element, 'FaxNumber'));
                    if (faxNumber) {
                        vCard += 'TEL;TYPE=WORK,FAX:' + faxNumber.value[0].text + '\n';
                    }
                }
                // get the Email Information
                let email = contact.value.find((element: any) => this.checkIdShort(element, 'Email'));
                if (email) {
                    // find property with the idShort "EmailAddress" and add that element to the vCard
                    let emailAddress = email.value.find((element: any) => this.checkIdShort(element, 'EmailAddress'));
                    if (emailAddress) {
                        vCard += 'EMAIL;TYPE=WORK:' + emailAddress.value + '\n';
                    }
                }
                // add AddressOfAdditionalLink Property to the vCard
                let addressOfAdditionalLink = contact.value.find((element: any) =>
                    this.checkIdShort(element, 'AddressOfAdditionalLink')
                );
                if (addressOfAdditionalLink) {
                    vCard += 'URL:' + addressOfAdditionalLink.value + '\n';
                }
                vCard += 'END:VCARD';
                // console.log('vCard: ', vCard);
                contact.vCard = vCard;
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

            // Function to translate the RoleOfContactPerson
            translateRole(role: any) {
                let translatedRole = { ...role };
                switch (role.value) {
                    case '0173-1#07-AAS927#001':
                        translatedRole.value = 'Administrativ Contact';
                        break;
                    case '0173-1#07-AAS928#001':
                        translatedRole.value = 'Commercial Contact';
                        break;
                    case '0173-1#07-AAS929#001':
                        translatedRole.value = 'Other Contact';
                        break;
                    case '0173-1#07-AAS930#001':
                        translatedRole.value = 'Hazardous Goods Contact';
                        break;
                    case '0173-1#07-AAS931#001':
                        translatedRole.value = 'Technical Contact';
                        break;
                    default:
                        break;
                }
                return translatedRole;
            },
        },
    });
</script>
