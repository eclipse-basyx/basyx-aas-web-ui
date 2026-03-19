export type TemplateElement = {
    idShort: string;
    modelType: string;
    valueType?: string;
};

export type DigitalNameplateTemplate = {
    idShort: string;
    submodelElements: TemplateElement[];
};
