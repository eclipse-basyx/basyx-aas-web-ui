import * as aas from '@aas-core-works/aas-core3.0-typescript';

export function createCompanyGovernanceSMC(form: any): aas.types.SubmodelElementCollection {
    const elements: aas.types.ISubmodelElement[] = [];

    // CorporatePolicies
    if (form.codeOfConduct || form.generalTermsAndConditions || form.qualityAssurance) {
        const corporatePolicies = new aas.types.SubmodelElementCollection();
        corporatePolicies.description = [
            new aas.types.LangStringTextType(
                'en',
                "The guidelines and principles that govern the company's d and behavior"
            ),
        ];
        corporatePolicies.idShort = 'CorporatePolicies';
        corporatePolicies.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/CorporatePolicies/1/0'
            ),
        ]);
        const policiesElements: aas.types.ISubmodelElement[] = [];

        if (form.codeOfConduct) {
            const ref = new aas.types.ReferenceElement();
            ref.idShort = 'CodeOfConduct';
            ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, form.codeOfConduct),
            ]);
            ref.description = [new aas.types.LangStringTextType('en', 'Reference to a code of conduct document')];
            ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/CodeOfConduct/1/0'
                ),
            ]);
            policiesElements.push(ref);
        }

        if (form.generalTermsAndConditions) {
            const ref = new aas.types.ReferenceElement();
            ref.idShort = 'GeneralTermsAndConditions';
            ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, form.generalTermsAndConditions),
            ]);
            ref.description = [
                new aas.types.LangStringTextType('en', 'Reference to a contractual terms and conditions document'),
            ];
            ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/GeneralTermsAndConditions/1/0'
                ),
            ]);
            policiesElements.push(ref);
        }

        if (form.qualityAssurance) {
            const ref = new aas.types.ReferenceElement();
            ref.idShort = 'QualityAssuranceAgreements';
            ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, form.qualityAssurance),
            ]);
            ref.description = [
                new aas.types.LangStringTextType('en', 'Reference to a quality assurance agreement document'),
            ];
            ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/QualityAssuranceAgreements/1/0'
                ),
            ]);
            policiesElements.push(ref);
        }

        corporatePolicies.value = policiesElements;
        elements.push(corporatePolicies);
    }

    // IndustryStandards
    if (form.memberships.length > 0 || form.certifications.length > 0) {
        const industryStandards = new aas.types.SubmodelElementCollection();
        industryStandards.description = [
            new aas.types.LangStringTextType('en', 'The accepted norms and criteria within a specific industry'),
        ];
        industryStandards.idShort = 'IndustryStandards';
        industryStandards.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/IndustryStandards/1/0'
            ),
        ]);
        const industryElements: aas.types.ISubmodelElement[] = [];

        // Memberships
        if (form.memberships.length > 0) {
            const list = new aas.types.SubmodelElementList(aas.types.AasSubmodelElements.Property);
            list.idShort = 'Memberships';
            list.description = [
                new aas.types.LangStringTextType('en', 'Affiliations with industry organizations or associations'),
            ];
            list.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/Memberships/1/0'
                ),
            ]);
            list.value = form.memberships.map((elem: string) => {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                p.idShort = 'Association';
                p.value = elem;
                p.description = [
                    new aas.types.LangStringTextType('en', 'An industry association which the company is a member of'),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/Association/1/0'
                    ),
                ]);
                return p;
            });
            industryElements.push(list);
        }

        // Certifications
        if (form.certifications.length > 0) {
            const list = new aas.types.SubmodelElementList(aas.types.AasSubmodelElements.SubmodelElementCollection);
            list.idShort = 'Certifications';
            list.description = [
                new aas.types.LangStringTextType('en', 'Certifications which the company has acquired'),
            ];
            list.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/Certifications/1/0'
                ),
            ]);
            console.warn(form.certifications);
            list.value = form.certifications.map((c: any) => {
                const certification = new aas.types.SubmodelElementCollection();
                certification.idShort = 'Certification';
                certification.description = [
                    new aas.types.LangStringTextType('en', 'A certification the company has acquired'),
                ];
                certification.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/Certification/1/0'
                    ),
                ]);

                const certificationElements: aas.types.ISubmodelElement[] = [];

                if (c.certificationStandard) {
                    const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                    p.idShort = 'CertificationStandard';
                    p.value = c.certificationStandard;
                    p.description = [
                        new aas.types.LangStringTextType('en', 'The identifier of the certification standard'),
                    ];
                    p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/CertificationStandard/1/0'
                        ),
                    ]);
                    certificationElements.push(p);
                }

                if (c.approvalAgency) {
                    const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                    p.idShort = 'ApprovalAgency';
                    p.value = c.approvalAgency;
                    p.description = [
                        new aas.types.LangStringTextType('en', 'The organization which granted the certification'),
                    ];
                    p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/ApprovalAgency/1/0'
                        ),
                    ]);
                    certificationElements.push(p);
                }

                if (c.certificateNumber) {
                    const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                    p.idShort = 'CertificateNumber';
                    p.value = c.certificateNumber;
                    p.description = [new aas.types.LangStringTextType('en', 'The identifier of the certification')];
                    p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/CertificateNumber/1/0'
                        ),
                    ]);
                    certificationElements.push(p);
                }

                if (c.issueDate) {
                    const p = new aas.types.Property(aas.types.DataTypeDefXsd.Date);
                    p.idShort = 'IssueDate';
                    p.value = c.issueDate;
                    p.description = [
                        new aas.types.LangStringTextType('en', 'The date on which the certification was granted'),
                    ];
                    p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/IssueDate/1/0'
                        ),
                    ]);
                    certificationElements.push(p);
                }

                if (c.expiryDate) {
                    const p = new aas.types.Property(aas.types.DataTypeDefXsd.Date);
                    p.idShort = 'expiryDate';
                    p.value = c.issueDate;
                    p.description = [
                        new aas.types.LangStringTextType('en', 'The date on which the certification expires'),
                    ];
                    p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/expiryDate/1/0'
                        ),
                    ]);
                    certificationElements.push(p);
                }

                if (c.certificationURL) {
                    const p = new aas.types.Property(aas.types.DataTypeDefXsd.AnyUri);
                    p.idShort = 'CertificationURL';
                    p.value = c.certificationURL;
                    p.description = [
                        new aas.types.LangStringTextType(
                            'en',
                            'The web address where the certification details can be verified'
                        ),
                    ];
                    p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/CertificationURL/1/0'
                        ),
                    ]);
                    certificationElements.push(p);
                }

                if (c.certificationDocuments) {
                    c.certificationDocuments.forEach((document: any, idx: number) => {
                        const ref = new aas.types.ReferenceElement();
                        ref.idShort = 'CertificationDocument__0' + idx + '__';
                        ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                            new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, document),
                        ]);
                        ref.description = [
                            new aas.types.LangStringTextType('en', 'Reference to the certification document'),
                        ];
                        ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                            new aas.types.Key(
                                aas.types.KeyTypes.GlobalReference,
                                'https://admin-shell.io/idta/CompanyData/CertificationDocument/1/0'
                            ),
                        ]);
                        certificationElements.push(ref);
                    });
                }

                certification.value = certificationElements;

                return certification;
            });
            industryElements.push(list);
        }
        industryStandards.value = industryElements;
        elements.push(industryStandards);
    }

    // RiskManagement

    const filteredPolicies = Object.values(form.securityPolicies).some(
        (v) => v != null && (typeof v !== 'string' || v.trim() !== '')
    );

    if (
        form.businessContinuityPlan ||
        form.employeeTrainings.length > 0 ||
        filteredPolicies ||
        form.insurances.length > 0
    ) {
        const riskManagement = new aas.types.SubmodelElementCollection();
        riskManagement.idShort = 'RiskManagement';
        riskManagement.description = [
            new aas.types.LangStringTextType('en', 'Information on risk management strategies of the company'),
        ];
        riskManagement.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/RiskManagement/1/0'
            ),
        ]);

        const rmElements: aas.types.ISubmodelElement[] = [];

        // BusinessContinuityPlan (Boolean)
        if (form.businessContinuityPlan !== undefined && form.businessContinuityPlan !== null) {
            const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
            p.idShort = 'BusinessContinuityPlan';
            p.value = String(!!form.businessContinuityPlan);
            p.description = [
                new aas.types.LangStringTextType('en', 'Flag if the company has set up a business continuity plan'),
            ];
            p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/BusinessContinuityPlan/1/0'
                ),
            ]);
            rmElements.push(p);
        }

        // EmployeeTrainings (SML of SMC EmployeeTraining)
        if (form.employeeTrainings.length > 0) {
            const list = new aas.types.SubmodelElementList(aas.types.AasSubmodelElements.SubmodelElementCollection);
            list.idShort = 'EmployeeTrainings';
            list.description = [
                new aas.types.LangStringTextType(
                    'en',
                    "List of programs designed to enhance employees' skills and knowledge"
                ),
            ];
            list.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/EmployeeTrainings/1/0'
                ),
            ]);

            let trainingExists = false;
            list.value = form.employeeTrainings
                .filter((t: any) => t.typeOfTraining.trim() != '' && t.trainingDocumentation.trim() != '') // TypeOfTraining required
                .map((t: any) => {
                    trainingExists = true;
                    const training = new aas.types.SubmodelElementCollection();
                    training.idShort = 'EmployeeTraining';
                    training.description = [
                        new aas.types.LangStringTextType(
                            'en',
                            'Contains information on a corporate employee training program'
                        ),
                    ];
                    training.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/EmployeeTraining/1/0'
                        ),
                    ]);

                    const trainingElems: aas.types.ISubmodelElement[] = [];

                    // TypeOfTraining (required)
                    const typ = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                    typ.idShort = 'TypeOfTraining';
                    typ.value = t.typeOfTraining;
                    typ.description = [new aas.types.LangStringTextType('en', 'Type of the training program')];
                    typ.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/TypeOfTraining/1/0'
                        ),
                    ]);
                    trainingElems.push(typ);

                    // TrainingDocumentation (optional reference)
                    if (t.trainingDocumentation) {
                        const ref = new aas.types.ReferenceElement();
                        ref.idShort = 'TrainingDocumentation';
                        ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                            new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, t.trainingDocumentation),
                        ]);
                        ref.description = [
                            new aas.types.LangStringTextType('en', 'Reference to training program documentation'),
                        ];
                        ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                            new aas.types.Key(
                                aas.types.KeyTypes.GlobalReference,
                                'https://admin-shell.io/idta/CompanyData/TrainingDocumentation/1/0'
                            ),
                        ]);
                        trainingElems.push(ref);
                    }

                    training.value = trainingElems;
                    return training;
                });
            if (trainingExists) {
                rmElements.push(list);
            }
        }

        if (filteredPolicies) {
            const sp = new aas.types.SubmodelElementCollection();
            sp.idShort = 'SecurityPolicies';
            sp.description = [new aas.types.LangStringTextType('en', 'Security policies implemented by the company')];
            sp.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/SecurityPolicies/1/0'
                ),
            ]);

            const spElems: aas.types.ISubmodelElement[] = [];

            // InformationSecurityPolicy
            if (form.securityPolicies.informationSecurityPolicy !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'InformationSecurityPolicy';
                p.value = String(!!form.securityPolicies.informationSecurityPolicy);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Indication if the company has implemented an information security policy'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/InformationSecurityPolicy/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // DataProtectionPolicy
            if (form.securityPolicies.dataProtectionPolicy !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'DataProtectionPolicy';
                p.value = String(!!form.securityPolicies.dataProtectionPolicy);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Indication if the company has implemented a data security policy'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/DataProtectionPolicy/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // PasswordPolicy
            if (form.securityPolicies.passwordPolicy !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'PasswordPolicy';
                p.value = String(!!form.securityPolicies.passwordPolicy);
                p.description = [
                    new aas.types.LangStringTextType('en', 'Flag if the company enforces a password policy'),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/PasswordPolicy/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // AuthorizationConcept
            if (form.securityPolicies.authorizationConcept !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'AuthorizationConcept';
                p.value = String(!!form.securityPolicies.authorizationConcept);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Flag if the company has implemented an authorization concept'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/AuthorizationConcept/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // AccessControlProcess
            if (form.securityPolicies.accessControlProcess !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'AccessControlProcess';
                p.value = String(!!form.securityPolicies.accessControlProcess);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Flag if the company has implemented an access control process'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/AccessControlProcess/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // UserAccessInventory
            if (form.securityPolicies.userAccessInventory !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'UserAccessInventory';
                p.value = String(!!form.securityPolicies.userAccessInventory);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Flag if the company has implemented a user access inventory'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/UserAccessInventory/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // PermissionDocumentation
            if (form.securityPolicies.permissionDocumentation !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'PermissionDocumentation';
                p.value = String(!!form.securityPolicies.permissionDocumentation);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Flag if the company has implemented documentation of granted permissions'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/PermissionDocumentation/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // LockingSystem
            if (form.securityPolicies.lockingSystem !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'LockingSystem';
                p.value = String(!!form.securityPolicies.lockingSystem);
                p.description = [
                    new aas.types.LangStringTextType('en', 'Flag if the company has implemented a locking system'),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/LockingSystem/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // KeyAllocation
            if (form.securityPolicies.keyAllocation !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'KeyAllocation';
                p.value = String(!!form.securityPolicies.keyAllocation);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Flag if the company has implemented a key allocation system'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/KeyAllocation/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // VisitorLog
            if (form.securityPolicies.visitorLog !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'VisitorLog';
                p.value = String(!!form.securityPolicies.visitorLog);
                p.description = [
                    new aas.types.LangStringTextType('en', 'Flag if the company has implemented a visitor log'),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/VisitorLog/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // VisitorEscort
            if (form.securityPolicies.visitorEscort !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'VisitorEscort';
                p.value = String(!!form.securityPolicies.visitorEscort);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Flag if the company enforces escorting of visitors on the premises'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/VisitorEscort/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // VisitorBadge
            if (form.securityPolicies.visitorBadge !== null) {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.Boolean);
                p.idShort = 'VisitorBadge';
                p.value = String(!!form.securityPolicies.visitorBadge);
                p.description = [
                    new aas.types.LangStringTextType('en', 'Flag if the company hands out badges to visitors'),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/VisitorBadge/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            // CustomerAudits (string)
            if (form.securityPolicies.customerAudits !== null && form.securityPolicies.customerAudits !== '') {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                p.idShort = 'CustomerAudits';
                p.value = String(form.securityPolicies.customerAudits);
                p.description = [
                    new aas.types.LangStringTextType('en', 'Flag if the company allows announced customer audits'),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/CustomerAudits/1/0'
                    ),
                ]);
                spElems.push(p);
            }

            if (spElems.length > 0) {
                sp.value = spElems;
                rmElements.push(sp);
            }
        }

        // Insurances (SML of SMC Insurance)
        if (form.insurances.length > 0) {
            const list = new aas.types.SubmodelElementList(aas.types.AasSubmodelElements.SubmodelElementCollection);
            list.idShort = 'Insurances';
            list.description = [new aas.types.LangStringTextType('en', 'List of active insurances')];
            list.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/Insurances/1/0'
                ),
            ]);

            let elementsExist = false;
            list.value = form.insurances
                .filter(
                    (i: any) =>
                        i && (i.insuranceType.trim() || i.insuranceCompany.trim() || i.insuranceSum.trim() !== '')
                )
                .map((i: any) => {
                    elementsExist = true;
                    const ins = new aas.types.SubmodelElementCollection();
                    ins.idShort = 'Insurance';
                    ins.description = [
                        new aas.types.LangStringTextType('en', 'Collection on information about an insurance'),
                    ];
                    ins.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/Insurance/1/0'
                        ),
                    ]);

                    const insElems: aas.types.ISubmodelElement[] = [];

                    if (i.insuranceCompany) {
                        const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                        p.idShort = 'InsuranceCompany';
                        p.value = i.insuranceCompany;
                        p.description = [
                            new aas.types.LangStringTextType('en', 'The provider of the insurance policy'),
                        ];
                        p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                            new aas.types.Key(
                                aas.types.KeyTypes.GlobalReference,
                                'https://admin-shell.io/idta/CompanyData/InsuranceCompany/1/0'
                            ),
                        ]);
                        insElems.push(p);
                    }

                    if (i.insuranceType) {
                        const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                        p.idShort = 'InsuranceType';
                        p.value = i.insuranceType;
                        p.description = [
                            new aas.types.LangStringTextType('en', 'The specific category of insurance coverage'),
                        ];
                        p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                            new aas.types.Key(
                                aas.types.KeyTypes.GlobalReference,
                                'https://admin-shell.io/idta/CompanyData/InsuranceType/1/0'
                            ),
                        ]);
                        insElems.push(p);
                    }

                    if (i.insuranceSum !== undefined && i.insuranceSum !== null && i.insuranceSum !== '') {
                        const p = new aas.types.Property(aas.types.DataTypeDefXsd.Integer);
                        p.idShort = 'InsuranceSum';
                        p.value = String(i.insuranceSum);
                        p.description = [
                            new aas.types.LangStringTextType(
                                'en',
                                'The amount of coverage provided by the insurance policy'
                            ),
                        ];
                        p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                            new aas.types.Key(
                                aas.types.KeyTypes.GlobalReference,
                                'https://admin-shell.io/idta/CompanyData/InsuranceSum/1/0'
                            ),
                        ]);
                        insElems.push(p);
                    }

                    ins.value = insElems;
                    return ins;
                });
            if (elementsExist) {
                rmElements.push(list);
            }
        }
        if (rmElements.length > 0) {
            riskManagement.value = rmElements;
            elements.push(riskManagement);
        }
    }
    // LegalCompliance
    if (form.legalCompliance.length > 0) {
        const legalCompliance = new aas.types.SubmodelElementList(
            aas.types.AasSubmodelElements.SubmodelElementCollection
        );
        legalCompliance.idShort = 'LegalCompliance';
        legalCompliance.description = [
            new aas.types.LangStringTextType(
                'en',
                "Contains a list of industry relevant regulations and the company's compliance to them"
            ),
        ];
        legalCompliance.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/LegalCompliance/1/0'
            ),
        ]);
        const regElems: aas.types.ISubmodelElement[] = [];

        legalCompliance.value = form.legalCompliance.map((r: any) => {
            const regulation = new aas.types.SubmodelElementCollection();
            regulation.idShort = 'Regulation';
            regulation.description = [
                new aas.types.LangStringTextType(
                    'en',
                    "Contains information about the company's compliance with a regulation"
                ),
            ];
            regulation.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                new aas.types.Key(
                    aas.types.KeyTypes.GlobalReference,
                    'https://admin-shell.io/idta/CompanyData/Regulation/1/0'
                ),
            ]);

            // ComplianceStatus (String)
            if (r.complianceStatus !== undefined && r.complianceStatus !== null && r.complianceStatus !== '') {
                const p = new aas.types.Property(aas.types.DataTypeDefXsd.String);
                p.idShort = 'ComplianceStatus';
                p.value = String(r.complianceStatus);
                p.description = [
                    new aas.types.LangStringTextType(
                        'en',
                        'Flag if the company is compliant or if the regulation is not applicable'
                    ),
                ];
                p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                    new aas.types.Key(
                        aas.types.KeyTypes.GlobalReference,
                        'https://admin-shell.io/idta/CompanyData/ComplianceStatus/1/0'
                    ),
                ]);
                regElems.push(p);
            }

            // ComplianceStatement (MultiLanguageProperty from array of { language, text })
            if (Array.isArray(r.complianceStatement) && r.complianceStatement.length > 0) {
                const strings = r.complianceStatement
                    .filter((ls: any) => ls.text.trim() !== '' && ls.language.trim() !== '')
                    .map((ls: any) => new aas.types.LangStringTextType(ls.language || 'en', String(ls.text)));

                if (strings.length > 0) {
                    const mlp = new aas.types.MultiLanguageProperty();
                    mlp.idShort = 'ComplianceStatement';
                    mlp.description = [
                        new aas.types.LangStringTextType(
                            'en',
                            'A declaration of relevancy and compliance by the company'
                        ),
                    ];
                    mlp.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                        new aas.types.Key(
                            aas.types.KeyTypes.GlobalReference,
                            'https://admin-shell.io/idta/CompanyData/ComplianceStatement/1/0'
                        ),
                    ]);
                    mlp.value = strings;
                    regElems.push(mlp);
                }
            }

            // DocumentationURI__00__ (AnyUri, 0..*)
            if (Array.isArray(r.documentationURIs) && r.documentationURIs.length > 0) {
                r.documentationURIs
                    .filter((u: any) => u !== undefined && u !== null && String(u) !== '')
                    .forEach((u: string, idx: number) => {
                        const p = new aas.types.Property(aas.types.DataTypeDefXsd.AnyUri);
                        p.idShort = 'DocumentationURI__0' + idx + '__';
                        p.value = String(u);
                        p.description = [
                            new aas.types.LangStringTextType(
                                'en',
                                'The web address where documentation can be accessed'
                            ),
                        ];
                        p.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                            new aas.types.Key(
                                aas.types.KeyTypes.GlobalReference,
                                'https://admin-shell.io/idta/CompanyData/DocumentationURI/1/0'
                            ),
                        ]);
                        regElems.push(p);
                    });
            }

            // DocumentationReference__00__ (ReferenceElement, 0..*)
            if (Array.isArray(r.documentationReferences) && r.documentationReferences.length > 0) {
                r.documentationReferences
                    .filter((docRef: any) => docRef)
                    .forEach((docRef: any, idx: number) => {
                        const ref = new aas.types.ReferenceElement();
                        ref.idShort = 'DocumentationReference__0' + idx + '__';
                        ref.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                            new aas.types.Key(aas.types.KeyTypes.AssetAdministrationShell, docRef),
                        ]);
                        ref.description = [
                            new aas.types.LangStringTextType('en', 'Reference to regulation compliance documentation'),
                        ];
                        ref.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
                            new aas.types.Key(
                                aas.types.KeyTypes.GlobalReference,
                                'https://admin-shell.io/idta/CompanyData/DocumentationReference/1/0'
                            ),
                        ]);
                        regElems.push(ref);
                    });
            }

            regulation.value = regElems;
            return regulation;
        });
        if (regElems.length > 0) {
            elements.push(legalCompliance);
        }
    }

    if (elements.length > 0) {
        const smc = new aas.types.SubmodelElementCollection();
        smc.description = [
            new aas.types.LangStringTextType('en', 'Policies and processes ensuring compliance within a company'),
        ];
        smc.idShort = 'CompanyGovernance';
        smc.semanticId = new aas.types.Reference(aas.types.ReferenceTypes.ExternalReference, [
            new aas.types.Key(
                aas.types.KeyTypes.GlobalReference,
                'https://admin-shell.io/idta/CompanyData/CompanyGovernance/1/0'
            ),
        ]);
        smc.value = elements;
        return smc;
    }
    return new aas.types.SubmodelElementCollection();
}
