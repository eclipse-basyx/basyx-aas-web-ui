import * as aas from '@aas-core-works/aas-core3.0-typescript';

export function createBusinessReportFiguresSMC(forms: any): aas.types.SubmodelElementCollection {
    const elements: aas.types.ISubmodelElement[] = [];

    // Add LastReport reference to first report
    if (forms.length > 0) {
        const lastReportRef = new aas.types.ReferenceElement();
        lastReportRef.idShort = 'LastReport';
        lastReportRef.description = [
            new aas.types.LangStringTextType(
                'en',
                'Reference to the most recent business report published by the company'
            ),
        ];
        lastReportRef.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/LastReport/1/0'
            ),
        ]);
        lastReportRef.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
            new aas.types.Key(aas.types.KeyTypes.SubmodelElementCollection, 'BusinessReportFigure__00__'),
        ]);
        elements.push(lastReportRef);
    }

    forms.forEach((report: any, index: number) => {
        const reportSMC = new aas.types.SubmodelElementCollection();
        reportSMC.idShort = `BusinessReportFigure__${String(index).padStart(2, '0')}__`;
        reportSMC.description = [new aas.types.LangStringTextType('en', 'List of annual business reports')];
        reportSMC.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/BusinessReportFigure/1/0'
            ),
        ]);

        const reportElements: aas.types.ISubmodelElement[] = [];

        if (report.financialYear) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.GYear);
            p.idShort = 'FinancialYear';
            p.value = report.financialYear;
            p.description = [
                new aas.types.LangStringTextType(
                    'en',
                    'The 12-month period used for accounting and financial reporting of the business report'
                ),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/FinancialYear/1/0'
                ),
            ]);
            reportElements.push(p);
        }

        if (report.reportStart) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.Date);
            p.idShort = 'BeginOfReporttimeFrame';
            p.value = report.reportStart;
            p.description = [
                new aas.types.LangStringTextType('en', 'The start date of the period covered by the business report'),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/BeginOfReporttimeFrame/1/0'
                ),
            ]);
            reportElements.push(p);
        }

        if (report.reportEnd) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.Date);
            p.idShort = 'EndOfReporttimeFrame';
            p.value = report.reportEnd;
            p.description = [
                new aas.types.LangStringTextType('en', 'The end date of the period covered by the business report'),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/EndOfReporttimeFrame/1/0'
                ),
            ]);
            reportElements.push(p);
        }

        if (report.publicationYear) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.GYear);
            p.idShort = 'YearOfPublication';
            p.value = report.publicationYear;
            p.description = [
                new aas.types.LangStringTextType('en', 'The year in which the business report was published'),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/YearOfPublication/1/0'
                ),
            ]);
            reportElements.push(p);
        }

        if (report.turnover) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            p.idShort = 'Turnover';
            p.value = report.turnover;
            p.description = [
                new aas.types.LangStringTextType(
                    'en',
                    'The total revenue generated by the company during the reporting period'
                ),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/Turnover/1/0'
                ),
            ]);
            reportElements.push(p);
        }

        if (report.investmentVolume) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            p.idShort = 'InvestmentVolume';
            p.value = report.investmentVolume;
            p.description = [
                new aas.types.LangStringTextType(
                    'en',
                    'The total amount of money invested by the company during the reporting period'
                ),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/InvestmentVolume/1/0'
                ),
            ]);
            reportElements.push(p);
        }

        if (report.equityRatio) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
            p.idShort = 'EquityRatio';
            p.value = report.equityRatio;
            p.description = [
                new aas.types.LangStringTextType(
                    'en',
                    'The proportion of equity to total assets, indicating financial stability'
                ),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/EquityRatio/1/0'
                ),
            ]);
            reportElements.push(p);
        }

        if (report.totalEmployees) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.PositiveInteger);
            p.idShort = 'TotalEmployees';
            p.value = String(report.totalEmployees);
            p.description = [
                new aas.types.LangStringTextType('en', 'The total number of employees working for the company'),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/TotalEmployees/1/0'
                ),
            ]);
            reportElements.push(p);
        }

        // Customers SMC
        if (report.customerCount || (report.customers && report.customers.length > 0)) {
            const customersSMC = new aas.types.SubmodelElementCollection();
            customersSMC.idShort = 'Customers';
            customersSMC.description = [
                new aas.types.LangStringTextType('en', "Information on the company's most important customers"),
            ];
            customersSMC.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/Customers/1/0'
                ),
            ]);
            const customersElements: aas.types.ISubmodelElement[] = [];

            if (report.customerCount) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.PositiveInteger);
                p.idShort = 'TotalNumberCustomers';
                p.value = String(report.customerCount);
                p.description = [
                    new aas.types.LangStringTextType('en', 'The total count of customers served by the company'),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/TotalNumberCustomers/1/0'
                    ),
                ]);
                customersElements.push(p);
            }

            report.customers?.forEach((cust: any, ci: number) => {
                const refCustSMC = new aas.types.SubmodelElementCollection();
                refCustSMC.idShort = `ReferenceCustomer__${String(ci).padStart(2, '0')}__`;
                refCustSMC.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/ReferenceCustomer/1/0'
                    ),
                ]);
                refCustSMC.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'A notable or key customer used as a reference for business credibility'
                    ),
                ];

                const refCustElements: aas.types.ISubmodelElement[] = [];

                if (cust.referenceToCustomer) {
                    const ref = new aas.types.ReferenceElement();
                    ref.idShort = 'ReferenceToCustomer';
                    ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                        new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, cust.referenceToCustomer),
                    ]);
                    ref.description = [
                        new aas.types.LangStringTextType('en', 'Reference to the company AAS of the customer'),
                    ];
                    ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/ReferenceToCustomer/1/0'
                        ),
                    ]);
                    refCustElements.push(ref);
                }

                if (cust.customerWebsite) {
                    const p = new aas.types.Property(aas.types.DataTypeDefXsd.AnyUri);
                    p.idShort = 'CustomerWebsite';
                    p.value = cust.customerWebsite;
                    p.description = [new aas.types.LangStringTextType('en', 'The website of a customer')];
                    p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/CustomerWebsite/1/0'
                        ),
                    ]);
                    refCustElements.push(p);
                }
                refCustSMC.value = refCustElements;

                customersElements.push(refCustSMC);
            });
            customersSMC.value = customersElements;
            reportElements.push(customersSMC);
        }
        //TODO this is not being created eventhough code is 100% correct. Something is wrong with the structure of the code not matching the pdf document, pay attention to who is the child of who!
        if (report.dataFile) {
            const file = new aas.types.File('application/pdf');
            file.idShort = 'ConsolidatedDataFile';
            file.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/ConsolidatedDataFile/1/0'
                ),
            ]);
            file.description = [
                new aas.types.LangStringTextType('en', 'A file containing aggregated data of the business report'),
            ];
            file.contentType = 'application/pdf';
            reportElements.push(file);
        }
        reportSMC.value = reportElements;
        elements.push(reportSMC);
    });

    const smc = new aas.types.SubmodelElementCollection();
    smc.idShort = 'BusinessReportFigures';
    smc.description = [new aas.types.LangStringTextType('en', 'Annual metrics of a company')];
    smc.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
        new aas.types.Key(
            aas.types.KeyTypes.GlobalReference,
            'https://admin-shell.io/idta/CompanyData/BusinessReportFigures/1/0'
        ),
    ]);
    smc.value = elements;

    return smc;
}
