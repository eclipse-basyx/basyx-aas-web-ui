<template>
  <v-container class="py-6">
    <v-sheet border class="pa-6" elevation="4" rounded="lg">
      <!-- Import Buttons -->
      <div class="d-flex justify-center flex-wrap ga-2 mb-4">
        <v-btn color="grey" variant="tonal">Import PDF</v-btn>
        <v-btn color="grey" variant="tonal">Import CSV</v-btn>
        <v-btn color="grey" variant="tonal">Import from Bundesanzeiger</v-btn>
      </div>

      <v-form @submit.prevent="saveAndNext">
        <v-slide-y-transition group>
          <div v-for="(form, index) in forms" :key="index" class="mb-6">
            <div class="text-body-large font-weight-bold mb-2">
              {{ index === 0 ? 'Last Report' : 'Business report figure ' + index }}
            </div>

            <FormField
              label="Financial Year *"
              tip="The 12-month period used for accounting and financial reporting"
            >
              <v-text-field
                v-model="form.financialYear"
                density="comfortable"
                :error-messages="formErrors[index]?.financialYear || ''"
                hide-details="auto"
                variant="outlined"
              />
            </FormField>

            <FormField label="Begin of Report Time Frame *" tip="Start date of the reporting period">
              <v-text-field
                v-model="form.reportStart"
                density="comfortable"
                :error-messages="formErrors[index]?.reportStart || ''"
                hide-details="auto"
                type="date"
                variant="outlined"
              />
            </FormField>

            <FormField label="End of Report Time Frame *" tip="End date of the reporting period">
              <v-text-field
                v-model="form.reportEnd"
                density="comfortable"
                :error-messages="formErrors[index]?.reportEnd || ''"
                hide-details="auto"
                type="date"
                variant="outlined"
              />
            </FormField>

            <FormField label="Year of Publication" tip="Year the report was published">
              <v-text-field
                v-model="form.publicationYear"
                density="comfortable"
                hide-details
                variant="outlined"
              />
            </FormField>

            <FormField label="Turnover" tip="Total revenue during the reporting period">
              <v-text-field
                v-model="form.turnover"
                density="comfortable"
                hide-details
                variant="outlined"
              />
            </FormField>

            <FormField label="Investment Volume" tip="Total investment during the period">
              <v-text-field
                v-model="form.investmentVolume"
                density="comfortable"
                hide-details
                variant="outlined"
              />
            </FormField>

            <FormField label="Equity Ratio" tip="Ratio of equity to total assets">
              <v-text-field
                v-model="form.equityRatio"
                density="comfortable"
                hide-details
                placeholder="e.g., 45%"
                variant="outlined"
              />
            </FormField>

            <FormField label="Total Employees" tip="Number of employees">
              <v-text-field
                v-model.number="form.totalEmployees"
                density="comfortable"
                hide-details
                type="number"
                variant="outlined"
              />
            </FormField>

            <v-divider class="my-4" />

            <!-- Customers -->
            <div class="text-body-large font-weight-bold mb-2">Customers</div>

            <FormField label="Total Number of Customers" tip="Optional. Total number served.">
              <v-text-field
                v-model.number="form.customerCount"
                density="comfortable"
                hide-details
                type="number"
                variant="outlined"
              />
            </FormField>

            <v-expansion-panels class="mb-2" variant="accordion">
              <v-expansion-panel v-for="(customer, i) in form.customers" :key="i">
                <v-expansion-panel-title>Reference Customer {{ (i as number) + 1 }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <FormField label="Customer Website" tip="Customer’s website">
                    <v-text-field
                      v-model="customer.customerWebsite"
                      density="comfortable"
                      hide-details
                      placeholder="https://example.com"
                      type="url"
                      variant="outlined"
                    />
                  </FormField>
                  <FormField label="Reference to Customer" tip="AAS reference">
                    <v-text-field
                      v-model="customer.referenceToCustomer"
                      density="comfortable"
                      hide-details
                      placeholder="https://aas.example.com/submodels/customer-xyz"
                      type="url"
                      variant="outlined"
                    />
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
                accept="application/pdf,.csv,.xlsx,.xls,.json"
                density="comfortable"
                hide-details
                prepend-icon="mdi-file"
                variant="outlined"
                @change="(files: any) => onFileSelected(files, index)"
              />
            </FormField>

            <v-divider class="my-6" />
          </div>
        </v-slide-y-transition>

        <!-- Navigation Buttons -->
        <v-row align="center" justify="space-between">
          <v-col cols="auto">
            <v-btn
              class="text-buttonText"
              color="grey"
              variant="elevated"
              @click="props.prev"
            >Previous</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn class="text-buttonText" color="green" type="submit">Next</v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
  import type { Ref } from 'vue'
  import { onMounted, reactive, ref } from 'vue'
  import FormField from './components/FormField.vue'
  import { useFormStore } from './stores/formData'
  import { createBusinessReportFiguresSMC } from './utils/businessReportFiguresSmcBuilder'

  const showForm = ref(false)
  onMounted(() => {
    showForm.value = true
  })

  const store = useFormStore()

  const formErrors = reactive<any[]>([])
  const forms = reactive<any[]>([])

  function addMore (): void {
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
    })
    formErrors.push({ financialYear: '', reportStart: '', reportEnd: '' })
  }

  const FileRef: Ref<File | null> = ref(null)
  // TODO fix this function, file is not uploading Error 404 on BaSyx Dashboard
  function onFileSelected (files: File | File[] | null, index: number): void {
    const f = Array.isArray(files) ? files[0] : files || null
    forms[index].dataFile = f
    FileRef.value = f as File | null
    store.setPdfFile(index, f as File | null)
  }

  function addCustomer (index: number): void {
    forms[index].customers.push({ referenceToCustomer: '', customerWebsite: '' })
  }

  function validateForm (): boolean {
    let valid = true
    for (const [index, form] of forms.entries()) {
      formErrors[index].financialYear = ''
      formErrors[index].reportStart = ''
      formErrors[index].reportEnd = ''

      if (!form.financialYear?.trim()) {
        formErrors[index].financialYear = 'Financial Year is required.'
        valid = false
      }
      if (!form.reportStart?.trim()) {
        formErrors[index].reportStart = 'Begin of Report Time Frame is required.'
        valid = false
      }
      if (!form.reportEnd?.trim()) {
        formErrors[index].reportEnd = 'End of Report Time Frame is required.'
        valid = false
      }
    }
    return valid
  }

  function cleanForms (list: any[]): any[] {
    return list.map(form => {
      const base: any = Object.fromEntries(
        Object.entries(form).filter(([k, v]) => k !== 'customers' && v !== null && v !== '' && v !== undefined),
      )
      const filteredCustomers = (form.customers || []).filter(
        (c: any) => (c.referenceToCustomer || '').trim() !== '' || (c.customerWebsite || '').trim() !== '',
      )
      if (filteredCustomers.length > 0) {
        base.customers = filteredCustomers.map((c: any) => ({
          referenceToCustomer: c.referenceToCustomer?.trim() || '',
          customerWebsite: c.customerWebsite?.trim() || '',
        }))
      }
      return base
    })
  }

  const props = defineProps<{
    next: () => void
    prev: () => void
    isActiveComponent: boolean
  }>()

  function saveAndNext (): void {
    if (!props.isActiveComponent) {
      return
    }
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const cleanedForms = cleanForms(forms)
    if (cleanedForms.length > 0) {
      const smc = createBusinessReportFiguresSMC(cleanedForms as any)
      store.saveBusinessSMC(smc)
    }
    props.next()
  }

  defineExpose({ addMore })
</script>
