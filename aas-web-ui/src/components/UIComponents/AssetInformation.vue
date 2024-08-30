<template>
    <v-container class="pa-0" fluid>
        <v-list lines="one" nav class="bg-detailsCard">
            <IdentificationElement
                class="mb-2"
                :identificationObject="assetInfo"
                :modelType="assetObject.assetKind"
                :idType="'Global Asset ID'"
                :nameType="'assetType'"></IdentificationElement>
            <v-img
                v-if="assetObject.defaultThumbnail"
                :src="assetObject.defaultThumbnail.path"
                max-width="100%"
                max-height="100%"
                contain
                style="border-radius: 4px"></v-img>
        </v-list>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    import IdentificationElement from '@/components/UIComponents/IdentificationElement.vue';
    import DescriptionElement from '@/components/UIComponents/DescriptionElement.vue';

    export default defineComponent({
        name: 'AssetInformation',
        components: {
            IdentificationElement,
            DescriptionElement,
        },
        props: ['assetObject'],

        computed: {
            assetInfo() {
                let assetInfo = {
                    idShort: this.assetObject.assetType,
                    id: this.assetObject.globalAssetId,
                };
                return assetInfo;
            },
        },

        methods: {},
    });
</script>
