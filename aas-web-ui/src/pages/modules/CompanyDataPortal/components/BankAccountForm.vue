<template>
    <div class="pb-1">
        <h2 class="text-xl font-semibold text-gray-700">
            {{ index === 0 ? 'Main Bank Account' : `Additional Bank Account ${index}` }}
        </h2>
        <v-divider class="my-2 mx-n4 mb-4"></v-divider>
        <v-row>
            <v-col>
                <FormField
                    label="Descriptive ID"
                    tip="A short identifier for this bank account. If not filled, a standard ID will be generated automatically.">
                    <input v-model="formData.idShort" type="text" class="w-full border rounded px-3 py-2" />
                </FormField>
            </v-col>
            <v-col>
                <FormField
                    label="Account Holder *"
                    tip="The individual or entity that owns and manages the bank account">
                    <input
                        v-model="formData.accountHolder"
                        type="text"
                        :class="['w-full border rounded px-3 py-2', errors?.accountHolder ? 'border-red-500' : '']" />
                    <p v-if="errors?.accountHolder" class="text-sm text-red-600 mt-1">
                        {{ errors.accountHolder }}
                    </p>
                </FormField>
            </v-col>
            <v-col>
                <FormField
                    label="Bank Account Type"
                    tip="The classification of a bank account, such as accounts for domestic and foreign customers">
                    <input v-model="formData.accountType" type="text" class="w-full border rounded px-3 py-2" />
                </FormField>
            </v-col>
            <v-col>
                <FormField
                    label="IBAN *"
                    tip="The International Bank Account Number, a unique identifier for a specific bank account">
                    <input
                        v-model="formData.iban"
                        type="text"
                        :class="['w-full border rounded px-3 py-2', errors?.iban ? 'border-red-500' : '']" />
                    <p v-if="errors?.iban" class="text-sm text-red-600 mt-1">
                        {{ errors.iban }}
                    </p>
                </FormField>
            </v-col>
            <v-col>
                <FormField
                    label="BIC *"
                    tip="The Bank Identifier Code, also known as the SWIFT code, which uniquely identifies a bank for international transactions">
                    <input
                        v-model="formData.bic"
                        type="text"
                        :class="['w-full border rounded px-3 py-2', errors?.bic ? 'border-red-500' : '']" />
                    <p v-if="errors?.bic" class="text-sm text-red-600 mt-1">
                        {{ errors.bic }}
                    </p>
                </FormField>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import FormField from './FormField.vue';

    const props = defineProps<{
        index: number;
        modelValue: {
            idShort: string;
            accountHolder: string;
            accountType: string;
            iban: string;
            bic: string;
        };
        errors?: {
            accountHolder?: string;
            iban?: string;
            bic?: string;
        };
    }>();

    const emit = defineEmits<{
        'update:modelValue': [value: typeof props.modelValue];
    }>();

    const formData = computed({
        get: () => props.modelValue,
        set: (value) => {
            emit('update:modelValue', { ...value });
        },
    });
</script>
