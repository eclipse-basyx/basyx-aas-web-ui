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
        mainAccountIdShort: 'BankAccount__00__',
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
        saveMainAccountIdShort(idShort: string) {
            if (idShort && idShort.trim().length > 0) {
                this.mainAccountIdShort = idShort;
            } else {
                this.mainAccountIdShort = 'BankAccount__00__';
            }
        },
    },
    getters: {
        getCompanyFormData: (state) => state.companyIDFormData,
        getMainAccountIdShort: (state) => state.mainAccountIdShort,
    },
});
