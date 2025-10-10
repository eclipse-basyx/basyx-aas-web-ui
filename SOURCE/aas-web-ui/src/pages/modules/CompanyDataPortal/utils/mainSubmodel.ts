import * as aas from '@aas-core-works/aas-core3.0-typescript';
import { useFormStore } from '../stores/formData';

function buildCompanyDataSubmodel() {
    const store = useFormStore();

    const submodel = new aas.types.Submodel('https://example.org/submodels/company-data');
    submodel.idShort = 'CompanyData';
    submodel.description = [
        new aas.types.LangStringTextType('en', 'Structured data for a company, corporation, branch, or division'),
    ];

    submodel.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
        new aas.types.Key(
            aas.types.KeyTypes.GlobalReference,
            'https://admin-shell.io/idta/CompanyData/CompanyData/1/0'
        ),
    ]);

    const notNull = <T>(v: T | null): v is T => v !== null;

    submodel.submodelElements = [
        store.companySMC as any,
        store.bankAccounts,
        store.digital,
        store.businessFigures,
        store.government,
    ].filter(notNull);

    return submodel;
}

export function jsonOfSubmodel() {
    const environment = new aas.types.Environment();
    environment.submodels = [buildCompanyDataSubmodel()];
    const jsonable = aas.jsonization.toJsonable(environment);
    return JSON.stringify(jsonable, null, 2);
}

export function getSubmodel() {
    return buildCompanyDataSubmodel();
}
