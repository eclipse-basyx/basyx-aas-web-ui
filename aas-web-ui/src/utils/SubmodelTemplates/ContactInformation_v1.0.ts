import { getCountryName } from '@/utils/generalUtils';
import { checkIdShort } from '@/utils/ReferableUtils';
import { firstCharToLowerCase } from '@/utils/StringUtils';
import { valueUrl } from '@/utils/SubmodelElements/FileUtils';
import { firstLangStringSetText } from '@/utils/SubmodelElements/MultiLanguagePropertyUtils';
import { hasValue, valueToDisplay } from '@/utils/SubmodelElements/SubmodelElementUtils';

export const rolesOfContactPerson = [
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

export function getRoleOfContactPerson(valueId: string): string {
    // console.log('getRoleOfContactPerson()', 'valueId:', valueId);

    if (!valueId || valueId.trim() === '') return '';

    const foundRoleOfContactPerson = rolesOfContactPerson.find(
        (rolesOfContactPersonElement) => rolesOfContactPersonElement.valueId === valueId
    );
    if (foundRoleOfContactPerson) return foundRoleOfContactPerson.value;

    return valueId;
}

export function getTypeOfTelephone(valueId: string): string {
    // console.log('getTypeOfTelephone()', 'valueId:', valueId);

    if (!valueId || valueId.trim() === '') return '';

    const foundTypeOfTelephone = typesOfTelephone.find(
        (typeOfTelephoneElement) => typeOfTelephoneElement.valueId === valueId
    );
    if (foundTypeOfTelephone) return foundTypeOfTelephone.value;

    return valueId;
}

export function getTypeOfFaxNumber(valueId: string): string {
    // console.log('getTypeOfFaxNumber()', 'valueId:', valueId);

    if (!valueId || valueId.trim() === '') return '';

    const foundTypeOfFaxNumber = typesOfFaxNumber.find(
        (typeOfFaxNumberElement) => typeOfFaxNumberElement.valueId === valueId
    );
    if (foundTypeOfFaxNumber) return foundTypeOfFaxNumber.value;

    return valueId;
}

export function getTypeOfEmailAddress(valueId: string): string {
    // console.log('getTypeOfEmailAddress()', 'valueId:', valueId);

    if (!valueId || valueId.trim() === '') return '';

    const foundTypeOfEmailAddress = typesOfEmailAddress.find(
        (typeOfEmailAddressElement) => typeOfEmailAddressElement.valueId === valueId
    );
    if (foundTypeOfEmailAddress) return foundTypeOfEmailAddress.value;

    return valueId;
}

export function determineContactName(contactInformationSMC: any): string {
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
                nameValues[firstCharToLowerCase(idShort)] = value;
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

export function determineAddress(contactInformationSMC: any): string {
    // console.log('determineAddress()', 'contactInformationSMC:', contactInformationSMC);

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

    const addressIdShorts = ['Street', 'Zipcode', 'CityTown', 'StateCounty', 'NationalCode', 'POBox', 'ZipCodeOfPOBox'];
    const addressValues = {} as any;

    contactInformationSMC.value.forEach((sme: any) => {
        addressIdShorts.forEach((idShort: any) => {
            if (checkIdShort(sme, idShort) && hasValue(sme)) {
                const value = valueToDisplay(sme, 'en', firstLangStringSetText(sme));
                addressValues[firstCharToLowerCase(idShort)] = value;
            }
        });
    });

    return addressTemplate(
        addressValues?.street,
        addressValues?.zipcode,
        addressValues?.cityTown,
        addressValues?.stateCounty,
        getCountryName(addressValues?.nationalCode),
        addressValues?.pOBox,
        addressValues?.zipCodeOfPOBox
    );
}

export function generateVCard(contactInformationSMC: any, companyNameProperty?: any, logoFile?: any): string {
    // console.log('generateVCard()', 'contactInformationSMC:', contactInformationSMC);

    const vCardTemplate = (
        contactPerson: string,
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
        if (roleOfContactPerson && roleOfContactPerson.trim() !== '') vCardParts.push('ROLE:' + roleOfContactPerson);
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
        const address = vCardAddressTemplate(street, zipcode, cityTown, stateCounty, country, poBox, zipCodeOfPOBox);
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

        if (telephoneNumber && telephoneNumber.trim() !== '') vCardParts.push('TEL;TYPE=WORK,VOICE:' + telephoneNumber);
        if (faxNumber && faxNumber.trim() !== '') vCardParts.push('TEL;TYPE=WORK,FAX:' + faxNumber);
        if (emailAddress && emailAddress.trim() !== '') vCardParts.push('EMAIL;TYPE=WORK:' + emailAddress);

        vCardParts.push('END:VCARD');

        return vCardParts.filter(Boolean).join('\n');
    };

    const vCardIdShorts = [
        'ContactPerson',
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
                        const value = getRoleOfContactPerson(valueToDisplay(sme, 'en', firstLangStringSetText(sme)));
                        vCardValues[firstCharToLowerCase(idShort)] = value;
                        break;
                    }

                    case 'Phone': {
                        const telephoneNumber = sme.value.find((sme: any) => checkIdShort(sme, 'TelephoneNumber'));
                        if (
                            telephoneNumber &&
                            Object.keys(telephoneNumber).length > 0 &&
                            valueToDisplay(telephoneNumber)
                        ) {
                            vCardValues['telephoneNumber'] = valueToDisplay(telephoneNumber);
                        }
                        break;
                    }

                    case 'Fax': {
                        const faxNumber = sme.value.find((sme: any) => checkIdShort(sme, 'FaxNumber'));
                        if (faxNumber && Object.keys(faxNumber).length > 0 && valueToDisplay(faxNumber)) {
                            vCardValues['faxNumber'] = valueToDisplay(faxNumber);
                        }
                        break;
                    }

                    case 'Email': {
                        const emailAddress = sme.value.find((sme: any) => checkIdShort(sme, 'EmailAddress'));
                        if (emailAddress && Object.keys(emailAddress).length > 0 && valueToDisplay(emailAddress)) {
                            vCardValues['emailAddress'] = valueToDisplay(emailAddress);
                        }
                        break;
                    }

                    default: {
                        const value = valueToDisplay(sme, 'en', firstLangStringSetText(sme));
                        vCardValues[firstCharToLowerCase(idShort)] = value;
                        break;
                    }
                }
            }
        });
    });

    return vCardTemplate(
        vCardValues?.contactPerson,
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
