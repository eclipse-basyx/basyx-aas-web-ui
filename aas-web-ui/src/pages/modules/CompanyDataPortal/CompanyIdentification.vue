<template>
    <v-container class="py-6">
        <v-sheet border class="pa-6" rounded="lg" elevation="4">
            <v-form ref="formRef" @submit.prevent="saveAndNext">
                <!-- Company Name & Logo -->
                <v-row class="mb-2">
                    <v-col cols="12">
                        <FormField
                            label="Company Name *"
                            tip="Legally valid name under which a company or organization is registered and conducts business">
                            <v-text-field
                                v-model="form.CompanyName"
                                :rules="companyNameRules"
                                variant="outlined"
                                hide-details="auto"
                                density="comfortable" />
                        </FormField>
                    </v-col>

                    <v-col cols="12">
                        <FormField
                            label="Company Logo"
                            tip="Imagefile for logo of the company provided in common format (.png, .jpg)">
                            <v-file-input
                                accept="image/*"
                                prepend-icon="mdi-image"
                                variant="outlined"
                                density="comfortable"
                                hide-details
                                @change="onLogoSelected" />
                        </FormField>
                    </v-col>
                </v-row>

                <!-- Company Description (multi-lang) -->
                <v-row>
                    <v-col cols="12">
                        <FormField
                            label="Company Description"
                            tip="A short summary of the company's main activities, products or services, and its mission or vision">
                            <v-slide-y-transition group>
                                <div
                                    v-for="(entry, index) in form.CompanyDescription"
                                    :key="`desc-${index}`"
                                    class="mb-3">
                                    <v-row align="center" no-gutters>
                                        <v-col cols="12" md="3" class="pr-md-2">
                                            <v-text-field
                                                v-model="entry.language"
                                                placeholder="e.g., en"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" md="9">
                                            <v-textarea
                                                v-model="entry.text"
                                                placeholder="Description in selected language"
                                                variant="outlined"
                                                density="comfortable"
                                                rows="3"
                                                auto-grow
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" class="mt-1">
                                            <v-btn
                                                variant="tonal"
                                                color="error"
                                                size="small"
                                                @click="form.CompanyDescription.splice(index, 1)">
                                                Remove
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-slide-y-transition>

                            <v-btn
                                variant="tonal"
                                color="primary"
                                size="small"
                                @click="form.CompanyDescription.push({ language: '', text: '' })">
                                + Add Description
                            </v-btn>
                        </FormField>
                    </v-col>
                </v-row>

                <!-- Homepage URL (multi-lang) -->
                <v-row>
                    <v-col cols="12">
                        <FormField
                            label="Homepage URL"
                            tip="Web address of the company's official website, for customers and interested parties">
                            <v-slide-y-transition group>
                                <div v-for="(entry, index) in form.HomepageURL" :key="`url-${index}`" class="mb-3">
                                    <v-row align="center" no-gutters>
                                        <v-col cols="12" md="3" class="pr-md-2">
                                            <v-text-field
                                                v-model="entry.language"
                                                placeholder="e.g., en"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" md="9">
                                            <v-text-field
                                                v-model="entry.text"
                                                type="url"
                                                placeholder="https://example.com"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" class="mt-1">
                                            <v-btn
                                                variant="tonal"
                                                color="error"
                                                size="small"
                                                @click="form.HomepageURL.splice(index, 1)">
                                                Remove
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-slide-y-transition>

                            <v-btn
                                variant="tonal"
                                color="primary"
                                size="small"
                                @click="form.HomepageURL.push({ language: '', text: '' })">
                                + Add URL
                            </v-btn>
                        </FormField>
                    </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <!-- Tax IDs -->
                <v-row>
                    <v-col cols="12" md="6">
                        <FormField
                            label="VAT Number"
                            tip="Value Added Tax identification number required by companies in the European Union for handling VAT transactions">
                            <v-text-field
                                v-model="form.VATNumber"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>
                    </v-col>
                    <v-col cols="12" md="6">
                        <FormField label="Tax Number" tip="Identifier assigned to a company by the tax authority">
                            <v-text-field
                                v-model="form.TaxNumber"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>
                    </v-col>
                    <v-col cols="12" md="6">
                        <FormField
                            label="DUNS"
                            tip="Data Universal Numbering System number, a unique nine-digit identifier assigned by Dun & Bradstreet to identify companies globally">
                            <v-text-field v-model="form.DUNS" variant="outlined" density="comfortable" hide-details />
                        </FormField>
                    </v-col>
                    <v-col cols="12" md="6">
                        <FormField
                            label="Commercial Register Number"
                            tip="The number under which a company is registered in the commercial register">
                            <v-text-field
                                v-model="form.CommercialRegisterNumber"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>
                    </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <!-- Other fields -->
                <v-row>
                    <v-col cols="12" md="6">
                        <FormField label="Founding Year" tip="The year in which the company was established">
                            <v-text-field
                                v-model="form.FoundingYear"
                                type="number"
                                variant="outlined"
                                density="comfortable"
                                hide-details />
                        </FormField>
                    </v-col>

                    <v-col cols="12">
                        <FormField
                            label="Order Currency"
                            tip="Provide currency name in multiple languages if relevant for international users.">
                            <v-slide-y-transition group>
                                <div
                                    v-for="(entry, index) in form.OrderCurrency"
                                    :key="`currency-${index}`"
                                    class="mb-3">
                                    <v-row align="center" no-gutters>
                                        <v-col cols="12" md="3" class="pr-md-2">
                                            <v-text-field
                                                v-model="entry.language"
                                                placeholder="e.g., en"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" md="9">
                                            <v-text-field
                                                v-model="entry.text"
                                                placeholder="e.g., Euro"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" class="mt-1">
                                            <v-btn
                                                variant="tonal"
                                                color="error"
                                                size="small"
                                                @click="form.OrderCurrency.splice(index, 1)"
                                                >Remove</v-btn
                                            >
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-slide-y-transition>
                            <v-btn
                                variant="tonal"
                                color="primary"
                                size="small"
                                @click="form.OrderCurrency.push({ language: '', text: '' })">
                                + Add Currency
                            </v-btn>
                        </FormField>
                    </v-col>

                    <v-col cols="12">
                        <FormField
                            label="Main Product Group"
                            tip="Provide the main product group name in one or more languages.">
                            <v-slide-y-transition group>
                                <div v-for="(entry, index) in form.MainProductGroup" :key="`mpg-${index}`" class="mb-3">
                                    <v-row align="center" no-gutters>
                                        <v-col cols="12" md="3" class="pr-md-2">
                                            <v-text-field
                                                v-model="entry.language"
                                                placeholder="e.g., en, de"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" md="9">
                                            <v-text-field
                                                v-model="entry.text"
                                                placeholder="A category of products that the company offers"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" class="mt-1">
                                            <v-btn
                                                variant="tonal"
                                                color="error"
                                                size="small"
                                                @click="form.MainProductGroup.splice(index, 1)"
                                                >Remove</v-btn
                                            >
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-slide-y-transition>

                            <v-btn
                                variant="tonal"
                                color="primary"
                                size="small"
                                @click="form.MainProductGroup.push({ language: '', text: '' })">
                                + Main Product Group
                            </v-btn>
                        </FormField>
                    </v-col>

                    <v-col cols="12">
                        <FormField label="Industries" tip="The sectors in which the company operates">
                            <v-slide-y-transition group>
                                <div v-for="(entry, index) in form.Industries" :key="`ind-${index}`" class="mb-3">
                                    <v-row align="center" no-gutters>
                                        <v-col cols="12" md="3" class="pr-md-2">
                                            <v-text-field
                                                v-model="entry.language"
                                                placeholder="e.g., en, de"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" md="9">
                                            <v-text-field
                                                v-model="entry.text"
                                                placeholder="An industry sector"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </v-col>
                                        <v-col cols="12" class="mt-1">
                                            <v-btn
                                                variant="tonal"
                                                color="error"
                                                size="small"
                                                @click="form.Industries.splice(index, 1)"
                                                >Remove</v-btn
                                            >
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-slide-y-transition>

                            <v-btn
                                variant="tonal"
                                color="primary"
                                size="small"
                                @click="form.Industries.push({ language: '', text: '' })">
                                + Add industry
                            </v-btn>
                        </FormField>
                    </v-col>
                </v-row>

                <!-- Actions -->
                <v-row class="pt-4" align="center" justify="space-between">
                    <v-spacer></v-spacer>
                    <v-col cols="auto">
                        <v-btn type="submit" color="green" class="text-buttonText"> Next </v-btn>
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
    import { createCompanyIdentificationSMC } from './utils/companySmcBuilder';
    //prop with save function
    const props = defineProps<{
        next: () => void;
        prev: () => void;
        isActiveComponent: boolean;
    }>();

    const form = reactive({
        CompanyName: '',
        CompanyLogo: null as File | null,
        CompanyDescription: [{ language: 'en', text: '' }],
        HomepageURL: [{ language: 'en', text: '' }],
        VATNumber: '',
        TaxNumber: '',
        DUNS: '',
        CommercialRegisterNumber: '',
        FoundingYear: '',
        OrderCurrency: [{ language: 'en', text: '' }],
        MainProductGroup: [{ language: 'en', text: '' }],
        Industries: [{ language: 'en', text: '' }],
    });

    const store = useFormStore();

    const showForm = ref(false);
    const formRef = ref();

    onMounted(() => {
        showForm.value = true;
    });

    const companyNameRules = [(v: string) => !!(v && v.trim()) || 'Company Name is required.'];

    const logoFile: Ref<File | null> = ref(null);
    // TODO fix this function, file is not uploading Error 404 on BaSyx Dashboard
    function onLogoSelected(files: File | File[] | null): void {
        const f = Array.isArray(files) ? files[0] : files || null;
        logoFile.value = f as File | null;
        form.CompanyLogo = f as File | null;
        store.setImageFile(f as File | null);
    }

    async function saveAndNext(): Promise<void> {
        if (!props.isActiveComponent) {
            return;
        }
        // Vuetify form validation
        const result = await formRef.value?.validate?.();
        if (result && result.valid === false) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Manual fallback validation for SSR or if ref missing
        if (!(form.CompanyName && form.CompanyName.trim())) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const filteredForm = Object.fromEntries(
            Object.entries(form)
                .map(([key, value]) => {
                    if (Array.isArray(value)) {
                        const cleaned = value.filter((entry: any) => entry.language?.trim() && entry.text?.trim());
                        return [key, cleaned.length ? cleaned : undefined];
                    }
                    // stringify only for check, keep original value otherwise
                    const hasValue = typeof value === 'string' ? value?.toString().trim() : value;
                    return [key, hasValue ? value : undefined];
                })
                .filter(([, v]) => v !== undefined)
        );

        const smc = createCompanyIdentificationSMC(filteredForm as any);
        store.saveCompanySMC(smc);
        props.next();
    }
</script>
