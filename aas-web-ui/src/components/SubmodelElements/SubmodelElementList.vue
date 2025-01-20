<template>
    <v-container fluid class="pa-0">
        <!-- Group of contained SubmodelElements -->
        <SubmodelElementGroup
            :sme-object="submodelElementListObject"
            :sme-locator="'value'"
            :top-margin="'mt-4'"></SubmodelElementGroup>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'SubmodelElementList',
        props: ['submodelElementListObject'],
    });
</script>
