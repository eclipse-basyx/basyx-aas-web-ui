# Documentation

This is the documentation for the nameplate generation.

## Data Format

In this section, all the required data formats are discussed for their designated stages of the nameplate generation.

### Raw Data

The raw data supplied to the nameplate generation must be in the following format. There can be an arbitrary amount of
key-value pairs on each level of the JSON. Just do not repeat any key-names. Otherwise, they will not be distinguishable
in the final nameplate, since only the key-name is displayed, not the hierarchy which it originates from.

```json 
{
  "idShort": "AAS_Type_CD55B20_50",
  "id": "www.example.com/ids/aas/7031_8082_3022_7912",
  "idEncoded": "d3d3LmV4YW1wbGUuY29tL2lkcy9hYXMvNzAzMV84MDgyXzMwMjJfNzkxMg==",
  "nameplateId": "www.example.com/ids/sm/0000_4121_5022_2603",
  "nameplateIdEncoded": "d3d3LmV4YW1wbGUuY29tL2lkcy9zbS8wMDAwXzQxMjFfNTAyMl8yNjAz",
  "num": 8,
  "productImages": [
    "https://ccae4836-001e-48c2-a4f9-235554f9400b.ma.bw-cloud-instance.org/submodels/d3d3LmV4YW1wbGUuY29tL2lkcy9zbS80MTAwXzQxMjFfNTAyMl8xNzA3/submodelelements/GeneralInformation.ProductImage/attachment"
  ],
  "nameplate": {
    "idShort": "Nameplate",
    "id": "www.example.com/ids/sm/0000_4121_5022_2603",
    "idEncoded": "d3d3LmV4YW1wbGUuY29tL2lkcy9zbS8wMDAwXzQxMjFfNTAyMl8yNjAz",
    "ManufacturerName": "SMC",
    "ManufacturerProductDesignation": "Kompaktzylinder nach ISO 21287",
    "ManufacturerProductFamily": "C55",
    "OrderCode": "CD55B20-50",
    "SerialNumber": "",
    "YearOfConstruction": "2022",
    "Address": {
      "Department": "Kontakt zu SMC",
      "Street": "Boschring 13-15",
      "ZipCode": "63329",
      "POBox": "",
      "ZipCodeOfPOBox": "",
      "City_Town": "Egelsbach",
      "State_County": "Deutschland",
      "NationalCode": "",
      "VATNumber": "DE 0123456789",
      "AddressRemarks": "",
      "AddressOfAdditionalLink": "info@smc.de",
      "Phone": {
        "TelephoneNumber": "+49 (0) 61 03 / 402 - 0",
        "TypeOfTelephone": ""
      }
    },
    "Markings": {
      "Marking00": {
        "MarkingName": "nach EU-Maschinen-Richtlinie",
        "FilePath": "https://ccae4836-001e-48c2-a4f9-235554f9400b.ma.bw-cloud-instance.org/submodels/d3d3LmV4YW1wbGUuY29tL2lkcy9zbS8wMDAwXzQxMjFfNTAyMl8yNjAz/submodelelements/Markings.Marking00.MarkingFile/attachment",
        "MarkingFile": "/aasx/Nameplate/CE_Marking_2016.png"
      },
      "Marking01": {
        "MarkingName": "nach EU-RoHS-Richtlinie",
        "FilePath": "https://ccae4836-001e-48c2-a4f9-235554f9400b.ma.bw-cloud-instance.org/submodels/d3d3LmV4YW1wbGUuY29tL2lkcy9zbS8wMDAwXzQxMjFfNTAyMl8yNjAz/submodelelements/Markings.Marking01.MarkingFile/attachment",
        "MarkingFile": "/aasx/Nameplate/CE_Marking_2016.png"
      },
      "Marking02": {
        "MarkingName": "nach EU-EMV-Richtlinie",
        "FilePath": "https://ccae4836-001e-48c2-a4f9-235554f9400b.ma.bw-cloud-instance.org/submodels/d3d3LmV4YW1wbGUuY29tL2lkcy9zbS8wMDAwXzQxMjFfNTAyMl8yNjAz/submodelelements/Markings.Marking02.MarkingFile/attachment",
        "MarkingFile": "/aasx/Nameplate/CE_Marking_2016.png"
      },
      "Marking03": {
        "MarkingName": "RCM Mark"
      },
      "Marking04": {
        "MarkingName": "c UL us - Listed (OL)"
      },
      "Marking05": {
        "MarkingName": "TÜV"
      }
    }
  }
}
```

### Reduced Data

All `data` objects must have the following structure. There can be an arbitrary amount of key-value pairs in the object.
The key-value pairs are displayed as-is, just without the parenthesis. There is no further renaming.

```json
{
  "AddressOfAdditionalLink": "info@smc.de",
  "County": "Deutschland",
  "Department": "Kontakt zu SMC",
  "ManufacturerName": "SMC",
  "ManufacturerProductDesignation": "Kompaktzylinder nach ISO 21287"
}
```

### Markings Data

All `markings` objects must have the following structure. It shows two example markings. There can be an arbitrary
amount of markings as long as they follow the given data format. It is the `Markings` collection from the asset as seen
in the [raw data format](#raw-data).

```json
{
  "Marking00": {
    "MarkingName": "nach EU-Maschinen-Richtlinie",
    "FilePath": "https://ccae4836-001e-48c2-a4f9-235554f9400b.ma.bw-cloud-ins…z/submodelelements/Markings.Marking00.MarkingFile/attachment",
    "MarkingFile": "/aasx/Nameplate/CE_Marking_2016.png"
  },
  "Marking01": {
    "MarkingName": "nach EU-RoHS-Richtlinie",
    "FilePath": "https://ccae4836-001e-48c2-a4f9-235554f9400b.ma.bw-cloud-ins…z/submodelelements/Markings.Marking01.MarkingFile/attachment",
    "MarkingFile": "/aasx/Nameplate/CE_Marking_2016.png"
  }
}
```

## Blacklisting of Keys from the Asset for the Nameplate

Some keys of the asset and their values should not appear on the nameplate (e.g. the id of the nameplate submodel). These keys can be
filtered though the `FILTER_KEYS` array in the `DataTransformer.js`. The array takes regular expressions, so be careful
with what you insert there! These are a little sketchy to work with since the `.`s are replayed with `_`s due to the flattening
of the object. 

## Dependencies

| Dependency  | Link                                                                               | Usage                                    |
|-------------|------------------------------------------------------------------------------------|------------------------------------------|
| QRCode.js   | [https://github.com/davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs) | Generating the QR-Code for the nameplate |

## Legacy Documentation

Sollten noch Daten fehlen, können diese noch hinzugefügt werden.

Das hier ist einfach das vollste Modell, dass ich gefunden habe. Ich denke alles wichtige ist da drin.

zu Bildern:

- Product Images ist ein Array von URLs, hinter denen Bilder liegen. (Habe noch kein Asset gesehen, dass mehr als ein
  hat. AAS spec erlaubt aber mehrerer)
- Für alle Bilder unter dem `Nameplate` schlüssel gibt es den Key `FilePath`, hinter dem das Bild zu finden ist.

