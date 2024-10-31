<template>
    <v-container fluid class="pa-0">
        <v-card v-if="multiLanguagePropertyObject" color="elevatedCard" class="mt-4">
            <!-- Value(s) of the MultiLanguageProperty -->
            <v-list
                v-if="multiLanguagePropertyObject.value && multiLanguagePropertyObject.value.length > 0"
                nav
                class="bg-elevatedCard pt-0">
                <v-list-item v-for="(value, i) in mlpValue" :key="i">
                    <v-list-item-title class="pt-2">
                        <!-- Input Field containing the Variable Value -->
                        <v-text-field
                            v-model="value.text"
                            variant="outlined"
                            density="compact"
                            hide-details
                            clearable
                            :disabled="!isEditable"
                            append-icon="mdi-delete"
                            @click:append="removeEntry(i)"
                            @update:focused="setFocus($event, value)"
                            @keydown.enter="updateValue()">
                            <template #prepend-inner>
                                <!-- language -->
                                <v-chip label size="x-small" border>
                                    <span>{{ value.language ? value.language : 'no-lang' }}</span>
                                    <v-icon site="x-small" style="margin-right: -3px">mdi-chevron-down</v-icon>
                                    <!-- Menu to select the Language -->
                                    <v-menu activator="parent">
                                        <v-list density="compact" class="pa-0">
                                            <v-list-item
                                                v-for="language in languages"
                                                :key="language.id"
                                                @click="selectLanguage(language, value)">
                                                <v-list-item-title class="py-0">{{ language.short }}</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </v-chip>
                            </template>
                            <!-- Update Value Button -->
                            <template #append-inner>
                                <v-btn
                                    v-if="value.isFocused"
                                    size="small"
                                    variant="elevated"
                                    color="primary"
                                    class="text-buttonText"
                                    style="right: -4px"
                                    @click.stop="updateValue()">
                                    <v-icon>mdi-upload</v-icon>
                                </v-btn>
                            </template>
                        </v-text-field>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
            <!-- Warning when MultiLanguageProperty has no value(s) -->
            <v-list v-else nav class="bg-elevatedCard pt-0">
                <v-list-item>
                    <v-list-item-title class="pt-2">
                        <v-alert
                            text="MultiLanguageProperty doesn't contain a Value!"
                            density="compact"
                            type="warning"
                            variant="outlined"></v-alert>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <!-- Edit the MultiLanguageProperty -->
            <v-list nav class="bg-elevatedCard py-0">
                <v-list-item>
                    <template #append>
                        <v-btn
                            color="primary"
                            size="small"
                            variant="elevated"
                            class="text-buttonText"
                            @click="addEntry()">
                            <div>Add new Entry</div>
                            <v-icon class="ml-1">mdi-plus</v-icon>
                        </v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'MultiLanguageProperty',
        mixins: [RequestHandling],
        props: {
            multiLanguagePropertyObject: {
                type: Object,
                default: () => ({}),
            },
            isEditable: {
                type: Boolean,
                default: true,
            },
        },

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                localMultiLanguagePropertyObject: {} as any,
                mlpValue: {} as any,
                languages: [
                    { id: 1, text: 'Deutsch', short: 'de' },
                    { id: 2, text: 'English', short: 'en' },
                    { id: 3, text: 'Français', short: 'fr' },
                    { id: 4, text: 'Español', short: 'es' },
                    { id: 5, text: 'Italiano', short: 'it' },
                    { id: 6, text: 'Kanton Zürich', short: 'zh' },
                    { id: 7, text: '한국인', short: 'kr' },
                ] as any,
            };
        },

        computed: {
            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },
        },

        watch: {
            // Watch for changes in the selected Node and reset input
            SelectedNode: {
                deep: true,
                handler() {
                    this.mlpValue = {};
                },
            },

            // Watch for changes in the propertyObject and update the newPropertyValue if the input field is not focused
            multiLanguagePropertyObject: {
                deep: true,
                handler() {
                    this.mlpValue = this.multiLanguagePropertyObject.value;
                },
            },
        },

        mounted() {
            this.localMultiLanguagePropertyObject = this.multiLanguagePropertyObject;
            this.mlpValue = this.multiLanguagePropertyObject.value;
        },

        methods: {
            // Function to remove an Entry from the MultiLanguageProperty
            removeEntry(position: number) {
                // console.log('removeEntry: ', value);
                this.mlpValue.splice(position, 1);
                this.localMultiLanguagePropertyObject.value = this.mlpValue;
                this.updateMLP();
            },

            // Function to add an Entry to the MultiLanguageProperty
            addEntry() {
                this.mlpValue.push({
                    language: '',
                    text: '',
                });
                this.localMultiLanguagePropertyObject.value = this.mlpValue;
                // console.log('addEntry: ', this.multiLanguagePropertyObject)
                this.updateMLP();
            },

            // Function to select the Language of the Entry
            selectLanguage(language: any, value: any) {
                // console.log('selectLanguage: ', language);
                value.language = language.short;
                this.updateMLP();
            },

            // Function to update the Value of the MultiLanguageProperty
            updateValue() {
                // console.log('updateValue: ', this.mlpValue);
                if (document.activeElement) (document.activeElement as HTMLElement).blur(); // remove focus from input field
                this.localMultiLanguagePropertyObject.value = this.mlpValue;
                this.updateMLP();
            },

            // Function to update the value of the property
            updateMLP() {
                // console.log("Update Value: ", this.multiLanguagePropertyObject);
                let path = this.localMultiLanguagePropertyObject.path + '/$value';
                let content = JSON.stringify(
                    this.localMultiLanguagePropertyObject.value.map((item: any) => ({ [item.language]: item.text }))
                );
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                let context =
                    'updating ' +
                    this.localMultiLanguagePropertyObject.modelType +
                    ' "' +
                    this.localMultiLanguagePropertyObject.idShort +
                    '"';
                let disableMessage = false;
                // Send Request to update the value of the property
                this.patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // // this.newPropertyValue = ''; // reset input
                        // let updatedPropertyObject = { ...this.propertyObject }; // copy the propertyObject
                        // updatedPropertyObject.value = content.toString().replace(/'/g, ''); // update the value of the propertyObject
                        // this.$emit('updateValue', updatedPropertyObject); // emit event to update the value in the parent component
                    }
                });
            },

            // Function to set the focus on the input field
            setFocus(e: boolean, value: any) {
                value.isFocused = e;
            },
        },
    });
</script>
