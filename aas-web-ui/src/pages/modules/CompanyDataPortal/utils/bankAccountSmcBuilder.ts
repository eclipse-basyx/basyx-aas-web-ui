import * as aas from '@aas-core-works/aas-core3.0-typescript';

export function createBankAccountsSMC(forms: any): aas.types.SubmodelElementCollection {
    const elements: aas.types.ISubmodelElement[] = [];
    forms.forEach((account: any, index: number) => {
        const bankAccountSMC = new aas.types.SubmodelElementCollection();
        bankAccountSMC.idShort = account.idShort ? account.idShort : `BankAccount__${String(index).padStart(2, '0')}__`;
        bankAccountSMC.description = [
            new aas.types.LangStringTextType('en', 'A bank account of the company for customer payments'),
        ];
        bankAccountSMC.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/BankAccount/1/0'
            ),
        ]);

        const bankAccountElements: aas.types.ISubmodelElement[] = [];

        // AccountHolder
        const accountHolder = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        accountHolder.idShort = 'AccountHolder';
        accountHolder.description = [
            new aas.types.LangStringTextType('en', 'The individual or entity that owns and manages the bank account'),
        ];
        accountHolder.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/AccountHolder/1/0'
            ),
        ]);
        accountHolder.value = account.accountHolder;
        bankAccountElements.push(accountHolder);

        // BankAccountType (optional)
        if (account.accountType) {
            const bankAccountType = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            bankAccountType.idShort = 'BankAccountType';
            bankAccountType.description = [
                new aas.types.LangStringTextType(
                    'en',
                    'The classification of a bank account, such as accounts for domestic and foreign customers'
                ),
            ];
            bankAccountType.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/BankAccountType/1/0'
                ),
            ]);
            bankAccountType.value = account.accountType;
            bankAccountElements.push(bankAccountType);
        }

        // IBAN
        const iban = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        iban.idShort = 'IBAN';
        iban.description = [
            new aas.types.LangStringTextType(
                'en',
                'The International Bank Account Number, a unique identifier for a specific bank account'
            ),
        ];
        iban.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(aas.types.KeyTypes.GlobalReference, 'https://admin-shell.io/idta/CompanyData/IBAN/1/0'),
        ]);
        iban.value = account.iban;
        bankAccountElements.push(iban);

        // BIC
        const bic = new aas.types.Property(aas.types.DataTypeDefXsd.String);
        bic.description = [
            new aas.types.LangStringTextType(
                'en',
                'The Bank Identifier Code, also known as the SWIFT code, which uniquely identifies a bank for international transactions'
            ),
        ];
        bic.idShort = 'BIC';
        bic.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(aas.types.KeyTypes.GlobalReference, 'https://admin-shell.io/idta/CompanyData/BIC/1/0'),
        ]);
        bic.value = account.bic;
        bankAccountElements.push(bic);

        bankAccountSMC.value = bankAccountElements;
        elements.push(bankAccountSMC);
    });

    const mainAccountRef = new aas.types.ReferenceElement();
    mainAccountRef.idShort = 'MainAccount';
    mainAccountRef.description = [new aas.types.LangStringTextType('en', 'The main bank account of the company')];
    mainAccountRef.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
        new aas.types.Key(
            aas.types.KeyTypes.GlobalReference,
            'https://admin-shell.io/idta/CompanyData/MainAccount/1/0'
        ),
    ]);
    mainAccountRef.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
        new aas.types.Key(aas.types.KeyTypes.SubmodelElementCollection, forms[0].idShort),
    ]);
    elements.unshift(mainAccountRef);

    const smc = new aas.types.SubmodelElementCollection();
    smc.description = [new aas.types.LangStringTextType('en', 'Bank account information to facilitate payment')];
    smc.idShort = 'BankAccounts';
    smc.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
        new aas.types.Key(
            aas.types.KeyTypes.GlobalReference,
            'https://admin-shell.io/idta/CompanyData/BankAccounts/1/0'
        ),
    ]);
    smc.value = elements;

    return smc;
}
