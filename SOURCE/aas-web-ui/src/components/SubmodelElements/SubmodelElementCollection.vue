<template>
    <v-container fluid class="pa-0">
        <!-- Group of contained SubmodelElements -->
        <SubmodelElementGroup
            :sme-object="submodelElementCollectionObject"
            :sme-locator="'value'"
            :top-margin="'mt-4'"></SubmodelElementGroup>
    </v-container>
</template>

<script lang="ts" setup>
    defineProps({
        submodelElementCollectionObject: {
            type: Object,
            default: () => ({}),
        },
    });
</script>
