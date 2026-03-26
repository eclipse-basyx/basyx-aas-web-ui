<template>
    <v-container>
        <v-stepper v-model="step">
            <v-stepper-header>
                <v-stepper-item :value="1" :complete="step > 1">Asset Information</v-stepper-item>
                <v-divider />
                <v-stepper-item :value="2" :complete="step > 2">Digital Nameplate</v-stepper-item>
                <v-divider />
                <v-stepper-item :value="3" :complete="step > 3">Technical Data</v-stepper-item>
                <v-divider />
                <v-stepper-item :value="4" :complete="step > 4">Handover Documentation</v-stepper-item>
            </v-stepper-header>

            <v-stepper-window>
                <v-stepper-window-item :value="1">
                    <StepAssetInformation :next="goNext" :prev="goPrev" :is-active-component="step === 1" />
                </v-stepper-window-item>

                <v-stepper-window-item :value="2">
                    <StepDigitalNamePlate :next="goNext" :prev="goPrev" :is-active-component="step === 2" />
                </v-stepper-window-item>

                <v-stepper-window-item :value="3">
                    <StepTechnicalData :next="goNext" :prev="goPrev" :is-active-component="step === 3" />
                </v-stepper-window-item>

                <v-stepper-window-item :value="4">
                    <StepHandoverDocumentation :next="goNext" :prev="goPrev" :is-active-component="step === 4" />
                </v-stepper-window-item>
            </v-stepper-window>

            <!-- <v-stepper-actions @click:next="step < 4 ? step++ : null" @click:prev="step > 1 ? step-- : null" /> -->
        </v-stepper>
    </v-container>
</template>

<script lang="ts" setup>
    // const props = defineOptions({
    //     inheritAttrs: false,
    //     isDesktopModule: true,
    //     isMobileModule: false,
    // });
    import { ref } from 'vue';
    import StepAssetInformation from './components/StepAssetInformation.vue';
    import StepDigitalNamePlate from './components/StepDigitalNamePlate.vue';
    import StepHandoverDocumentation from './components/StepHandoverDocumentation.vue';
    import StepTechnicalData from './components/StepTechnicalData.vue';

    const step = ref(1);

    function goNext(): void {
        if (step.value < 4) {
            step.value++;
        }
    }

    function goPrev(): void {
        if (step.value > 1) {
            step.value--;
        }
    }
</script>
