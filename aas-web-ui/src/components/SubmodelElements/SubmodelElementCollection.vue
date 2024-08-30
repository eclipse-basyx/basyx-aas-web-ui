<template>
    <v-container fluid class="pa-0">
        <!-- Group of contained SubmodelElements -->
        <SubmodelElementGroup
            :smeObject="submodelElementCollectionObject"
            :smeLocator="'value'"
            :topMargin="'mt-4'"></SubmodelElementGroup>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    import SubmodelElementGroup from '@/components/UIComponents/SubmodelElementGroup.vue';

    export default defineComponent({
        name: 'SubmodelElementCollection',
        components: {
            SubmodelElementGroup,
        },
        props: ['submodelElementCollectionObject'],
    });
</script>
