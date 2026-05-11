<template>
  <v-btn
    icon="mdi-arrow-down"
    style="position: fixed; top: 70px; right: 16px; z-index: 999999999"
    @click="scrollToBottom"
  />

  <v-container class="aas-wizard-container" fluid>
    <v-stepper v-model="step" class="aas-wizard-stepper" elevation="0">
      <v-stepper-header class="aas-stepper-header">
        <v-stepper-item color="primary" :complete="step > 1" :value="1">Asset Information</v-stepper-item>
        <v-divider />
        <v-stepper-item color="primary" :complete="step > 2" :value="2">Digital Nameplate</v-stepper-item>
        <v-divider />
        <v-stepper-item color="primary" :complete="step > 3" :value="3">Technical Data</v-stepper-item>
        <v-divider />
        <v-stepper-item color="primary" :complete="step > 4" :value="4">Handover Documentation</v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item :value="1">
          <StepAssetInformation
            :key="`asset-${resetForm}`"
            color="primary"
            :is-active-component="step === 1"
            :next="goNext"
            :prev="goPrev"
          />
        </v-stepper-window-item>

        <v-stepper-window-item :value="2">
          <StepDigitalNamePlate
            :key="`nameplate-${resetForm}`"
            color="primary"
            :is-active-component="step === 2"
            :next="goNext"
            :prev="goPrev"
          />
        </v-stepper-window-item>

        <v-stepper-window-item :value="3">
          <StepTechnicalData
            :key="`technical-${resetForm}`"
            color="primary"
            :is-active-component="step === 3"
            :next="goNext"
            :prev="goPrev"
          />
        </v-stepper-window-item>

        <v-stepper-window-item :value="4">
          <StepHandoverDocumentation
            :key="`handover-${resetForm}`"
            :finish="resetToFirstStep"
            :is-active-component="step === 4"
            :next="goNext"
            :prev="goPrev"
          />
        </v-stepper-window-item>
      </v-stepper-window>

    </v-stepper>
  </v-container>

  <v-btn
    icon="mdi-arrow-up"
    style="position: fixed; bottom: 64px; right: 16px; z-index: 999999999"
    @click="scrollToTop"
  />
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import StepAssetInformation from './components/StepAssetInformation.vue'
  import StepDigitalNamePlate from './components/StepDigitalNamePlate.vue'
  import StepHandoverDocumentation from './components/StepHandoverDocumentation.vue'
  import StepTechnicalData from './components/StepTechnicalData.vue'

  const step = ref(1)
  const resetForm = ref(0)

  function goNext (): void {
    if (step.value < 4) {
      step.value++
    }
  }

  function goPrev (): void {
    if (step.value > 1) {
      step.value--
    }
  }
  function scrollToTop (): void {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function scrollToBottom (): void {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }
  function resetToFirstStep (): void {
    resetForm.value++
    step.value = 1
  }
</script>
<style scoped>
.aas-wizard-container {
  max-width: 1480px;
  padding-top: 16px;
}

.aas-wizard-stepper {
  border: 1px solid rgba(var(--v-border-color), 0.18);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  box-shadow: none;
  overflow: hidden;
}

.aas-stepper-header {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 24px;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.aas-wizard-stepper :deep(.v-stepper-header) {
  box-shadow: none;
}

.aas-wizard-stepper :deep(.v-stepper-window) {
  margin: 0;
}

.aas-wizard-stepper :deep(.v-stepper-item__title) {
  font-weight: 500;
}

.aas-wizard-stepper :deep(.v-stepper-item--selected .v-stepper-item__title) {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.aas-wizard-stepper :deep(.v-stepper-item--selected .v-stepper-item__avatar) {
  transform: scale(1.08);
}
</style>
