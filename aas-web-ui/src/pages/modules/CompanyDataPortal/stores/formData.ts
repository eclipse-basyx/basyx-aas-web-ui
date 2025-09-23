import { defineStore } from 'pinia';
export const useFormStore = defineStore('form', {
    state: () => ({
        companySMC: null,
        bankAccounts: null,
        digital: null,
        businessFigures: null,
        government: null,
        imageFile: null,
        pdfFile: [] as Array<File | null>,
        companyIDFormData: {} as Record<string, any>,
    }),

    actions: {
        saveCompanySMC(smc: any) {
            this.companySMC = smc;
        },

        saveBankAccountSMC(smc: any) {
            this.bankAccounts = smc;
        },

        saveDigitalSMC(smc: any) {
            this.digital = smc;
        },

        saveBusinessSMC(smc: any) {
            this.businessFigures = smc;
        },

        saveGovernmentSMC(smc: any) {
            this.government = smc;
        },
        setImageFile(file: any) {
            this.imageFile = file;
        },
        setPdfFile(index: number, pdf: any) {
            this.pdfFile[index] = pdf;
        },
        getPdfFile(): Array<File | null> {
            return this.pdfFile;
        },
        saveCompanyFormData(data: any) {
            this.companyIDFormData = data;
        },
    },
    getters: {
        getCompanyFormData: (state) => state.companyIDFormData,
    },
});

//TODO: smc can be stored. make json forms also can be stored here
// so that we can retrieve them in the last übersicht
