<template>
    <v-divider v-if="showLabel"></v-divider>
    <v-list-item v-if="showLabel" class="pl-0 pt-0">
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
                :custom-filter="langFilter"
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
        text: Array<aasTypes.LangStringTextType>;
    };

    type ValueType<T extends keyof ValueMap> = ValueMap[T];

    type PropsWithLabel = {
        showLabel: true;
        label: string;
        type: keyof ValueMap;
        modelValue: ValueType<keyof ValueMap> | null;
    };

    type PropsWithoutLabel = {
        showLabel: false;
        label?: string;
        type: keyof ValueMap;
        modelValue: ValueType<keyof ValueMap> | null;
    };

    const props = defineProps<PropsWithLabel | PropsWithoutLabel>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: ValueType<typeof props.type> | null): void;
    }>();

    const langStringValue = ref<ValueType<typeof props.type> | null>(props.modelValue);

    const languageOptions = computed(() => {
        return ISO6391.getLanguages(ISO6391.getAllCodes());
    });

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
        } else if (props.type === 'text') {
            langStringValue.value.push(new aasTypes.LangStringTextType('', ''));
        }
    }

    function deleteLangStringElement(langStringElement: aasTypes.LangStringNameType | aasTypes.LangStringTextType) {
        const index = langStringValue.value?.indexOf(langStringElement);
        if (index !== undefined && index !== null) {
            langStringValue.value?.splice(index, 1);
        }
    }

    function langFilter(value: string, query: string): boolean {
        // First make sure there's a query
        if (!query || query === '') return true;

        const queryLower = query.toLowerCase();

        // For the ISO language items (searching through all options)
        const matchingLanguage = languageOptions.value.find((lang) => {
            const nameMatch = lang.name.toLowerCase().includes(queryLower);
            const codeMatch = lang.code.toLowerCase().includes(queryLower);
            return nameMatch || codeMatch;
        });

        if (matchingLanguage) {
            // If the current value matches one of our matches, return true
            if (
                typeof value === 'string' &&
                (value.toLowerCase() === matchingLanguage.code.toLowerCase() ||
                    value.toLowerCase() === matchingLanguage.name.toLowerCase())
            ) {
                return true;
            }

            // If we're still typing and our input might match
            // Return true if value includes the query or query includes value
            if (
                typeof value === 'string' &&
                (value.toLowerCase().includes(queryLower) || queryLower.includes(value.toLowerCase()))
            ) {
                return true;
            }
        }

        // Default fallback to the simple string matching
        if (typeof value === 'string') {
            return value.toLowerCase().includes(queryLower);
        }

        return false;
    }
</script>
