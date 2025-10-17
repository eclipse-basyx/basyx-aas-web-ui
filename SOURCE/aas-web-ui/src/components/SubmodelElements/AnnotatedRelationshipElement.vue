<template>
    <v-container fluid class="pa-0">
        <RelationshipElement :relationship-element-object="annotatedRelationshipElementObject"></RelationshipElement>
        <!-- Annotations -->
        <v-list-item class="px-1 pb-1 pt-0">
            <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Annotations: ' }}</v-list-item-title>
        </v-list-item>
        <!-- Iterate over all Annotations of the AnnotatedRelationshipElement -->
        <div
            v-for="SubmodelElement in annotatedRelationshipElementObject.annotations"
            :key="SubmodelElement.idShort"
            class="mb-3">
            <!-- Display SubmodelElement -->
            <SubmodelElementWrapper
                :submodel-element-object="SubmodelElement"
                :card-style="'outlined'"
                :is-editable="isEditable"></SubmodelElementWrapper>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    defineProps({
        annotatedRelationshipElementObject: {
            type: Object,
            default: () => ({}),
        },
        isEditable: {
            type: Boolean,
            default: true,
        },
    });
</script>
