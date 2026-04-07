<template>
  <v-container class="py-6">
    <v-sheet border class="pa-6" elevation="4" rounded="lg">
      <v-form ref="formRef" @submit.prevent="saveAndNext">
        <v-row>
          <v-col cols="12">
            <div class="mb-6">
              <div class="text-h6 font-weight-bold">Digital Nameplate</div>
              <div class="text-body-2 text-medium-emphasis">
                Nameplate information attached to the product
              </div>
            </div>
          </v-col>
          <!-- <v-col v-for="element in template.submodelElements" :key="element.idShort" cols="12">
                        <FormField :label="formatLabel(element.idShort)">
                            <v-text-field
                                v-if="element.modelType === 'Property' && element.valueType === 'string'"
                                v-model="formValues[element.idShort]"
                                variant="outlined"
                                density="comfortable"
                                hide-details="auto" />
                        </FormField>
                    </v-col> -->
          <v-col>
            <NameplateRenderer
              :elements="templateData.submodelElements"
              :form-state="formValues"
              @update:form-state="onFormStateUpdate"
            />
          </v-col>
          <v-col class="d-flex justify-space-between mt-4" cols="12">
            <v-btn color="primary" @click="props.prev"> Back </v-btn>

            <v-btn color="primary" type="submit"> Next </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-sheet>
  </v-container>
</template>
<script lang="ts" setup>
  import type { FormStateObject } from '../types/form'
  import type { DigitalNameplateTemplate } from '../types/template'
  import { onMounted, ref } from 'vue'
  // import { buildDigitalNameplate } from '../builders/buildDigitalNameplate';
  // import { useAASCreationStore } from '../stores/aasCreationForm';
  import template from '../templates/digital-nameplate.json'
  import { createInitialFormState } from '../utils/createInitialFormState'
  import NameplateRenderer from './renderer/NamePlateRenderer.vue'

  const props = defineProps<{
    next: () => void
    prev: () => void
    isActiveComponent: boolean
  }>()

  // const store = useAASCreationStore();
  const formRef = ref()

  const templateData = template as DigitalNameplateTemplate

  const formValues = ref<FormStateObject>(createInitialFormState(templateData))

  onMounted(() => {
    console.log('templatedata is', templateData)
    console.log('formvalues is', formValues)
    // const existingData = store.digitalNameplateData;
    const initialState = createInitialFormState(templateData)
    console.log('initial digital nameplate form state:', initialState)
    // for (const element of templateData.submodelElements) {
    //     const storedElement = existingData?.submodelElements?.find((item) => item.idShort === element.idShort);
    //     formValues[element.idShort] = storedElement?.value ?? '';
    // }
  })
  // Function to save form values from UI into central store
  async function saveAndNext (): Promise<void> {
    console.log('saveAndNext clicked')
    if (!props.isActiveComponent) {
      return
    }

    // store.saveDigitalNameplateData({ ...formValues });
    // const builtDigitalNameplate = buildDigitalNameplate({ ...formValues });

    // store.saveDigitalNameplateData(builtDigitalNameplate);

    // console.log('digital nameplate data is', store.digitalNameplateData);
    // console.log('built data is', builtDigitalNameplate);
    props.next()
  }
  function onFormStateUpdate (value: FormStateObject): void {
    formValues.value = value
  }
</script>
