<template>
  <v-btn
    icon="mdi-arrow-down"
    style="position: fixed; top: 70px; right: 16px; z-index: 999999999"
    @click="scrollToBottom"
  />
  <v-container>
    <v-stepper v-model="step">
      <v-stepper-header>
        <v-stepper-item :complete="step > 1" :value="1">Asset Information</v-stepper-item>
        <v-divider />
        <v-stepper-item :complete="step > 2" :value="2">Digital Nameplate</v-stepper-item>
        <v-divider />
        <v-stepper-item :complete="step > 3" :value="3">Technical Data</v-stepper-item>
        <v-divider />
        <v-stepper-item :complete="step > 4" :value="4">Handover Documentation</v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item :value="1">
          <StepAssetInformation :key="`asset-${resetForm}`" :is-active-component="step === 1" :next="goNext" :prev="goPrev" />
        </v-stepper-window-item>

        <v-stepper-window-item :value="2">
          <StepDigitalNamePlate :key="`nameplate-${resetForm}`" :is-active-component="step === 2" :next="goNext" :prev="goPrev" />
        </v-stepper-window-item>

        <v-stepper-window-item :value="3">
          <StepTechnicalData :key="`technical-${resetForm}`" :is-active-component="step === 3" :next="goNext" :prev="goPrev" />
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
