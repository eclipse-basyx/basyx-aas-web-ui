<template>
  <v-container class="py-6">
    <v-sheet border class="pa-6" elevation="4" rounded="lg">
      <v-form @submit.prevent="saveAndNext">
        <div v-for="(form, index) in forms" :key="index" class="mb-3">
          <v-sheet border class="pa-4 mb-4" elevation="2" rounded="lg">
            <BankAccountForm v-model="forms[index]" :errors="formErrors[index]" :index="index" />
          </v-sheet>
        </div>
        <v-row align="center" :class="forms.length > 0 ? 'pt-6' : ''" justify="space-between">
          <v-col cols="auto">
            <v-btn class="text-buttonText" color="grey" variant="elevated" @click="props.prev">
              Previous
            </v-btn>
          </v-col>
          <v-col cols="auto">
            <div v-if="forms.length === 0">Add a bank account (optional) to proceed.</div>
            <div v-else>
              You can add more bank accounts by pressing the "+ Add New" button in the top right.
            </div>
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
  import { onMounted, reactive, ref } from 'vue'
  import BankAccountForm from './components/BankAccountForm.vue'
  import { useFormStore } from './stores/formData'
  import { createBankAccountsSMC } from './utils/bankAccountSmcBuilder'

  interface BankAccountFormData {
    idShort: string
    accountHolder: string
    accountType: string
    iban: string
    bic: string
  }

  interface FormErrors {
    accountHolder?: string
    iban?: string
    bic?: string
  }

  const showForm = ref(false)
  onMounted(() => {
    showForm.value = true
  })

  const store = useFormStore()

  const forms = reactive<BankAccountFormData[]>([])
  const formErrors = reactive<FormErrors[]>([])

  const props = defineProps<{
    next: () => void
    prev: () => void
    isActiveComponent: boolean
  }>()

  function addMore (): void {
    forms.push({
      idShort: '',
      accountHolder: '',
      accountType: '',
      iban: '',
      bic: '',
    })
    formErrors.push({
      accountHolder: '',
      iban: '',
      bic: '',
    })
  }

  function validateForm (): boolean {
    let valid = true
    for (const [index, form] of forms.entries()) {
      formErrors[index].accountHolder = ''
      formErrors[index].iban = ''
      formErrors[index].bic = ''

      if (!form.accountHolder?.trim()) {
        formErrors[index].accountHolder = 'Account Holder is required.'
        valid = false
      }
      if (!form.iban?.trim()) {
        formErrors[index].iban = 'IBAN is required.'
        valid = false
      }
      if (!form.bic?.trim()) {
        formErrors[index].bic = 'BIC is required.'
        valid = false
      }
    }
    return valid
  }

  function saveAndNext (): void {
    if (!props.isActiveComponent) {
      return
    }
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const filteredForm = forms.map(form => {
      const cleaned = Object.fromEntries(
        Object.entries(form)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              const cleanedArray = value.filter(entry =>
                typeof entry === 'object'
                  ? Object.values(entry).some(v => v?.toString().trim())
                  : entry?.toString().trim(),
              )
              return [key, cleanedArray.length > 0 ? cleanedArray : undefined]
            }
            return [key, value?.toString().trim() ? value : undefined]
          })
          .filter(([, v]) => v !== undefined),
      )
      return cleaned
    })

    if (filteredForm.length > 0) {
      const smc = createBankAccountsSMC(filteredForm)
      store.saveBankAccountSMC(smc)
      store.saveMainAccountIdShort(filteredForm[0].idShort || 'BankAccount__00__')
    }
    props.next()
  }

  defineExpose({
    addMore,
  })
</script>

<style scoped>
    /* Transitions are handled by Vuetify components */
</style>
