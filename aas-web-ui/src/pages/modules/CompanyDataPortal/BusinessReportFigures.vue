<template>
    <v-container class="py-6">
        <v-sheet border class="pa-6" rounded="lg" elevation="4">
            <!-- Import Buttons -->
            <div class="d-flex justify-center flex-wrap ga-2 mb-4">
                <v-btn variant="tonal" color="grey">Import PDF</v-btn>
                <v-btn variant="tonal" color="grey">Import CSV</v-btn>
                <v-btn variant="tonal" color="grey">Import from Bundesanzeiger</v-btn>
            </div>

            <v-form @submit.prevent="saveAndNext">
                <v-slide-y-transition group>
                    <div v-for="(form, index) in forms" :key="index" class="mb-6">
                        <div class="text-subtitle-1 font-weight-bold mb-2">
                            {{ index === 0 ? 'Last Report' : 'Business report figure ' + index }}
                        </div>

                        <FormField
                            label="Financial Year *"
                            tip="The 12-month period used for accounting and financial reporting">
                            <v-text-field
                                v-model="form.financialYear"
                                :error-messages="formErrors[index]?.financialYear || ''"
                                variant="outlined"
                                density="comfortable"
                                hide-details="auto" />
                        </FormField>

                        <FormField label="Begin of Report Time Frame *" tip="Start date of the reporting period">
                            <v-text-field
                                v-model="form.reportStart"
                                type="date"
                                :error-messages="formErrors[index]?.reportStart || ''"
                                variant="outlined"
                                density="comfortable"
                                hide-details="auto" />
                        </FormField>

                        <FormField label="End of Report Time Frame *" tip="End date of the reporting period">
                            <v-text-field
                                v-model="form.reportEnd"
                                type="date"
                                :error-messages="formErrors[index]?.reportEnd || ''"
                                variant="outlined"
                                density="comfortable"
                                hide-details="auto" />
                        </FormField>

                        <FormField label="Year of Publication" tip="Year the report was published">
                            <v-text-field
                                v-model="form.publicationYear"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>

                        <FormField label="Turnover" tip="Total revenue during the reporting period">
                            <v-text-field
                                v-model="form.turnover"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>

                        <FormField label="Investment Volume" tip="Total investment during the period">
                            <v-text-field
                                v-model="form.investmentVolume"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>

                        <FormField label="Equity Ratio" tip="Ratio of equity to total assets">
                            <v-text-field
                                v-model="form.equityRatio"
                                placeholder="e.g., 45%"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>

                        <FormField label="Total Employees" tip="Number of employees">
                            <v-text-field
                                v-model.number="form.totalEmployees"
                                type="number"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>

                        <v-divider class="my-4"></v-divider>

                        <!-- Customers -->
                        <div class="text-subtitle-1 font-weight-bold mb-2">Customers</div>

                        <FormField label="Total Number of Customers" tip="Optional. Total number served.">
                            <v-text-field
                                v-model.number="form.customerCount"
                                type="number"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>

                        <v-expansion-panels variant="accordion" class="mb-2">
                            <v-expansion-panel v-for="(customer, i) in form.customers" :key="i">
                                <v-expansion-panel-title
                                    >Reference Customer {{ (i as number) + 1 }}</v-expansion-panel-title
                                >
                                <v-expansion-panel-text>
                                    <FormField label="Customer Website" tip="Customer’s website">
                                        <v-text-field
                                            v-model="customer.customerWebsite"
                                            type="url"
                                            placeholder="https://example.com"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                    <FormField label="Reference to Customer" tip="AAS reference">
                                        <v-text-field
                                            v-model="customer.referenceToCustomer"
                                            type="url"
                                            placeholder="https://aas.example.com/submodels/customer-xyz"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>

                        <v-btn color="primary" variant="tonal" @click="addCustomer(index)">
                            <v-icon start>mdi-account-plus</v-icon>
                            Add Customer
                        </v-btn>

                        <FormField label="Upload Consolidated Data File" tip="Aggregated report data">
                            <v-file-input
                                prepend-icon="mdi-file"
                                accept="application/pdf,.csv,.xlsx,.xls,.json"
                                variant="outlined"
                                density="comfortable"
                                hide-details
                                @change="(files: any) => onFileSelected(files, index)" />
                        </FormField>

                        <v-divider class="my-6"></v-divider>
                    </div>
                </v-slide-y-transition>

                <!-- Navigation Buttons -->
                <v-row align="center" justify="space-between">
                    <v-col cols="auto">
                        <v-btn color="grey" variant="elevated" class="text-buttonText" @click="props.prev"
                            >Previous</v-btn
                        >
                    </v-col>
                    <v-col cols="auto">
                        <v-btn type="submit" color="green" class="text-buttonText">Next</v-btn>
                    </v-col>
                </v-row>
            </v-form>
        </v-sheet>
    </v-container>
</template>

<script setup lang="ts">
    import { onMounted, reactive, Ref, ref } from 'vue';
    import FormField from './components/FormField.vue';
    import { useFormStore } from './stores/formData';
    import { createBusinessReportFiguresSMC } from './utils/businessReportFiguresSmcBuilder';

    const showForm = ref(false);
    onMounted(() => {
        showForm.value = true;
    });

    const store = useFormStore();

    const formErrors = reactive<any[]>([]);
    const forms = reactive<any[]>([]);

    function addMore(): void {
        forms.push({
            financialYear: '',
            reportStart: '',
            reportEnd: '',
            publicationYear: '',
            turnover: '',
            investmentVolume: '',
            equityRatio: '',
            totalEmployees: '',
            customerCount: '',
            customers: [{ referenceToCustomer: '', customerWebsite: '' }],
            dataFile: null as File | null,
        });
        formErrors.push({ financialYear: '', reportStart: '', reportEnd: '' });
    }

    const FileRef: Ref<File | null> = ref(null);
    // TODO fix this function, file is not uploading Error 404 on BaSyx Dashboard
    function onFileSelected(files: File | File[] | null, index: number): void {
        const f = Array.isArray(files) ? files[0] : files || null;
        forms[index].dataFile = f;
        FileRef.value = f as File | null;
        store.setPdfFile(index, f as File | null);
    }

    function addCustomer(index: number): void {
        forms[index].customers.push({ referenceToCustomer: '', customerWebsite: '' });
    }

    function validateForm(): boolean {
        let valid = true;
        forms.forEach((form, index) => {
            formErrors[index].financialYear = '';
            formErrors[index].reportStart = '';
            formErrors[index].reportEnd = '';

            if (!form.financialYear?.trim()) {
                formErrors[index].financialYear = 'Financial Year is required.';
                valid = false;
            }
            if (!form.reportStart?.trim()) {
                formErrors[index].reportStart = 'Begin of Report Time Frame is required.';
                valid = false;
            }
            if (!form.reportEnd?.trim()) {
                formErrors[index].reportEnd = 'End of Report Time Frame is required.';
                valid = false;
            }
        });
        return valid;
    }

    function cleanForms(list: any[]): any[] {
        return list.map((form) => {
            const base: any = Object.fromEntries(
                Object.entries(form).filter(([k, v]) => k !== 'customers' && v !== null && v !== '' && v !== undefined)
            );
            const filteredCustomers = (form.customers || []).filter(
                (c: any) => (c.referenceToCustomer || '').trim() !== '' || (c.customerWebsite || '').trim() !== ''
            );
            if (filteredCustomers.length > 0) {
                base.customers = filteredCustomers.map((c: any) => ({
                    referenceToCustomer: c.referenceToCustomer?.trim() || '',
                    customerWebsite: c.customerWebsite?.trim() || '',
                }));
            }
            return base;
        });
    }

    const props = defineProps<{
        next: () => void;
        prev: () => void;
        isActiveComponent: boolean;
    }>();

    function saveAndNext(): void {
        if (!props.isActiveComponent) {
            return;
        }
        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const cleanedForms = cleanForms(forms);
        if (cleanedForms.length > 0) {
            const smc = createBusinessReportFiguresSMC(cleanedForms as any);
            store.saveBusinessSMC(smc);
        }
        props.next();
    }

    defineExpose({ addMore });
</script>
