<template>
    <v-container fluid class="pa-0">
        <v-card v-if="invalidElementObject" color="elevatedCard" class="mt-4">
            <v-list nav class="pt-0" :class="localIsOperationVariable ? '' : 'bg-elevatedCard'">
                <!-- Alert when SubmodelElement is invalid -->
                <v-list-item v-if="!localIsOperationVariable">
                    <v-list-item-title class="pt-2">
                        <v-alert
                            text="Invalid SubmodelElement!"
                            density="compact"
                            type="warning"
                            variant="outlined"></v-alert>
                    </v-list-item-title>
                </v-list-item>
                <!-- Show Blob of the current SubmodelElement -->
                <v-list-item class="py-0" :class="localIsOperationVariable ? 'px-0' : 'px-2'">
                    <v-card
                        v-if="!localIsOperationVariable || localIsOutputVariable"
                        style="height: 300px; overflow: auto"
                        class="pa-2">
                        <pre>{{ jsonString }}</pre>
                    </v-card>
                    <v-card v-else class="pa-0 ma-0">
                        <v-textarea
                            v-model="jsonString"
                            variant="outlined"
                            hide-details
                            density="compact"
                            :rows="8"
                            @update:focused="setFocus($event)"></v-textarea>
                    </v-card>
                </v-list-item>
                <v-divider v-if="!localIsOperationVariable" class="mt-3"></v-divider>
                <!-- Info listing all available SubmodelElements -->
                <v-list-item v-if="!localIsOperationVariable" class="px-3 py-0">
                    <v-list-item-subtitle class="pt-2">{{
                        'The selected SubmodelElement is either non existend or not yet implemented.'
                    }}</v-list-item-subtitle>
                    <template #append>
                        <!-- Tooltip showing all available SubmodelElements -->
                        <v-tooltip open-delay="600" transition="slide-x-transition">
                            <template #activator="{ props: invalidElementProps }">
                                <v-icon v-bind="invalidElementProps">mdi-information-outline</v-icon>
                            </template>
                            <div>
                                <span class="font-weight-bold">Available SubmodelElements:</span>
                                <ul class="px-3">
                                    <li v-for="(submodelElement, i) in submodelElements" :key="i">
                                        {{ submodelElement }}
                                    </li>
                                </ul>
                            </div>
                        </v-tooltip>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';

    const props = defineProps({
        invalidElementObject: {
            type: Object,
            default: () => ({}),
        },
        isOperationVariable: {
            type: Boolean,
            default: false,
        },
        variableType: {
            type: String,
            default: '',
        },
    });

    const emit = defineEmits<{
        (e: 'updateValue', updatedInvalidElementObject: any): void;
    }>();

    const submodelElements = ref([
        'Submodel',
        'SubmodelElementCollection',
        'SubmodelElementList',
        'Property',
        'MultiLanguageProperty',
        'File',
        'Blob',
        'Operation',
        'ReferenceElement',
        'Range',
        'Entity',
        'RelationshipElement',
        'AnnotatedRelationshipElement',
    ]);
    const jsonString = ref('');

    const localIsOperationVariable = computed(() => {
        if (props.isOperationVariable !== undefined) {
            return props.isOperationVariable;
        } else {
            return false;
        }
    });

    const localIsOutputVariable = computed(() => {
        if (props.isOperationVariable !== undefined) {
            return props.variableType == 'outputVariables';
        } else {
            return false;
        }
    });

    watch(
        () => props.invalidElementObject,
        () => {
            const localInvalidElementObject = { ...props.invalidElementObject };
            delete localInvalidElementObject.parent;
            jsonString.value = JSON.stringify(localInvalidElementObject, null, 2);
        },
        { deep: true }
    );

    onMounted(() => {
        const localInvalidElementObject = { ...props.invalidElementObject };
        delete localInvalidElementObject.parent;
        jsonString.value = JSON.stringify(localInvalidElementObject, null, 2);
    });

    function updateValue(): void {
        emit('updateValue', JSON.parse(jsonString.value));
    }

    function setFocus(e: boolean): void {
        if (!e) {
            updateValue();
        }
    }
</script>
