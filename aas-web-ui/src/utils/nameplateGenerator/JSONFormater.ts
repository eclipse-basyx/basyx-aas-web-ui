function getFromSMs(sms: Object[], key: string): string {
    for (const sm of sms) {
        if(sm.modelType === 'Property' && sm.idShort === key){
            return getPropertyValue(sm, key)
        } else if (sm.modelType === 'MultiLanguageProperty' && sm['idShort'] === key) {
            return getMLPropertyValue(sm, key)
        } else if (sm.modelType === 'SubmodelElementCollection') {
            const result = getFromSMs(sm.value, key)
            if (result !== "-") {
                return result
            }
        }
    }
    return "-"
}

function getPropertyValue(sm: Object, key: string): string{
    return sm.value;
}

function getMLPropertyValue(sm: Object, key: string): string{
    return sm['value'][0]['text']
}

function getId(obj: Object): string{
    return obj.id
}
//function getValue2Key(){}

export default function formatJSON(json: any): any {
    console.log('JSONF: ', json);
    let js = {
    idShort: "-",
    id: getFromSMs(json['submodelElements'], 'URIOfTheProduct') || '-',
    num: "-",
    productImages: [],
    Nameplate: {
      idShort: "Nameplate",
      id: getId(json) || '-',
      semanticId: "-",
      ManufacturerName: getFromSMs(json['submodelElements'], 'ManufacturerName') || '-',
      ManufacturerProductDesignation: getFromSMs(json['submodelElements'], 'ManufacturerProductDesignation') || '-',
      PhysicalAddress: {
        CountryCode: getFromSMs(json['submodelElements'], 'NationalCode') || '-',
        Street: getFromSMs(json['submodelElements'], 'Street') || '-',
        Zip: getFromSMs(json['submodelElements'], 'Zipcode') || '-',
        CityTown: getFromSMs(json['submodelElements'], 'CityTown') || '-',
        StateCounty: getFromSMs(json['submodelElements'], 'StateCounty') || '-'
      },
      ManufacturerProductFamily: getFromSMs(json['submodelElements'], 'ManufacturerProductFamily') || '-',
      SerialNumber: getFromSMs(json['submodelElements'], 'SerialNumber') || '-',
      BatchNumber: getFromSMs(json['submodelElements'], 'BatchNumber') || '-',
      ProductCountryOfOrigin: getFromSMs(json['submodelElements'], 'CountryOfOrigin') || '-',
      YearOfConstruction: getFromSMs(json['submodelElements'], 'DateOfManufacture') || '-',
      Email: getFromSMs(json['submodelElements'], 'EmailAddress') || '-',
      Tel: getFromSMs(json['submodelElements'], 'TelephoneNumber') || '-',
      Markings: {}
    }
  }
    return js;
}