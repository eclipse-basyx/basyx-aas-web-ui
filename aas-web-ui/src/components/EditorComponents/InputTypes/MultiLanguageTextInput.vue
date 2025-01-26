<template>
    <v-divider></v-divider>
    <v-list-item class="pl-0 pt-0">
        <template #title>
            <div class="text-subtitle-2">{{ label }}</div>
        </template>
    </v-list-item>
    <v-list-item v-for="(langStringElement, i) in langStringValue" :key="i" class="px-0">
        <template #prepend>
            <v-combobox
                v-model="langStringElement.language"
                :items="languageOptions"
                label="Language"
                item-title="name"
                item-value="code"
                variant="outlined"
                density="comfortable"
                clearable
                :return-object="false"
                single-line
                :width="200"
                class="mr-3">
                <template #selection="{ item }">
                    <span>{{ item.value }}</span>
                </template>
                <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                        <template #append>
                            <span class="ml-2">{{ item.value }}</span>
                        </template>
                    </v-list-item>
                </template>
            </v-combobox>
        </template>
        <v-text-field
            v-model="langStringElement.text"
            variant="outlined"
            density="comfortable"
            append-icon="mdi-delete"
            @click:append="deleteLangStringElement(langStringElement)"></v-text-field>
    </v-list-item>
    <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="outlined"
        text="Add"
        class="text-none mt-1 mb-4"
        @click="addLangStringName"></v-btn>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import ISO6391 from 'iso-639-1';
    import { computed, ref, watch } from 'vue';

    // Type Map for supported types
    type ValueMap = {
        displayName: Array<aasTypes.LangStringNameType>;
        description: Array<aasTypes.LangStringTextType>;
    };

    type ValueType<T extends keyof ValueMap> = ValueMap[T];

    const props = defineProps<{
        label: string;
        type: keyof ValueMap;
        modelValue: ValueType<keyof ValueMap> | null;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: ValueType<typeof props.type> | null): void;
    }>();

    // Data
    const langStringValue = ref<ValueType<typeof props.type> | null>(props.modelValue);
    const filter = ref(<string | null>null);

    // Computed Properties
    const languageOptions = computed(() => {
        let languages = ISO6391.getLanguages(ISO6391.getAllCodes());
        if (filter.value !== null && filter.value !== '') {
            const currentFilter = filter.value;
            languages = languages.filter((lang) => lang.name.toLowerCase().includes(currentFilter.toLowerCase()));
        }
        return languages;
    });

    // Watchers
    watch(langStringValue, (newValue) => {
        emit('update:modelValue', newValue);
    });

    watch(
        () => props.modelValue,
        (newValue) => {
            langStringValue.value = newValue;
        }
    );

    function addLangStringName() {
        // check if null and create new array
        if (langStringValue.value === null) {
            langStringValue.value = [];
        }
        if (props.type === 'displayName') {
            langStringValue.value.push(new aasTypes.LangStringNameType('', ''));
        } else if (props.type === 'description') {
            langStringValue.value.push(new aasTypes.LangStringTextType('', ''));
        }
    }

    function deleteLangStringElement(langStringElement: aasTypes.LangStringNameType | aasTypes.LangStringTextType) {
        const index = langStringValue.value?.indexOf(langStringElement);
        if (index !== undefined && index !== null) {
            langStringValue.value?.splice(index, 1);
        }
    }
</script>
