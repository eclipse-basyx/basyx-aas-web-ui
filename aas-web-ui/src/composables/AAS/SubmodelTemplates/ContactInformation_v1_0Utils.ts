import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
import { useSMHandling } from '@/composables/AAS/SMHandling';
import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
import { firstLangStringSetText } from '@/utils/AAS/SubmodelElements/MultiLanguagePropertyUtils';
import { getCountryName } from '@/utils/LocaleUtils';
import { firstLetterToLowerCase } from '@/utils/StringUtils';

export function useContactInformation_v1_0Utils() {
    const { getSmIdOfAasIdBySemanticId } = useAASHandling();
    const { fetchSmById } = useSMHandling();
    const { checkIdShort, getSubmodelElementByIdShort } = useReferableUtils();
    const { hasValue, valueToDisplay } = useSME();

    const { valueUrl } = useSMEFile();

    const semanticId = 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations';

    const semanticIdSMCContactInformation =
        'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation';

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

    const typesOfTelephone = [
        {
            valueId: '0173-1#07-AAS754#001',
            value: 'Office',
        },
        {
            valueId: '0173-1#07-AAS755#001',
            value: 'Office mobile',
        },
        {
            valueId: '0173-1#07-AAS756#001',
            value: 'Secretary',
        },
        {
            valueId: '0173-1#07-AAS757#001',
            value: 'Substitute',
        },
        {
            valueId: '0173-1#07-AAS758#001',
            value: 'Home',
        },
        {
            valueId: '0173-1#07-AAS759#001',
            value: 'Private mobile',
        },
    ];

    const typesOfFaxNumber = [
        {
            valueId: '0173-1#07-AAS754#001',
            value: 'Office',
        },
        {
            valueId: '0173-1#07-AAS756#001',
            value: 'Secretary',
        },
        {
            valueId: '0173-1#07-AAS758#001',
            value: 'Home',
        },
    ];

    const typesOfEmailAddress = [
        {
            valueId: '0173-1#07-AAS754#001',
            value: 'Office',
        },
        {
            valueId: '0173-1#07-AAS756#001',
            value: 'Secretary',
        },
        {
            valueId: '0173-1#07-AAS757#001',
            value: 'Substitute',
        },
        {
            valueId: '0173-1#07-AAS758#001',
            value: 'Home',
        },
    ];

    /**
     * Retrieves Technical Data Submodel (SM) of an Asset Administration Shell (AAS).
     *
     * @async
     * @param {string} aasId - The ID of the AAS to retrieve its Technical Data SM.
     * @param {boolean} withConceptDescriptions - Flag to specify if SM should be fetched with ConceptDescriptions (CDs)
     * @returns {string} A promise that resolves to a Technical Data SM.
     */
    async function getSm(aasId: string, withConceptDescriptions: boolean = false): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        aasId = aasId.trim();

        const smTechnicalDataId = await getSmIdOfAasIdBySemanticId(aasId, semanticId);
        const smTechnicalData = await fetchSmById(smTechnicalDataId, withConceptDescriptions);

        return smTechnicalData;
    }

    function getRoleOfContactPerson(valueId: string): string {
        // console.log('getRoleOfContactPerson()', 'valueId:', valueId);

        if (!valueId || valueId.trim() === '') return '';

        const foundRoleOfContactPerson = rolesOfContactPerson.find(
            (rolesOfContactPersonElement) => rolesOfContactPersonElement.valueId === valueId
        );
        if (foundRoleOfContactPerson) return foundRoleOfContactPerson.value;

        return valueId;
    }

    function getTypeOfTelephone(valueId: string): string {
        // console.log('getTypeOfTelephone()', 'valueId:', valueId);

        if (!valueId || valueId.trim() === '') return '';

        const foundTypeOfTelephone = typesOfTelephone.find(
            (typeOfTelephoneElement) => typeOfTelephoneElement.valueId === valueId
        );
        if (foundTypeOfTelephone) return foundTypeOfTelephone.value;

        return valueId;
    }

    function getTypeOfFaxNumber(valueId: string): string {
        // console.log('getTypeOfFaxNumber()', 'valueId:', valueId);

        if (!valueId || valueId.trim() === '') return '';

        const foundTypeOfFaxNumber = typesOfFaxNumber.find(
            (typeOfFaxNumberElement) => typeOfFaxNumberElement.valueId === valueId
        );
        if (foundTypeOfFaxNumber) return foundTypeOfFaxNumber.value;

        return valueId;
    }

    function getTypeOfEmailAddress(valueId: string): string {
        // console.log('getTypeOfEmailAddress()', 'valueId:', valueId);

        if (!valueId || valueId.trim() === '') return '';

        const foundTypeOfEmailAddress = typesOfEmailAddress.find(
            (typeOfEmailAddressElement) => typeOfEmailAddressElement.valueId === valueId
        );
        if (foundTypeOfEmailAddress) return foundTypeOfEmailAddress.value;

        return valueId;
    }

    function determineContactName(contactInformationSMC: any): string {
        // console.log('determineContactName()', 'contactInformationSMC:', contactInformationSMC);

        const nameTemplate = (
            title: string,
            firstName: string,
            middleNames: string,
            nameOfContact: string,
            academicTitle: string
        ) => {
            const nameParts: string[] = [];

            if (title && title.trim() !== '') nameParts.push(title);
            if (firstName && firstName.trim() !== '') nameParts.push(firstName);
            if (middleNames && middleNames.trim() !== '') nameParts.push(middleNames);
            if (nameOfContact && nameOfContact.trim() !== '') nameParts.push(nameOfContact);

            let name = nameParts.filter(Boolean).join(' ');

            if (academicTitle && academicTitle.trim() !== '') name += (name ? ', ' : '') + academicTitle;

            return name;
        };

        const nameIdShorts = ['NameOfContact', 'FirstName', 'MiddleNames', 'Title', 'AcademicTitle'];
        const nameValues = {} as any;

        contactInformationSMC.value.forEach((sme: any) => {
            nameIdShorts.forEach((idShort: any) => {
                if (checkIdShort(sme, idShort) && hasValue(sme)) {
                    const value = valueToDisplay(sme, 'en', firstLangStringSetText(sme));
                    nameValues[firstLetterToLowerCase(idShort)] = value;
                }
            });
        });

        return nameTemplate(
            nameValues?.title,
            nameValues?.firstName,
            nameValues?.middleNames,
            nameValues?.nameOfContact,
            nameValues?.academicTitle
        );
    }

    function determineAddress(contactInformationSMC: any): string {
        const addressTemplate = (
            street: string,
            zipcode: string,
            cityTown: string,
            stateCounty: string,
            country: string,
            poBox: string,
            zipCodeOfPOBox: string
        ) => {
            const addressParts: string[] = [];

            if (street && street.trim() !== '') {
                addressParts.push(street);
            } else if (poBox && poBox.trim() !== '') {
                addressParts.push(poBox);
            }

            if (zipcode && zipcode.trim() !== '' && cityTown && cityTown.trim() !== '') {
                addressParts.push(zipcode + ' ' + cityTown);
            } else if (zipCodeOfPOBox && zipCodeOfPOBox.trim() !== '' && cityTown && cityTown.trim() !== '') {
                addressParts.push(zipCodeOfPOBox + ' ' + cityTown);
            } else if (zipcode && zipcode.trim() !== '') {
                addressParts.push(zipcode);
            } else if (zipCodeOfPOBox && zipCodeOfPOBox.trim() !== '') {
                addressParts.push(zipCodeOfPOBox);
            } else if (cityTown && cityTown.trim() !== '') {
                addressParts.push(cityTown);
            }

            if (stateCounty && stateCounty.trim() !== '') addressParts.push(stateCounty);

            if (country && country.trim() !== '') addressParts.push(country);

            const address = addressParts.filter(Boolean).join(', ');

            return address;
        };

        const addressIdShorts = [
            'Street',
            'Zipcode',
            'CityTown',
            'StateCounty',
            'NationalCode',
            'POBox',
            'ZipCodeOfPOBox',
            'Country',
        ];
        const addressValues = {} as any;

        contactInformationSMC.value.forEach((sme: any) => {
            addressIdShorts.forEach((idShort: any) => {
                if (checkIdShort(sme, idShort) && hasValue(sme)) {
                    const value = valueToDisplay(sme, 'en', firstLangStringSetText(sme));
                    addressValues[firstLetterToLowerCase(idShort)] = value;
                }
            });
        });

        return addressTemplate(
            addressValues?.street,
            addressValues?.zipcode,
            addressValues?.cityTown,
            addressValues?.stateCounty,
            getCountryName(addressValues?.nationalCode)
                ? getCountryName(addressValues?.nationalCode)
                : addressValues?.country,
            addressValues?.pOBox,
            addressValues?.zipCodeOfPOBox
        );
    }

    function generateVCard(contactInformationSMC: any, companyNameProperty?: any, logoFile?: any): string {
        // console.log('generateVCard()', 'contactInformationSMC:', contactInformationSMC);

        const vCardTemplate = (
            contactPerson: string,
            surname: string,
            firstName: string,
            middleNames: string,
            prefixName: string,
            suffixName: string,
            company: string,
            department: string,
            roleOfContactPerson: string,
            language: string,
            addressOfAdditionalLink: string,
            street: string,
            zipcode: string,
            cityTown: string,
            stateCounty: string,
            nationalCode: string,
            country: string,
            poBox: string,
            zipCodeOfPOBox: string,
            telephoneNumber: string,
            faxNumber: string,
            emailAddress: string
        ) => {
            const vCardParts: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

            const vCardNameTemplate = (
                surname: string,
                firstName: string,
                middleNames: string,
                prefix: string,
                suffix: string
            ) => {
                // ADR;TYPE=home:;;123 Main St.;Springfield;IL;12345;USA
                const vCardNameParts: string[] = [];

                if (surname && surname.trim() !== '') {
                    vCardNameParts.push(surname);
                } else {
                    vCardNameParts.push('');
                }

                if (firstName && firstName.trim() !== '') {
                    vCardNameParts.push(firstName);
                } else {
                    vCardNameParts.push('');
                }

                if (middleNames && middleNames.trim() !== '') {
                    vCardNameParts.push(middleNames);
                } else {
                    vCardNameParts.push('');
                }

                if (prefix && prefix.trim() !== '') {
                    vCardNameParts.push(prefix);
                } else {
                    vCardNameParts.push('');
                }

                if (suffix && suffix.trim() !== '') {
                    vCardNameParts.push(suffix);
                } else {
                    vCardNameParts.push('');
                }

                return vCardNameParts.join(';');
            };
            const name = vCardNameTemplate(surname, firstName, middleNames, prefixName, suffixName);
            if (name && name.trim() !== '') vCardParts.push('N:' + name);

            if (contactPerson && contactPerson.trim() !== '') vCardParts.push('FN:' + contactPerson);
            if (company && company.trim() !== '') {
                // Note, that "FN:" is a mandatory field for vCard v3.0
                if (!contactPerson || contactPerson.trim() === '') {
                    vCardParts.push('FN:' + company);
                } else {
                    vCardParts.push('ORG:' + company);
                }
            }
            if (department && department.trim() !== '') vCardParts.push('TITLE:' + department);
            if (roleOfContactPerson && roleOfContactPerson.trim() !== '')
                vCardParts.push('ROLE:' + roleOfContactPerson);
            if (language && language.trim() !== '') vCardParts.push('LANG:' + language);
            if (addressOfAdditionalLink && addressOfAdditionalLink.trim() !== '')
                vCardParts.push('URL:' + addressOfAdditionalLink);

            const vCardAddressTemplate = (
                street: string,
                zipcode: string,
                cityTown: string,
                stateCounty: string,
                country: string,
                poBox: string,
                zipCodeOfPOBox: string
            ) => {
                // ADR;TYPE=home:;;123 Main St.;Springfield;IL;12345;USA
                const vCardAddressParts: string[] = [];

                if (street && street.trim() !== '') {
                    vCardAddressParts.push(street);
                } else if (poBox && poBox.trim() !== '') {
                    vCardAddressParts.push(poBox);
                } else {
                    vCardAddressParts.push('');
                }

                if (cityTown && cityTown.trim() !== '') {
                    vCardAddressParts.push(cityTown);
                } else {
                    vCardAddressParts.push('');
                }

                if (stateCounty && stateCounty.trim() !== '') {
                    vCardAddressParts.push(stateCounty);
                } else {
                    vCardAddressParts.push('');
                }

                if (zipcode && zipcode.trim() !== '') {
                    vCardAddressParts.push(zipcode);
                } else if (zipCodeOfPOBox && zipCodeOfPOBox.trim() !== '') {
                    vCardAddressParts.push(zipCodeOfPOBox);
                } else {
                    vCardAddressParts.push('');
                }

                if (country && country.trim() !== '') {
                    vCardAddressParts.push(country);
                } else {
                    vCardAddressParts.push('');
                }

                return vCardAddressParts.join(';');
            };
            const address = vCardAddressTemplate(
                street,
                zipcode,
                cityTown,
                stateCounty,
                country,
                poBox,
                zipCodeOfPOBox
            );
            if (address && address.trim() !== '') vCardParts.push('ADR;TYPE=WORK:;;' + address);

            // const companyLogoSme = contactInformationSMC.value.find((sme: any) => checkIdShort(sme, 'CompanyLogo'));
            if (
                logoFile &&
                Object.keys(logoFile).length > 0 &&
                logoFile?.contentType &&
                logoFile?.contentType.trim() !== '' &&
                logoFile?.value &&
                logoFile?.value.trim() !== '' &&
                valueUrl(logoFile)
            ) {
                vCardParts.push('PHOTO;MEDIATYPE=' + logoFile.contentType + ':' + valueUrl(logoFile));
            }

            if (telephoneNumber && telephoneNumber.trim() !== '')
                vCardParts.push('TEL;TYPE=WORK,VOICE:' + telephoneNumber);
            if (faxNumber && faxNumber.trim() !== '') vCardParts.push('TEL;TYPE=WORK,FAX:' + faxNumber);
            if (emailAddress && emailAddress.trim() !== '') vCardParts.push('EMAIL;TYPE=WORK:' + emailAddress);

            vCardParts.push('END:VCARD');

            return vCardParts.filter(Boolean).join('\n');
        };

        const vCardIdShorts = [
            'ContactPerson',
            'NameOfContact',
            'FirstName',
            'MiddleNames',
            'Title',
            'AcademicTitle',
            'Company',
            'Department',
            'RoleOfContactPerson',
            'Language',
            'AddressOfAdditionalLink',
            'Street',
            'Zipcode',
            'CityTown',
            'StateCounty',
            'NationalCode',
            'POBox',
            'ZipCodeOfPOBox',
            'Phone',
            'Fax',
            'Email',
        ];
        const vCardValues = {} as any;

        contactInformationSMC.value.forEach((sme: any) => {
            vCardIdShorts.forEach((idShort: any) => {
                if (checkIdShort(sme, idShort) && hasValue(sme)) {
                    switch (idShort) {
                        case 'RoleOfContactPerson': {
                            const value = getRoleOfContactPerson(
                                valueToDisplay(sme, 'en', firstLangStringSetText(sme))
                            );
                            vCardValues[firstLetterToLowerCase(idShort)] = value;
                            break;
                        }

                        case 'Phone': {
                            const telephoneNumberMLP = getSubmodelElementByIdShort('TelephoneNumber', sme);
                            if (hasValue(telephoneNumberMLP)) {
                                vCardValues['telephoneNumber'] = valueToDisplay(
                                    telephoneNumberMLP,
                                    'en',
                                    firstLangStringSetText(telephoneNumberMLP)
                                );
                            }
                            break;
                        }

                        case 'Fax': {
                            const faxNumberMLP = getSubmodelElementByIdShort('FaxNumber', sme);
                            if (hasValue(faxNumberMLP)) {
                                vCardValues['faxNumber'] = valueToDisplay(
                                    faxNumberMLP,
                                    'en',
                                    firstLangStringSetText(faxNumberMLP)
                                );
                            }
                            break;
                        }

                        case 'Email': {
                            const emailAddressMLP = getSubmodelElementByIdShort('EmailAddress', sme);
                            if (hasValue(emailAddressMLP)) {
                                vCardValues['emailAddress'] = valueToDisplay(
                                    emailAddressMLP,
                                    'en',
                                    firstLangStringSetText(emailAddressMLP)
                                );
                            }
                            break;
                        }

                        default: {
                            const value = valueToDisplay(sme, 'en', firstLangStringSetText(sme));
                            vCardValues[firstLetterToLowerCase(idShort)] = value;
                            break;
                        }
                    }
                }
            });
        });

        return vCardTemplate(
            vCardValues?.contactPerson,
            vCardValues?.firstName,
            vCardValues?.nameOfContact,
            vCardValues?.middleNames,
            vCardValues?.title,
            vCardValues?.academicTitle,
            vCardValues?.company
                ? vCardValues?.company
                : valueToDisplay(companyNameProperty, 'en', firstLangStringSetText(companyNameProperty)),
            vCardValues?.department,
            vCardValues?.roleOfContactPerson,
            vCardValues?.language,
            vCardValues?.addressOfAdditionalLink,
            vCardValues?.street,
            vCardValues?.zipcode,
            vCardValues?.cityTown,
            vCardValues?.stateCounty,
            vCardValues?.nationalCode,
            getCountryName(vCardValues?.nationalCode),
            vCardValues?.pOBox,
            vCardValues?.zipCodeOfPOBox,
            vCardValues?.telephoneNumber,
            vCardValues?.faxNumber,
            vCardValues?.emailAddress
        );
    }

    return {
        semanticId,
        semanticIdSMCContactInformation,
        determineAddress,
        determineContactName,
        generateVCard,
        getRoleOfContactPerson,
        getTypeOfEmailAddress,
        getTypeOfFaxNumber,
        getTypeOfTelephone,
        getSm,
        rolesOfContactPerson,
        typesOfEmailAddress,
        typesOfFaxNumber,
        typesOfTelephone,
    };
}
