<script setup lang="ts">
  import type { AdministrativeInformation, CompanyDescriptor } from '@/composables/Client/CompanyLookup/types/company'
  import type { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import type { Reference } from '@aas-core-works/aas-core3.1-typescript/types'
  import type { VForm } from 'vuetify/components'
  import { computed, ref, watch } from 'vue'
  import MultiLanguageTextInput from '@/components/EditorComponents/InputTypes/MultiLanguageTextInput.vue'
  import ReferenceInput from '@/components/EditorComponents/InputTypes/ReferenceInput.vue'
  import { useCreateCompany } from '@/composables/Client/CompanyLookup/queries/useCreateCompany'
  import { useUpdateCompany } from '@/composables/Client/CompanyLookup/queries/useUpdateCompany'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { useCompanyLookupI18n } from '../../i18n/useCompanyLookupI18n'
  import { createCompanyDescriptorSchema } from '../../schemas/companyDescriptor'
  import { hasItems } from '../../utils/array'
  import { emptyAdministration, emptyFormData } from '../../utils/form'
  import { zodRule } from '../../utils/zodRule'
  import EndpointsForm from './EndpointsForm.vue'

  const { company } = defineProps<{ company?: CompanyDescriptor }>()
  const emit = defineEmits<{
    (e: 'saved', descriptor: CompanyDescriptor): void
    (e: 'closed'): void
  }>()
  const isOpen = defineModel<boolean>({ default: false })

  const { t, tm } = useCompanyLookupI18n()
  const navigationStore = useNavigationStore()

  const { mutateAsync: createCompany } = useCreateCompany()
  const { mutateAsync: updateCompany } = useUpdateCompany()

  const isEditMode = computed(() => !!company)
  const openPanels = ref<number[]>([0])

  const { companyDescriptorSchema, endpointSchema } = createCompanyDescriptorSchema(tm('validation'))
  const formRef = ref<VForm | null>(null)
  const isFormValid = computed(() => companyDescriptorSchema.safeParse(buildPayload()).success)
  const isSubmitting = ref(false)
  const submitError = ref<string | undefined>()
  const panelErrors = ref({ details: false, configuration: false, administration: false })

  const rules = {
    idShort: zodRule(companyDescriptorSchema.shape.idShort),
    name: zodRule(companyDescriptorSchema.shape.name),
    domain: zodRule(companyDescriptorSchema.shape.domain),
    endpointInterface: zodRule(endpointSchema.shape.interface),
    endpointHref: zodRule(endpointSchema.shape.protocolInformation.shape.href),
    regexList: (list?: string[]) => {
      if (!hasItems(list)) return true
      const parsed = companyDescriptorSchema.shape.assetIdRegexPatterns.safeParse(list)
      return parsed.success || (parsed.error.issues[0]?.message ?? t('validation.regex.invalid'))
    },
  }

  const formData = ref<CompanyDescriptor>(emptyFormData())
  const displayName = computed<aasTypes.LangStringTextType[] | null>({
    get: () => formData.value.displayName ?? null,
    set: d => {
      formData.value.displayName = d ?? undefined
    },
  })
  const description = computed<aasTypes.LangStringTextType[] | null>({
    get: () => formData.value.description ?? null,
    set: d => {
      formData.value.description = d ?? undefined
    },
  })

  const nameOptionsModel = computed<string[]>({
    get: () => formData.value.nameOptions ?? [],
    set: n => {
      formData.value.nameOptions = [...new Set(n.map(s => s.trim()).filter(Boolean))]
    },
  })

  const assetIdRegexPatterns = computed<string[]>({
    get: () => formData.value.assetIdRegexPatterns ?? [],
    set: a => {
      formData.value.assetIdRegexPatterns = [...new Set(a.map(s => s.trim()).filter(Boolean))]
    },
  })

  const administration = ref<AdministrativeInformation>(emptyAdministration())
  const creator = computed<Reference | null>({
    get: () => administration.value.creator ?? null,
    set: c => {
      administration.value.creator = c ?? undefined
    },
  })

  function initForm (initialCompany?: CompanyDescriptor): void {
    if (!initialCompany) {
      formData.value = emptyFormData()
      administration.value = emptyAdministration()
      return
    }
    // structuredClone fails when the object contains class instances (e.g., Reference)
    // eslint-disable-next-line unicorn/prefer-structured-clone
    const clone = JSON.parse(JSON.stringify(initialCompany)) as CompanyDescriptor
    formData.value = clone
    administration.value = {
      version: clone.administration?.version ?? null,
      revision: clone.administration?.revision ?? null,
      creator: clone.administration?.creator ?? null,
    }
  }

  watch(isOpen, opened => {
    if (!opened) return
    submitError.value = undefined
    openPanels.value = [0]
    initForm(company)
  })

  const detailsIds = new Set(['name', 'idShort', 'domain', 'nameOptions'])
  const adminIds = new Set(['administration.version', 'administration.revision'])

  watch(
    () => formRef.value?.errors ?? [],
    errors => {
      panelErrors.value = {
        details: errors.some(e => detailsIds.has(e.id.toString())),
        configuration: errors.some(e => e.id.toString().startsWith('endpoint-') || e.id.toString() === 'assetIdRegexPatterns'),
        administration: errors.some(e => adminIds.has(e.id.toString())),
      }
    },
    { deep: true, flush: 'post' },
  )

  function buildPayload (): CompanyDescriptor {
    const admin = administration.value
    const hasAdmin = !!(admin.version || admin.revision || admin.creator)
    return {
      ...formData.value,
      administration: hasAdmin
        ? {
          version: admin.version || undefined,
          revision: admin.revision || undefined,
          creator: admin.creator || undefined,
        }
        : undefined,
    }
  }

  async function onSubmit (): Promise<void> {
    if (isSubmitting.value) return
    submitError.value = undefined

    const parsed = companyDescriptorSchema.safeParse(buildPayload())
    if (!parsed.success) {
      // Trigger Vuetify to show per-field errors
      await formRef.value?.validate()
      return
    }

    isSubmitting.value = true
    try {
      const saved = isEditMode.value
        ? await updateCompany({ id: parsed.data.domain, descriptor: parsed.data })
        : await createCompany(parsed.data)
      emit('saved', saved)
      emit('closed')
      isOpen.value = false
    } catch (error) {
      const message = error instanceof Error ? error.message : t('form.error.generic')
      submitError.value = message
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 5000,
        color: 'error',
        btnColor: 'buttonText',
        text: isEditMode.value ? t('form.error.update') : t('form.error.create'),
      })
    } finally {
      isSubmitting.value = false
    }
  }

  function onClose (): void {
    if (isSubmitting.value) return
    isOpen.value = false
    emit('closed')
  }
</script>

<template>
  <v-dialog v-model="isOpen" max-width="860" persistent scrollable>
    <v-card>
      <v-card-title class="pa-4 bg-cardHeader d-flex align-center justify-space-between">
        <span class="text-h6">
          {{ t(`form.${isEditMode ? 'editTitle':'createTitle'}`) }}
        </span>

        <v-btn
          :aria-label="t('form.close')"
          density="comfortable"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="onClose"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-3 bg-card">
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-expansion-panels v-model="openPanels" eager multiple>
            <v-expansion-panel>
              <v-expansion-panel-title :class="{ 'text-error': panelErrors.details }">
                <v-icon v-if="panelErrors.details" class="mr-2" icon="mdi-alert-circle" />
                {{ t('form.section.details') }}
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-text-field
                  id="idShort"
                  v-model="formData.idShort"
                  class="mb-2"
                  density="comfortable"
                  :label="`${t('form.field.idShort')} *`"
                  :rules="[rules.idShort]"
                  variant="outlined"
                />

                <v-text-field
                  id="domain"
                  v-model="formData.domain"
                  class="mb-2"
                  density="comfortable"
                  :disabled="isEditMode"
                  :hint="isEditMode ? t('form.hint.domainReadOnly') : undefined"
                  :label="`${t('form.field.domain')} *`"
                  persistent-hint
                  :rules="[rules.domain]"
                  variant="outlined"
                />

                <v-text-field
                  id="name"
                  v-model="formData.name"
                  class="mb-2"
                  density="comfortable"
                  :label="`${t('form.field.name')} *`"
                  :rules="[rules.name]"
                  variant="outlined"
                />

                <v-combobox
                  id="nameOptions"
                  v-model="nameOptionsModel"
                  chips
                  class="mb-2"
                  closable-chips
                  density="comfortable"
                  :hint="t('form.hint.nameOptions')"
                  :label="t('form.field.nameOptions')"
                  multiple
                  persistent-hint
                  variant="outlined"
                />

                <div class="mb-6" />

                <MultiLanguageTextInput
                  v-model="displayName"
                  :label="t('form.field.displayName')"
                  :show-label="true"
                  type="displayName"
                />

                <MultiLanguageTextInput
                  v-model="description"
                  :label="t('form.field.description')"
                  :show-label="true"
                  type="description"
                />

              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title :class="{ 'text-error': panelErrors.configuration }">
                <v-icon v-if="panelErrors.configuration" class="mr-2" icon="mdi-alert-circle" />
                {{ t('form.section.configuration') }}
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <EndpointsForm
                  v-model="formData.endpoints"
                  :href-rule="rules.endpointHref"
                  :interface-rule="rules.endpointInterface"
                />

                <v-divider class="my-6" />

                <v-combobox
                  id="assetIdRegexPatterns"
                  v-model="assetIdRegexPatterns"
                  chips
                  closable-chips
                  density="comfortable"
                  :hint="t('form.hint.assetIdRegex')"
                  :label="t('form.field.assetIdRegex')"
                  multiple
                  persistent-hint
                  :rules="[rules.regexList]"
                  variant="outlined"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title :class="{ 'text-error': panelErrors.administration }">
                <v-icon v-if="panelErrors.administration" class="mr-2" icon="mdi-alert-circle" />
                {{ t('form.section.administration') }}
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-text-field
                  id="administration.version"
                  v-model="administration.version"
                  class="mb-2"
                  density="comfortable"
                  :label="t('form.field.version')"
                  variant="outlined"
                />

                <v-text-field
                  id="administration.revision"
                  v-model="administration.revision"
                  class="mb-2"
                  density="comfortable"
                  :label="t('form.field.revision')"
                  variant="outlined"
                />

                <ReferenceInput v-model="creator" :label="t('form.field.creator')" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>

        <v-alert
          v-if="submitError"
          class="mt-3"
          density="compact"
          style="white-space: pre-wrap;"
          type="error"
          variant="tonal"
        >
          {{ submitError }}
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />

        <v-btn :disabled="isSubmitting" variant="text" @click="onClose">
          {{ t('form.cancel') }}
        </v-btn>

        <v-btn
          color="primary"
          :disabled="!isFormValid"
          :loading="isSubmitting"
          @click="onSubmit"
        >
          {{ t(`form.${isEditMode ? 'update':'create'}`) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
