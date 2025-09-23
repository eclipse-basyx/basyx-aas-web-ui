<template>
    <div>
        <v-container class="py-6">
            <v-sheet border class="pa-6" rounded="lg" elevation="4">
                <v-form @submit.prevent="initSave">
                    <!-- Corporate Policies -->
                    <div class="mb-2 text-subtitle-1 font-weight-bold">Corporate Policies</div>

                    <FormField label="Code of Conduct" tip="Reference to a code of conduct document">
                        <v-text-field
                            v-model="form.codeOfConduct"
                            type="url"
                            placeholder="https://example.com/code-of-conduct"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>

                    <FormField
                        label="General Terms and Conditions"
                        tip="Reference to a contractual terms and conditions document">
                        <v-text-field
                            v-model="form.generalTermsAndConditions"
                            type="url"
                            placeholder="https://example.com/terms"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>

                    <FormField
                        label="Quality Assurance Agreements"
                        tip="Reference to a quality assurance agreement document">
                        <v-text-field
                            v-model="form.qualityAssurance"
                            type="url"
                            placeholder="https://example.com/quality-agreement"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>

                    <v-divider class="my-4"></v-divider>

                    <!-- Industry Standards -->
                    <div class="mb-2 text-subtitle-1 font-weight-bold">Industry Standards</div>

                    <FormField
                        label="Industry Memberships"
                        tip="List any industry associations the company is a member of.">
                        <v-combobox
                            v-model="form.memberships"
                            multiple
                            chips
                            clearable
                            hide-details
                            variant="outlined"
                            density="comfortable"
                            placeholder="Type a membership and press Enter" />
                    </FormField>

                    <FormField label="Certifications" tip="Certifications which the company has acquired">
                        <v-expansion-panels variant="accordion">
                            <v-expansion-panel v-for="(cert, index) in form.certifications" :key="index">
                                <v-expansion-panel-title>
                                    Certification #{{ index + 1 }}
                                    <v-spacer />
                                    <v-btn
                                        icon="mdi-delete"
                                        variant="tonal"
                                        color="error"
                                        @click.stop="form.certifications.splice(index, 1)" />
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <FormField
                                        label="Certification Standard"
                                        tip="The identifier of the certification standard">
                                        <v-text-field
                                            v-model="cert.certificationStandard"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                    <FormField
                                        label="Approval Agency"
                                        tip="The organization which granted the certification">
                                        <v-text-field
                                            v-model="cert.approvalAgency"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                    <FormField label="Certificate Number" tip="The identifier of the certification">
                                        <v-text-field
                                            v-model="cert.certificateNumber"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                    <FormField label="Issue Date" tip="The date on which the certification was granted">
                                        <v-text-field
                                            v-model="cert.issueDate"
                                            type="date"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                    <FormField label="Expiry Date" tip="The date on which the certification expires">
                                        <v-text-field
                                            v-model="cert.expiryDate"
                                            type="date"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                    <FormField
                                        label="Certification URL"
                                        tip="The web address where the certification details can be verified">
                                        <v-text-field
                                            v-model="cert.certificationURL"
                                            type="url"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                    <FormField
                                        label="Certification Documents"
                                        tip="Optional list of links to official certification documents">
                                        <v-combobox
                                            v-model="cert.certificationDocuments"
                                            multiple
                                            chips
                                            clearable
                                            hide-details
                                            variant="outlined"
                                            density="comfortable"
                                            placeholder="Paste a document URL and press Enter" />
                                    </FormField>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>

                        <v-btn class="mt-2" variant="tonal" color="primary" @click="addCertification">
                            <v-icon start>mdi-plus</v-icon>
                            Add Certification
                        </v-btn>
                    </FormField>

                    <v-divider class="my-4"></v-divider>

                    <!-- Risk Management -->
                    <div class="mb-2 text-subtitle-1 font-weight-bold">Risk Management</div>

                    <FormField
                        label="Business Continuity Plan"
                        tip="Does your company have a business continuity plan?">
                        <v-select
                            v-model="form.businessContinuityPlan"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>

                    <div class="mb-2 text-subtitle-2 font-weight-bold">Security Policies</div>

                    <FormField
                        label="Information Security Policy"
                        tip="Indicate if the company has implemented an information security policy.">
                        <v-select
                            v-model="form.securityPolicies.informationSecurityPolicy"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField
                        label="Data Protection Policy"
                        tip="Indicate if the company has implemented a data protection policy.">
                        <v-select
                            v-model="form.securityPolicies.dataProtectionPolicy"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField label="Password Policy" tip="Flag if the company enforces a password policy for users.">
                        <v-select
                            v-model="form.securityPolicies.passwordPolicy"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField
                        label="Authorization Concept"
                        tip="Flag if the company has a defined concept for user authorizations.">
                        <v-select
                            v-model="form.securityPolicies.authorizationConcept"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField
                        label="Access Control Process"
                        tip="Flag if access to systems or data is controlled through formal processes.">
                        <v-select
                            v-model="form.securityPolicies.accessControlProcess"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField label="User Access Inventory" tip="Flag if there is an inventory of user access rights.">
                        <v-select
                            v-model="form.securityPolicies.userAccessInventory"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField
                        label="Permission Documentation"
                        tip="Flag if permission grants are documented systematically.">
                        <v-select
                            v-model="form.securityPolicies.permissionDocumentation"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField label="Locking System" tip="Flag if physical access is controlled by a locking system.">
                        <v-select
                            v-model="form.securityPolicies.lockingSystem"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField label="Key Allocation" tip="Flag if a key management system is in place.">
                        <v-select
                            v-model="form.securityPolicies.keyAllocation"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField label="Visitor Log" tip="Flag if visitors are logged during their stay on premises.">
                        <v-select
                            v-model="form.securityPolicies.visitorLog"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField label="Visitor Escort" tip="Flag if visitors are always escorted in secured areas.">
                        <v-select
                            v-model="form.securityPolicies.visitorEscort"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField label="Visitor Badge" tip="Flag if the company issues visitor badges during visits.">
                        <v-select
                            v-model="form.securityPolicies.visitorBadge"
                            :items="yesNoItems"
                            item-title="title"
                            item-value="value"
                            placeholder="Select"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>
                    <FormField
                        label="Customer Audits"
                        tip="Specify if customer audits are accepted (e.g., 'upon request', 'scheduled', 'not allowed').">
                        <v-text-field
                            v-model="form.securityPolicies.customerAudits"
                            placeholder="e.g. Scheduled on request"
                            variant="outlined"
                            density="comfortable"
                            hide-details />
                    </FormField>

                    <!-- Insurances -->
                    <div class="mb-2 text-subtitle-1 font-weight-bold">Insurances</div>
                    <v-slide-y-transition group>
                        <div v-for="(insurance, index) in form.insurances" :key="index" class="mb-3">
                            <v-card elevation="0" class="pa-4" variant="tonal">
                                <v-row dense>
                                    <v-col cols="12" md="4">
                                        <FormField label="Insurance Company" tip="Specify the insurance company name">
                                            <v-text-field
                                                v-model="insurance.insuranceCompany"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </FormField>
                                    </v-col>
                                    <v-col cols="12" md="4">
                                        <FormField label="Insurance Type" tip="Specify the type of insurance">
                                            <v-text-field
                                                v-model="insurance.insuranceType"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </FormField>
                                    </v-col>
                                    <v-col cols="12" md="4">
                                        <FormField label="Insurance Sum" tip="Specify the insurance sum">
                                            <v-text-field
                                                v-model.number="insurance.insuranceSum"
                                                type="number"
                                                variant="outlined"
                                                density="comfortable"
                                                hide-details />
                                        </FormField>
                                    </v-col>
                                </v-row>
                                <div class="d-flex justify-end">
                                    <v-btn variant="tonal" color="error" @click="form.insurances.splice(index, 1)">
                                        <v-icon start>mdi-delete</v-icon> Remove
                                    </v-btn>
                                </div>
                            </v-card>
                        </div>
                    </v-slide-y-transition>
                    <v-btn
                        class="mt-1"
                        variant="tonal"
                        color="primary"
                        @click="form.insurances.push({ insuranceCompany: '', insuranceType: '', insuranceSum: '' })">
                        <v-icon start>mdi-plus</v-icon> Add Insurance
                    </v-btn>

                    <v-divider class="my-4"></v-divider>

                    <!-- Employee Trainings -->
                    <div class="mb-2 text-subtitle-1 font-weight-bold">Employee Trainings</div>
                    <v-slide-y-transition group>
                        <div v-for="(training, index) in form.employeeTrainings" :key="index" class="mb-2">
                            <v-row dense>
                                <v-col cols="12" md="6">
                                    <FormField label="Type of Training" tip="Specify the type of employee training">
                                        <v-text-field
                                            v-model="training.typeOfTraining"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <FormField label="Training Documentation" tip="Specify the training documentation">
                                        <v-text-field
                                            v-model="training.trainingDocumentation"
                                            type="url"
                                            variant="outlined"
                                            density="comfortable"
                                            hide-details />
                                    </FormField>
                                </v-col>
                            </v-row>
                        </div>
                    </v-slide-y-transition>
                    <v-btn
                        variant="tonal"
                        color="primary"
                        @click="form.employeeTrainings.push({ typeOfTraining: '', trainingDocumentation: '' })">
                        <v-icon start>mdi-plus</v-icon> Add Training
                    </v-btn>

                    <v-divider class="my-4"></v-divider>

                    <!-- Legal Compliance -->
                    <div class="mb-2 text-subtitle-1 font-weight-bold">Legal Compliance</div>
                    <v-expansion-panels variant="accordion">
                        <v-expansion-panel v-for="(reg, index) in form.legalCompliance" :key="index">
                            <v-expansion-panel-title>
                                Regulation #{{ index + 1 }}
                                <v-spacer />
                                <v-btn
                                    icon="mdi-delete"
                                    variant="tonal"
                                    color="error"
                                    @click.stop="form.legalCompliance.splice(index, 1)" />
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <FormField
                                    label="Compliance Status"
                                    tip="Flag if the company has ensured compliance with the regulation, or if the regulation does not apply.">
                                    <v-select
                                        v-model="reg.complianceStatus"
                                        :items="complianceItems"
                                        placeholder="Select status"
                                        variant="outlined"
                                        density="comfortable"
                                        hide-details />
                                </FormField>

                                <FormField
                                    label="Compliance Statement"
                                    tip="A declaration of relevancy and compliance by the company">
                                    <div v-for="(entry, i) in reg.complianceStatement" :key="i" class="mb-2">
                                        <v-row dense>
                                            <v-col cols="12" md="3">
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
                                                    placeholder="Compliance statement in selected language"
                                                    auto-grow
                                                    rows="2"
                                                    variant="outlined"
                                                    density="comfortable"
                                                    hide-details />
                                            </v-col>
                                        </v-row>
                                    </div>
                                    <v-btn
                                        variant="tonal"
                                        color="primary"
                                        size="small"
                                        @click="reg.complianceStatement.push({ language: '', text: '' })"
                                        >+ Add Statement</v-btn
                                    >
                                </FormField>

                                <FormField
                                    label="Documentation URIs"
                                    tip="The web address where documentation can be accessed">
                                    <v-combobox
                                        v-model="reg.documentationURIs"
                                        multiple
                                        chips
                                        clearable
                                        hide-details
                                        variant="outlined"
                                        density="comfortable"
                                        placeholder="Paste a URI and press Enter" />
                                </FormField>

                                <FormField
                                    label="Documentation References"
                                    tip="Reference to regulation compliance documentation">
                                    <v-combobox
                                        v-model="reg.documentationReferences"
                                        multiple
                                        chips
                                        clearable
                                        hide-details
                                        variant="outlined"
                                        density="comfortable"
                                        placeholder="Paste a reference URL and press Enter" />
                                </FormField>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                    <v-btn class="mt-2" variant="tonal" color="primary" @click="addRegulation">
                        <v-icon start>mdi-plus</v-icon> Add Regulation
                    </v-btn>

                    <!-- Footer actions -->
                    <v-row class="pt-6" align="center" justify="space-between">
                        <v-col cols="auto">
                            <v-btn variant="elevated" color="grey" class="text-buttonText" @click="props.prev"
                                >Previous</v-btn
                            >
                        </v-col>
                        <v-col cols="auto">
                            <v-btn type="submit" color="green" class="text-buttonText">Save</v-btn>
                        </v-col>
                    </v-row>
                </v-form>
            </v-sheet>
        </v-container>
        <SaveModal
            :save="execSave"
            :close-dialog="
                () => {
                    showDialog = false;
                }
            "
            :show-dialog="showDialog" />
    </div>
</template>

<script setup lang="ts">
    import { reactive, ref } from 'vue';
    import FormField from './components/FormField.vue';
    import SaveModal from './components/SaveModal.vue';
    import { useFormStore } from './stores/formData';
    import { createAll, uploadConsolidatedDataFileByIndex } from './utils/aasAPI';
    import { createCompanyGovernanceSMC } from './utils/companyGovernanceSmcBuilder';
    import { jsonOfSubmodel } from './utils/mainSubmodel';

    const showDialog = ref(false);

    const props = defineProps<{
        prev: () => void;
        isActiveComponent: boolean;
    }>();

    const store = useFormStore();

    const yesNoItems = [
        { title: 'Yes', value: true },
        { title: 'No', value: false },
    ];
    const complianceItems = ['compliant', 'not applicable'];

    const form = reactive({
        codeOfConduct: '',
        generalTermsAndConditions: '',
        qualityAssurance: '',
        memberships: [] as string[],
        certifications: [] as Array<{
            certificationStandard: string;
            approvalAgency: string;
            certificateNumber: string;
            issueDate: string;
            expiryDate: string;
            certificationURL: string;
            certificationDocuments: string[];
        }>,
        businessContinuityPlan: null as boolean | null,
        employeeTrainings: [] as Array<{ typeOfTraining: string; trainingDocumentation: string }>,
        securityPolicies: {
            informationSecurityPolicy: null as boolean | null,
            dataProtectionPolicy: null as boolean | null,
            passwordPolicy: null as boolean | null,
            authorizationConcept: null as boolean | null,
            accessControlProcess: null as boolean | null,
            userAccessInventory: null as boolean | null,
            permissionDocumentation: null as boolean | null,
            lockingSystem: null as boolean | null,
            keyAllocation: null as boolean | null,
            visitorLog: null as boolean | null,
            visitorEscort: null as boolean | null,
            visitorBadge: null as boolean | null,
            customerAudits: '',
        },
        insurances: [] as Array<{ insuranceCompany: string; insuranceType: string; insuranceSum: number | string }>,
        legalCompliance: [] as Array<{
            complianceStatus: string;
            complianceStatement: Array<{ language: string; text: string }>;
            documentationURIs: string[];
            documentationReferences: string[];
        }>,
    });

    function addCertification(): void {
        form.certifications.push({
            certificationStandard: '',
            approvalAgency: '',
            certificateNumber: '',
            issueDate: '',
            expiryDate: '',
            certificationURL: '',
            certificationDocuments: [],
        });
    }

    function addRegulation(): void {
        form.legalCompliance.push({
            complianceStatus: '',
            complianceStatement: [{ language: 'en', text: '' }],
            documentationURIs: [],
            documentationReferences: [],
        });
    }

    async function save(
        aasId: string,
        smId: string,
        serverUrl: string,
        aasDisplayName: Array<{ language: string; text: string }>
    ): Promise<void> {
        const smc = createCompanyGovernanceSMC(form as any);
        if (smc !== null) {
            store.saveGovernmentSMC(smc);
        }
        try {
            const baseUrl = serverUrl;
            const image = store.imageFile ?? undefined;
            await createAll(baseUrl, aasId, smId, image, aasDisplayName);
            console.warn('AAS + Submodel created and linked successfully');
            const files = store.getPdfFile?.() ?? store.pdfFile ?? [];
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                if (!f) continue;
                await uploadConsolidatedDataFileByIndex({ baseUrl, index: i, data: f, fileName: (f as File).name });
            }
        } catch (err) {
            console.error('Failed to save AAS/Submodel:', err);
        }
        console.warn(jsonOfSubmodel());
    }

    function initSave(): void {
        if (!props.isActiveComponent) {
            return;
        }
        showDialog.value = true;
    }

    function execSave(
        aasId: string,
        smId: string,
        serverUrl: string,
        aasDisplayName: Array<{ language: string; text: string }>
    ): void {
        if (!props.isActiveComponent) {
            return;
        }
        save(aasId, smId, serverUrl, aasDisplayName);
        console.warn('Saving with AAS ID:', aasId, 'Submodel ID Prefix:', smId, 'to server:', serverUrl);
    }
</script>
