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
            <!-- <SubmodelElementWrapper :SubmodelElementObject="SubmodelElement" :cardStyle="'outlined'"></SubmodelElementWrapper> -->
            <component
                :is="SubmodelElementWrapper"
                v-if="SubmodelElementWrapper"
                :submodel-element-object="SubmodelElement"
                :card-style="'outlined'"
                :is-editable="isEditable"></component>
        </div>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent, shallowRef } from 'vue';
    import RelationshipElement from './RelationshipElement.vue';
    // import SubmodelElementWrapper from '@/components/UIComponents/SubmodelElementWrapper.vue';

    export default defineComponent({
        name: 'AnnotatedRelationshipElement',
        components: {
            RelationshipElement,
            // SubmodelElementWrapper,
        },
        props: {
            annotatedRelationshipElementObject: {
                type: Object,
                default: () => ({}),
            },
            isEditable: {
                type: Boolean,
                default: true,
            },
        },

        setup() {
            const SubmodelElementWrapper = shallowRef(null) as any;

            import('@/components/UIComponents/SubmodelElementWrapper.vue').then((module) => {
                SubmodelElementWrapper.value = module.default;
            });

            return {
                SubmodelElementWrapper,
            };
        },
    });
</script>
