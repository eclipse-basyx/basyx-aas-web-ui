<template>
    <v-container fluid class="pa-3">
        <PcfProductSelection v-if="step === 1" v-model="step" @finished="finishedSelection" />
        <PcfMaterialComposition v-if="step === 2" v-model="step" :shell="newShell" />
    </v-container>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import PcfMaterialComposition from '@/pages/modules/PcfProcess/PcfMaterialComposition.vue';
    import PcfProductSelection from '@/pages/modules/PcfProcess/PcfProductSelection.vue';

    defineOptions({
        inheritAttrs: false,
        isDesktopModule: true,
        isMobileModule: true,
        moduleTitle: 'PCF Process',
    });

    const step = ref(1);
    const newShell = ref<any>(undefined);

    function finishedSelection(shell: any): void {
        newShell.value = shell;
    }
</script>
