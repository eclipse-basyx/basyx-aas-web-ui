import * as aas from '@aas-core-works/aas-core3.0-typescript';

export function createCompanyIdentificationSMC(form: any): aas.types.SubmodelElementCollection {
    const elements: aas.types.ISubmodelElement[] = [];

    if (form.CompanyName) {
        const prop = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        prop.idShort = 'CompanyName';
        prop.value = form.CompanyName;
        prop.description = [
            new aas.types.LangStringTextType(
                'en',
                'Legally valid name under which a company or organization is registered and conducts business'
            ),
        ];
        prop.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/CompanyName/1/0'
            ),
        ]);
        elements.push(prop);
    }

    if (form.CompanyLogo) {
        const file = new aas.types.File('image/png');
        file.idShort = 'CompanyLogo';
        file.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(aas.types.KeyTypes.GlobalReference, '0173-1#02-ABI776#002'),
        ]);
        file.description = [
            new aas.types.LangStringTextType(
                'en',
                'Imagefile for logo of the company provided in common format (.png, .jpg)'
            ),
        ];
        file.contentType = 'image/png';
        elements.push(file);
    }

    if (form.CompanyDescription?.length) {
        const mlp = new aas.types.MultiLanguageProperty();
        mlp.idShort = 'CompanyDescription';
        mlp.value = form.CompanyDescription.map(
            (entry: any) => new aas.types.LangStringTextType(entry.language, entry.text)
        );
        mlp.description = [
            new aas.types.LangStringTextType(
                'en',
                "short summary of the company's main activities, products or services, and its mission or vision"
            ),
        ];
        mlp.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/CompanyDescription/1/0'
            ),
        ]);
        elements.push(mlp);
    }

    if (form.HomepageURL?.length) {
        const mlp = new aas.types.MultiLanguageProperty();
        mlp.idShort = 'HomepageURL';
        mlp.value = form.HomepageURL.map((entry: any) => new aas.types.LangStringTextType(entry.language, entry.text));
        mlp.description = [
            new aas.types.LangStringTextType(
                'en',
                "Web address of the company's official website, for customers and interested parties"
            ),
        ];
        mlp.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/HomepageURL/1/0'
            ),
        ]);
        elements.push(mlp);
    }

    if (form.VATNumber) {
        const prop = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        prop.idShort = 'VATNumber';
        prop.value = form.VATNumber;
        prop.description = [
            new aas.types.LangStringTextType(
                'en',
                'Value Added Tax identification number required by companies in the European Union for handling VAT transactions'
            ),
        ];
        prop.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/VATNumber/1/0'
            ),
        ]);
        elements.push(prop);
    }

    if (form.TaxNumber) {
        const prop = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        prop.idShort = 'TaxNumber';
        prop.value = form.TaxNumber;
        prop.description = [
            new aas.types.LangStringTextType('en', 'Identifier assigned to a company by the tax authority'),
        ];
        prop.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/TaxNumber/1/0'
            ),
        ]);
        elements.push(prop);
    }

    if (form.DUNS) {
        const prop = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        prop.idShort = 'DUNS';
        prop.value = form.DUNS;
        prop.description = [
            new aas.types.LangStringTextType(
                'en',
                'Data Universal Numbering System number, a unique nine-digit identifier assigned by Dun & Bradstreet to identify companies globally'
            ),
        ];
        prop.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(aas.types.KeyTypes.GlobalReference, 'https://admin-shell.io/idta/CompanyData/DUNS/1/0'),
        ]);
        elements.push(prop);
    }

    if (form.CommercialRegisterNumber) {
        const prop = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        prop.idShort = 'CommercialRegisterNumber';
        prop.value = form.CommercialRegisterNumber;
        prop.description = [
            new aas.types.LangStringTextType(
                'en',
                'The number under which a company is registered in the commercial register'
            ),
        ];
        prop.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/CommercialRegisterNumber/1/0'
            ),
        ]);
        elements.push(prop);
    }

    if (form.FoundingYear) {
        const prop = new aas.types.Property(aas.types.DataTypeDefXsd.GYear);
        prop.idShort = 'FoundingYear';
        prop.value = form.FoundingYear.toString();
        prop.description = [new aas.types.LangStringTextType('en', 'The year in which the company was established')];
        prop.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/FoundingYear/1/0'
            ),
        ]);
        elements.push(prop);
    }

    if (form.OrderCurrency?.length) {
        const mlp = new aas.types.MultiLanguageProperty();
        mlp.idShort = 'OrderCurrency';
        mlp.value = form.OrderCurrency.map(
            (entry: any) => new aas.types.LangStringTextType(entry.language, entry.text)
        );
        mlp.description = [
            new aas.types.LangStringTextType(
                'en',
                'The currency in which the company processes its orders and transactions'
            ),
        ];
        mlp.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/OrderCurrency/1/0'
            ),
        ]);
        elements.push(mlp);
    }

    if (form.MainProductGroup?.length) {
        const list = new aas.types.SubmodelElementList(aas.types.AasSubmodelElements.MultiLanguageProperty);
        list.idShort = 'MainProductGroups';
        list.description = [
            new aas.types.LangStringTextType('en', 'The primary categories of products that the company offers'),
        ];
        list.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/MainProductGroups/1/0'
            ),
        ]);

        const mlp = new aas.types.MultiLanguageProperty();
        mlp.idShort = 'MainProductGroup';
        mlp.description = [new aas.types.LangStringTextType('en', 'A category of products that the company offers')];
        mlp.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/MainProductGroup/1/0'
            ),
        ]);
        mlp.value = form.MainProductGroup.map((e: any) => new aas.types.LangStringTextType(e.language, e.text));

        list.value = [mlp];
        elements.push(list);
    }

    if (form.Industries?.length) {
        const list = new aas.types.SubmodelElementList(aas.types.AasSubmodelElements.MultiLanguageProperty);
        list.idShort = 'Industries';
        list.description = [new aas.types.LangStringTextType('en', 'The sectors in which the company operates')];
        list.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/Industries/1/0'
            ),
        ]);

        const mlp = new aas.types.MultiLanguageProperty();
        mlp.idShort = 'Industry';
        mlp.description = [new aas.types.LangStringTextType('en', 'An industry sector')];
        mlp.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/Industry/1/0'
            ),
        ]);
        mlp.value = form.Industries.map((e: any) => new aas.types.LangStringTextType(e.language, e.text));

        list.value = [mlp];
        elements.push(list);
    }

    const smc = new aas.types.SubmodelElementCollection();
    smc.idShort = 'CompanyIdentification';
    smc.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
        new aas.types.Key(
            aas.types.KeyTypes.GlobalReference,
            'https://admin-shell.io/idta/CompanyData/CompanyIdentification/1/0'
        ),
    ]);
    smc.description = [
        new aas.types.LangStringTextType('en', 'Identifiers of a company, corporation, branch, or division'),
    ];
    smc.value = elements;

    return smc;
}
