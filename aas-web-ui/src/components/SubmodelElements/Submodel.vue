<template>
    <v-container fluid class="pa-0">
        <!-- kind -->
        <v-list-item v-if="submodelObject.kind" class="px-1 pb-1 pt-2">
            <v-list-item-title>
                <span class="text-subtitle-2 mr-2">{{ 'Kind: ' }}</span>
                <v-chip label size="x-small" border color="primary" style="margin-top: -3px">{{
                    submodelObject.kind
                }}</v-chip>
            </v-list-item-title>
        </v-list-item>
        <!-- Group of contained SubmodelElements -->
        <SubmodelElementGroup
            :smeObject="submodelObject"
            :smeLocator="'submodelElements'"
            :topMargin="submodelObject.kind ? 'mt-1' : 'mt-4'"></SubmodelElementGroup>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    import SubmodelElementGroup from '@/components/UIComponents/SubmodelElementGroup.vue';

    export default defineComponent({
        name: 'Submodel',
        components: {
            SubmodelElementGroup,
        },
        props: ['submodelObject'],
    });
</script>
