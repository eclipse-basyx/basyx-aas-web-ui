<template>
    <v-container fluid class="pa-0">
        <v-card class="pdfCard" style="transform: translateY(0px)">
            <iframe
                v-if="pdfUrl.length > 0"
                :src="pdfUrl"
                width="100%"
                height="600px"
                frameBorder="0"
                style="margin-bottom: -5px"></iframe>
            <iframe
                v-else
                :src="Base64PDF"
                width="100%"
                height="600px"
                frameBorder="0"
                style="margin-bottom: -5px"></iframe>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, ref, watch } from 'vue';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';

    // Composables
    const { valueBlob } = useSMEFile();

    // Properties
    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const Base64PDF = ref(''); // Base64 PDF string
    const pdfUrl = ref(''); // URL to the PDF File

    // Watchers
    watch(
        () => props.submodelElementData,
        () => {
            initialize();
        }
    );

    onMounted(() => {
        initialize();
    });

    async function initialize(): Promise<void> {
        Base64PDF.value = '';
        pdfUrl.value = '';
        if (props.submodelElementData.modelType == 'File') {
            Base64PDF.value = await valueBlob(props.submodelElementData);
        } else if (props.submodelElementData.modelType == 'Blob') {
            getDecodedPDFBlob();
        }
    }

    function getDecodedPDFBlob(): void {
        let decodedValue = atob(props.submodelElementData.value);
        Base64PDF.value = `data:${props.submodelElementData.contentType};base64,${decodedValue}`;
    }
</script>
