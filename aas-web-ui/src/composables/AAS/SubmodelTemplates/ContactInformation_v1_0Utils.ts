import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'
import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement'
import { firstLangStringSetText } from '@/utils/AAS/SubmodelElements/MultiLanguagePropertyUtils'
import { getCountryName } from '@/utils/LocaleUtils'
import { firstLetterToLowerCase } from '@/utils/StringUtils'

export function useContactInformation_v1_0Utils () {
  // Composables
  const { checkIdShort, getSubmodelElementByIdShort } = useReferableUtils()
  const { hasValue, valueToDisplay } = useSME()
  const { valueUrl } = useSMEFile()

  const semanticId = 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations'

  const semanticIdSMCContactInformation
    = 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation'

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
  ]

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
  ]

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
  ]

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
  ]

  function getRoleOfContactPerson (valueId: string): string {
    // console.log('getRoleOfContactPerson()', 'valueId:', valueId);

    if (!valueId || valueId.trim() === '') {
      return ''
    }

    const foundRoleOfContactPerson = rolesOfContactPerson.find(
      rolesOfContactPersonElement => rolesOfContactPersonElement.valueId === valueId,
    )
    if (foundRoleOfContactPerson) {
      return foundRoleOfContactPerson.value
    }

    return valueId
  }

  function getTypeOfTelephone (valueId: string): string {
    // console.log('getTypeOfTelephone()', 'valueId:', valueId);

    if (!valueId || valueId.trim() === '') {
      return ''
    }

    const foundTypeOfTelephone = typesOfTelephone.find(
      typeOfTelephoneElement => typeOfTelephoneElement.valueId === valueId,
    )
    if (foundTypeOfTelephone) {
      return foundTypeOfTelephone.value
    }

    return valueId
  }

  function getTypeOfFaxNumber (valueId: string): string {
    // console.log('getTypeOfFaxNumber()', 'valueId:', valueId);

    if (!valueId || valueId.trim() === '') {
      return ''
    }

    const foundTypeOfFaxNumber = typesOfFaxNumber.find(
      typeOfFaxNumberElement => typeOfFaxNumberElement.valueId === valueId,
    )
    if (foundTypeOfFaxNumber) {
      return foundTypeOfFaxNumber.value
    }

    return valueId
  }

  function getTypeOfEmailAddress (valueId: string): string {
    // console.log('getTypeOfEmailAddress()', 'valueId:', valueId);

    if (!valueId || valueId.trim() === '') {
      return ''
    }

    const foundTypeOfEmailAddress = typesOfEmailAddress.find(
      typeOfEmailAddressElement => typeOfEmailAddressElement.valueId === valueId,
    )
    if (foundTypeOfEmailAddress) {
      return foundTypeOfEmailAddress.value
    }

    return valueId
  }

  function determineContactName (contactInformationSMC: any): string {
    // console.log('determineContactName()', 'contactInformationSMC:', contactInformationSMC);

    const nameTemplate = (
      title: string,
      firstName: string,
      middleNames: string,
      nameOfContact: string,
      academicTitle: string,
    ) => {
      const nameParts: string[] = []

      if (title && title.trim() !== '') {
        nameParts.push(title)
      }
      if (firstName && firstName.trim() !== '') {
        nameParts.push(firstName)
      }
      if (middleNames && middleNames.trim() !== '') {
        nameParts.push(middleNames)
      }
      if (nameOfContact && nameOfContact.trim() !== '') {
        nameParts.push(nameOfContact)
      }

      let name = nameParts.filter(Boolean).join(' ')

      if (academicTitle && academicTitle.trim() !== '') {
        name += (name ? ', ' : '') + academicTitle
      }

      return name
    }

    const nameIdShorts = ['NameOfContact', 'FirstName', 'MiddleNames', 'Title', 'AcademicTitle']
    const nameValues = {} as any

    for (const sme of contactInformationSMC.value) {
      for (const idShort of nameIdShorts) {
        if (checkIdShort(sme, idShort) && hasValue(sme)) {
          const value = valueToDisplay(sme, 'en', firstLangStringSetText(sme))
          nameValues[firstLetterToLowerCase(idShort)] = value
        }
      }
    }

    return nameTemplate(
      nameValues?.title,
      nameValues?.firstName,
      nameValues?.middleNames,
      nameValues?.nameOfContact,
      nameValues?.academicTitle,
    )
  }

  function determineAddress (contactInformationSMC: any): string {
    const addressTemplate = (
      street: string,
      zipcode: string,
      cityTown: string,
      stateCounty: string,
      country: string,
      poBox: string,
      zipCodeOfPOBox: string,
    ) => {
      const addressParts: string[] = []

      if (street && street.trim() !== '') {
        addressParts.push(street)
      } else if (poBox && poBox.trim() !== '') {
        addressParts.push(poBox)
      }

      if (zipcode && zipcode.trim() !== '' && cityTown && cityTown.trim() !== '') {
        addressParts.push(zipcode + ' ' + cityTown)
      } else if (zipCodeOfPOBox && zipCodeOfPOBox.trim() !== '' && cityTown && cityTown.trim() !== '') {
        addressParts.push(zipCodeOfPOBox + ' ' + cityTown)
      } else if (zipcode && zipcode.trim() !== '') {
        addressParts.push(zipcode)
      } else if (zipCodeOfPOBox && zipCodeOfPOBox.trim() !== '') {
        addressParts.push(zipCodeOfPOBox)
      } else if (cityTown && cityTown.trim() !== '') {
        addressParts.push(cityTown)
      }

      if (stateCounty && stateCounty.trim() !== '') {
        addressParts.push(stateCounty)
      }

      if (country && country.trim() !== '') {
        addressParts.push(country)
      }

      const address = addressParts.filter(Boolean).join(', ')

      return address
    }

    const addressIdShorts = [
      'Street',
      'Zipcode',
      'CityTown',
      'StateCounty',
      'NationalCode',
      'POBox',
      'ZipCodeOfPOBox',
      'Country',
    ]
    const addressValues = {} as any

    if (!contactInformationSMC || !contactInformationSMC.value || contactInformationSMC.value.length === 0) {
      return ''
    }

    for (const sme of contactInformationSMC.value) {
      for (const idShort of addressIdShorts) {
        if (checkIdShort(sme, idShort) && hasValue(sme)) {
          const value = valueToDisplay(sme, 'en', firstLangStringSetText(sme))
          addressValues[firstLetterToLowerCase(idShort)] = value
        }
      }
    }

    const countryName = getCountryName(addressValues?.nationalCode)

    return addressTemplate(
      addressValues?.street,
      addressValues?.zipcode,
      addressValues?.cityTown,
      addressValues?.stateCounty,
      countryName || addressValues?.country,
      addressValues?.pOBox,
      addressValues?.zipCodeOfPOBox,
    )
  }

  function generateVCard (contactInformationSMC: any, companyNameProperty?: any, logoFile?: any): string {
    // console.log('generateVCard()', 'contactInformationSMC:', contactInformationSMC);

    const assignVCardValue = (vCardValues: any, idShort: string, sme: any): void => {
      switch (idShort) {
        case 'RoleOfContactPerson': {
          const value = getRoleOfContactPerson(
            valueToDisplay(sme, 'en', firstLangStringSetText(sme)),
          )
          vCardValues[firstLetterToLowerCase(idShort)] = value
          break
        }

        case 'Phone': {
          const telephoneNumberMLP = getSubmodelElementByIdShort('TelephoneNumber', sme)
          if (hasValue(telephoneNumberMLP)) {
            vCardValues.telephoneNumber = valueToDisplay(
              telephoneNumberMLP,
              'en',
              firstLangStringSetText(telephoneNumberMLP),
            )
          }
          break
        }

        case 'Fax': {
          const faxNumberMLP = getSubmodelElementByIdShort('FaxNumber', sme)
          if (hasValue(faxNumberMLP)) {
            vCardValues.faxNumber = valueToDisplay(
              faxNumberMLP,
              'en',
              firstLangStringSetText(faxNumberMLP),
            )
          }
          break
        }

        case 'Email': {
          const emailAddressMLP = getSubmodelElementByIdShort('EmailAddress', sme)
          if (hasValue(emailAddressMLP)) {
            vCardValues.emailAddress = valueToDisplay(
              emailAddressMLP,
              'en',
              firstLangStringSetText(emailAddressMLP),
            )
          }
          break
        }

        default: {
          const value = valueToDisplay(sme, 'en', firstLangStringSetText(sme))
          vCardValues[firstLetterToLowerCase(idShort)] = value
        }
      }
    }

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
      emailAddress: string,
    ) => {
      const normalize = (value: string): string => {
        return value && value.trim() !== '' ? value : ''
      }

      const addField = (parts: string[], field: string, value: string): void => {
        const normalizedValue = normalize(value)
        if (normalizedValue !== '') {
          parts.push(`${field}${normalizedValue}`)
        }
      }

      const vCardParts: string[] = ['BEGIN:VCARD', 'VERSION:3.0']

      const vCardNameTemplate = (
        surname: string,
        firstName: string,
        middleNames: string,
        prefix: string,
        suffix: string,
      ) => {
        return [surname, firstName, middleNames, prefix, suffix].map(part => normalize(part)).join(';')
      }
      const name = vCardNameTemplate(surname, firstName, middleNames, prefixName, suffixName)
      addField(vCardParts, 'N:', name)

      const normalizedContactPerson = normalize(contactPerson)
      const normalizedCompany = normalize(company)

      addField(vCardParts, 'FN:', normalizedContactPerson)
      if (normalizedCompany !== '') {
        // Note, that "FN:" is a mandatory field for vCard v3.0
        if (normalizedContactPerson === '') {
          vCardParts.push('FN:' + normalizedCompany)
        } else {
          vCardParts.push('ORG:' + normalizedCompany)
        }
      }
      addField(vCardParts, 'TITLE:', department)
      addField(vCardParts, 'ROLE:', roleOfContactPerson)
      addField(vCardParts, 'LANG:', language)
      addField(vCardParts, 'URL:', addressOfAdditionalLink)

      const vCardAddressTemplate = (
        street: string,
        zipcode: string,
        cityTown: string,
        stateCounty: string,
        country: string,
        poBox: string,
        zipCodeOfPOBox: string,
      ) => {
        const primaryStreet = normalize(street) || normalize(poBox)
        const postalCode = normalize(zipcode) || normalize(zipCodeOfPOBox)
        return [primaryStreet, normalize(cityTown), normalize(stateCounty), postalCode, normalize(country)].join(';')
      }
      const address = vCardAddressTemplate(
        street,
        zipcode,
        cityTown,
        stateCounty,
        country,
        poBox,
        zipCodeOfPOBox,
      )
      if (address && address.trim() !== '') {
        vCardParts.push('ADR;TYPE=WORK:;;' + address)
      }

      // const companyLogoSme = contactInformationSMC.value.find((sme: any) => checkIdShort(sme, 'CompanyLogo'));
      if (
        logoFile
        && Object.keys(logoFile).length > 0
        && logoFile?.contentType
        && logoFile?.contentType.trim() !== ''
        && logoFile?.value
        && logoFile?.value.trim() !== ''
        && valueUrl(logoFile)
      ) {
        vCardParts.push('PHOTO;MEDIATYPE=' + logoFile.contentType + ':' + valueUrl(logoFile))
      }

      addField(vCardParts, 'TEL;TYPE=WORK,VOICE:', telephoneNumber)
      addField(vCardParts, 'TEL;TYPE=WORK,FAX:', faxNumber)
      addField(vCardParts, 'EMAIL;TYPE=WORK:', emailAddress)

      vCardParts.push('END:VCARD')

      return vCardParts.filter(Boolean).join('\n')
    }

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
    ]
    const vCardValues = {} as any

    for (const sme of contactInformationSMC.value) {
      for (const idShort of vCardIdShorts) {
        if (checkIdShort(sme, idShort) && hasValue(sme)) {
          assignVCardValue(vCardValues, idShort, sme)
        }
      }
    }

    return vCardTemplate(
      vCardValues?.contactPerson,
      vCardValues?.firstName,
      vCardValues?.nameOfContact,
      vCardValues?.middleNames,
      vCardValues?.title,
      vCardValues?.academicTitle,
      vCardValues?.company || valueToDisplay(companyNameProperty, 'en', firstLangStringSetText(companyNameProperty)),
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
      vCardValues?.emailAddress,
    )
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
    rolesOfContactPerson,
    typesOfEmailAddress,
    typesOfFaxNumber,
    typesOfTelephone,
  }
}
