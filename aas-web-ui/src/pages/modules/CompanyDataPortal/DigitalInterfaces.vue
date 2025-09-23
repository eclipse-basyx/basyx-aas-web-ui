<template>
    <v-container class="py-6">
        <v-sheet border class="pa-6" rounded="lg" elevation="4">
            <v-form @submit.prevent="saveAndNext">
                <FormField label="ERP System Name" tip="The specific name of the enterprise resource planning system">
                    <v-text-field v-model="form.erpName" variant="outlined" density="comfortable" hide-details />
                </FormField>

                <FormField
                    label="ERP Version"
                    tip="The version number of the enterprise resource planning software in use">
                    <v-text-field v-model="form.erpVersion" variant="outlined" density="comfortable" hide-details />
                </FormField>

                <FormField
                    label="ERP System Reference"
                    tip="Reference to the Software Nameplate Submodel of the ERP system">
                    <v-text-field
                        v-model="form.erpReference"
                        type="url"
                        placeholder="https://aas.example.com/submodels/erp-xyz"
                        variant="outlined"
                        density="comfortable"
                        hide-details />
                </FormField>

                <v-divider class="my-4"></v-divider>

                <div class="text-subtitle-2 font-weight-bold mb-2">Email System</div>

                <FormField label="Email System Name" tip="The specific name of the email software used by the company">
                    <v-text-field v-model="form.emailSystem" variant="outlined" density="comfortable" hide-details />
                </FormField>

                <FormField
                    label="Email System Reference"
                    tip="Reference to the Software Nameplate Submodel of the email system.">
                    <v-text-field
                        v-model="form.emailSystemReference"
                        type="url"
                        placeholder="https://aas.example.com/submodels/email-outlook-001"
                        variant="outlined"
                        density="comfortable"
                        hide-details />
                </FormField>

                <v-divider class="my-4"></v-divider>

                <div class="text-subtitle-2 font-weight-bold mb-2">CAD Tools</div>
                <FormField label="CAD Tools" tip="Computer-aided design tool">
                    <v-combobox
                        v-model="form.cadTools"
                        multiple
                        chips
                        clearable
                        hide-details
                        variant="outlined"
                        density="comfortable"
                        placeholder="Type a tool name and press Enter" />
                </FormField>

                <v-divider class="my-4"></v-divider>

                <div class="text-subtitle-2 font-weight-bold mb-2">Data Exchange</div>

                <FormField
                    label="Encrypted Data Transmission"
                    tip="Indication if the company supports encrypted data transmission">
                    <v-select
                        v-model="form.encryptedDataTransmission"
                        :items="yesNoItems"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        placeholder="Select" />
                </FormField>

                <FormField
                    label="Outgoing E-Invoice Format"
                    tip="The format used by a company to send electronic invoices">
                    <v-text-field v-model="form.eInvoiceFormat" variant="outlined" density="comfortable" hide-details />
                </FormField>

                <FormField label="Supports EDI" tip="Indication if the company supports electronic data transfer">
                    <v-select
                        v-model="form.edi"
                        :items="yesNoItems"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        placeholder="Select" />
                </FormField>

                <FormField
                    label="Supports Web EDI"
                    tip="Indication if the company supports web-based electronic data transfer">
                    <v-select
                        v-model="form.webEdi"
                        :items="yesNoItems"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        placeholder="Select" />
                </FormField>

                <FormField
                    label="CAD File Formats"
                    tip="The file formats used for computer-aided design drawings and models at the company">
                    <v-combobox
                        v-model="form.cadFormats"
                        multiple
                        chips
                        clearable
                        hide-details
                        variant="outlined"
                        density="comfortable"
                        placeholder="Type a format (e.g., STEP, IGES) and press Enter" />
                </FormField>

                <v-row class="pt-6" align="center" justify="space-between">
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
    import { onMounted, reactive, ref } from 'vue';
    import FormField from './components/FormField.vue';
    import { useFormStore } from './stores/formData';
    import { createDigitalInterfacesSMC } from './utils/digitalInterfacesSmcBuilder';

    const showForm = ref(false);
    onMounted(() => {
        showForm.value = true;
    });

    const store = useFormStore();

    const form = reactive({
        erpName: '',
        erpVersion: '',
        erpReference: '',
        emailSystem: '',
        emailSystemReference: '',
        cadTools: [] as string[],
        encryptedDataTransmission: '',
        eInvoiceFormat: '',
        edi: '',
        webEdi: '',
        cadFormats: [] as string[],
    });

    const yesNoItems = ['Yes', 'No'];

    const props = defineProps<{
        next: () => void;
        prev: () => void;
        isActiveComponent: boolean;
    }>();

    function saveAndNext() {
        if (!props.isActiveComponent) {
            return;
        }
        const cleanedForm = Object.fromEntries(
            Object.entries(form)
                .map(([key, value]) => {
                    if (Array.isArray(value)) {
                        const arr = value
                            .map((s: any) => (typeof s === 'string' ? s.trim() : s))
                            .filter((s: any) => !!s);
                        return [key, arr.length ? arr : undefined];
                    }
                    const val = typeof value === 'string' ? value.trim() : value;
                    return [key, val ? value : undefined];
                })
                .filter(([, v]) => v !== undefined)
        );

        if (Object.keys(cleanedForm).length > 0) {
            const smc = createDigitalInterfacesSMC(cleanedForm as any);
            store.saveDigitalSMC(smc);
        }
        props.next();
    }
</script>

<style scoped>
    /* Vuetify handles styling and transitions */
</style>
