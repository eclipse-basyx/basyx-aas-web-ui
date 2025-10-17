import * as aas from '@aas-core-works/aas-core3.0-typescript';

export function createDigitalInterfacesSMC(form: any): aas.types.SubmodelElementCollection {
    const elements: aas.types.ISubmodelElement[] = [];

    // DATA EXCHANGE
    const dataExchangeChildren: aas.types.ISubmodelElement[] = [];

    if (form.encryptedDataTransmission) {
        const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
        p.idShort = 'EncryptedDataTransmission';
        p.value = String(form.encryptedDataTransmission);
        p.description = [
            new aas.types.LangStringTextType('en', 'Indication if the company supports encrypted data transmission'),
        ];
        p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/EncryptedDataTransmission/1/0'
            ),
        ]);
        dataExchangeChildren.push(p);
    }

    if (form.eInvoiceFormat) {
        const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        p.idShort = 'OutgoingEInvoiceFormat';
        p.value = form.eInvoiceFormat;
        p.description = [
            new aas.types.LangStringTextType('en', 'The format used by a company to send electronic invoices'),
        ];
        p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/OutgoingInvoiceFormat/1/0'
            ),
        ]);
        dataExchangeChildren.push(p);
    }

    if (form.edi) {
        const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
        p.idShort = 'EDI';
        p.value = String(form.edi);
        p.description = [
            new aas.types.LangStringTextType('en', 'Indication if the company supports electronic data transfer'),
        ];
        p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/DigitalInterfaces/DataExchange/EDI/1/0'
            ),
        ]);
        dataExchangeChildren.push(p);
    }

    if (form.webEdi) {
        const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
        p.idShort = 'WebEDI';
        p.value = String(form.webEdi);
        p.description = [
            new aas.types.LangStringTextType(
                'en',
                'Indication if the company supports web-based electronic data transfer'
            ),
        ];
        p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData//WebEDI/1/0'
            ),
        ]);
        dataExchangeChildren.push(p);
    }

    if (form.cadFormats?.length > 0) {
        const list = new aas.types.SubmodelElementList(aas.types.AasSubmodelElements.Property);
        list.idShort = 'CADFormats';
        list.valueTypeListElement = aas.types.DataTypeDefXsd.String;
        list.description = [
            new aas.types.LangStringTextType(
                'en',
                'The file formats used for computer-aided design drawings and models at the company'
            ),
        ];
        list.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/DigitalInterfaces/DataExchange/CADFormats/1/0'
            ),
        ]);
        list.value = form.cadFormats.map((element: string) => {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            p.idShort = 'CADFormat';
            p.description = [new aas.types.LangStringTextType('en', 'Computer-aided design tool file format')];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/CADFormat/1/0'
                ),
            ]);
            p.value = element;
            return p;
        });
        dataExchangeChildren.push(list);
    }

    let dataExchangeSMC: aas.types.SubmodelElementCollection | null = null;
    if (dataExchangeChildren.length) {
        dataExchangeSMC = new aas.types.SubmodelElementCollection();
        dataExchangeSMC.idShort = 'DataExchange';
        dataExchangeSMC.description = [
            new aas.types.LangStringTextType('en', 'The methods and formats used to transfer data between systems'),
        ];
        dataExchangeSMC.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/DataExchange/1/0'
            ),
        ]);
        dataExchangeSMC.value = dataExchangeChildren;
        elements.push(dataExchangeSMC);
    }

    // CompanySystems
    const companySystemsChildren: aas.types.ISubmodelElement[] = [];

    // --- ERPSystem ---
    if (form.erpName || form.erpVersion || form.erpReference) {
        const erpSMC = new aas.types.SubmodelElementCollection();
        erpSMC.idShort = 'ERPSystem';
        erpSMC.description = [
            new aas.types.LangStringTextType(
                'en',
                'Contains information about an enterprise resource planning system that integrates various business processes'
            ),
        ];
        erpSMC.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/ERPSystem/1/0'
            ),
        ]);
        const erpChildren: aas.types.ISubmodelElement[] = [];

        if (form.erpName) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            p.idShort = 'ERPName';
            p.value = form.erpName;
            p.description = [
                new aas.types.LangStringTextType('en', 'The specific name of the enterprise resource planning system'),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/ERPName/1/0'
                ),
            ]);
            erpChildren.push(p);
        }

        if (form.erpVersion) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            p.idShort = 'ERPVersion';
            p.value = form.erpVersion;
            p.description = [
                new aas.types.LangStringTextType(
                    'en',
                    'The version number of the enterprise resource planning software in use'
                ),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/ERPVersion/1/0'
                ),
            ]);
            erpChildren.push(p);
        }

        if (form.erpReference) {
            const ref = new aas.types.ReferenceElement();
            ref.idShort = 'ERPReference';
            ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, form.erpReference),
            ]);
            ref.description = [
                new aas.types.LangStringTextType(
                    'en',
                    'Reference to the Software Nameplate Submodel of the ERP system'
                ),
            ];
            ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/ERPReference/1/0'
                ),
            ]);
            erpChildren.push(ref);
        }
        erpSMC.value = erpChildren;
        companySystemsChildren.push(erpSMC);
    }

    // --- EmailSystem ---
    if (form.emailSystem || form.emailSystemReference) {
        const emailSMC = new aas.types.SubmodelElementCollection();
        emailSMC.idShort = 'EmailSystem';
        emailSMC.description = [
            new aas.types.LangStringTextType('en', 'The software used by a company to manage its email communications'),
        ];
        emailSMC.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/EmailSystem/1/0'
            ),
        ]);
        const emailChildren: aas.types.ISubmodelElement[] = [];

        if (form.emailSystem) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            p.idShort = 'EmailSystemName';
            p.value = form.emailSystem;
            p.description = [
                new aas.types.LangStringTextType('en', 'The specific name of the email software used by the company'),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/EmailSystemName/1/0'
                ),
            ]);
            emailChildren.push(p);
        }

        if (form.emailSystemReference) {
            const ref = new aas.types.ReferenceElement();
            ref.idShort = 'EmailSystemReference';
            ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, form.emailSystemReference),
            ]);
            ref.description = [
                new aas.types.LangStringTextType(
                    'en',
                    'Reference to the Software Nameplate Submodel of the email system'
                ),
            ];
            ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/EmailSystemReference/1/0'
                ),
            ]);
            emailChildren.push(ref);
        }
        emailSMC.value = emailChildren;
        companySystemsChildren.push(emailSMC);
    }

    // --- CADTools ---
    if (form.cadTools?.length > 0) {
        const list = new aas.types.SubmodelElementList(aas.types.AasSubmodelElements.Property);
        list.idShort = 'CADTools';
        list.valueTypeListElement = aas.types.DataTypeDefXsd.String;
        list.description = [
            new aas.types.LangStringTextType(
                'en',
                'Computer-aided design tools used for creating precise drawings and models'
            ),
        ];
        list.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/CADTools/1/0'
            ),
        ]);
        list.value = form.cadTools.map((tool: string) => {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            p.idShort = 'CADTool';
            p.value = tool;
            p.description = [new aas.types.LangStringTextType('en', 'Computer-aided design tool')];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/CADTool/1/0'
                ),
            ]);
            return p;
        });
        companySystemsChildren.push(list);
    }

    let companySystemsSMC: aas.types.SubmodelElementCollection | null = null;

    if (companySystemsChildren.length) {
        companySystemsSMC = new aas.types.SubmodelElementCollection();
        companySystemsSMC.idShort = 'CompanySystems';
        companySystemsSMC.description = [
            new aas.types.LangStringTextType('en', 'The internal IT systems used by a company'),
        ];
        companySystemsSMC.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/CompanySystems/1/0'
            ),
        ]);
        companySystemsSMC.value = companySystemsChildren;
        elements.push(companySystemsSMC);
    }

    const smc = new aas.types.SubmodelElementCollection();
    smc.idShort = 'DigitalInterfaces';
    smc.description = [
        new aas.types.LangStringTextType(
            'en',
            'Systems and protocols used by the company to enable digital communication and data exchange'
        ),
    ];
    smc.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
        new aas.types.Key(
            aas.types.KeyTypes.GlobalReference,
            'https://admin-shell.io/idta/CompanyData/DigitalInterfaces/1/0'
        ),
    ]);
    smc.value = elements;

    return smc;
}
