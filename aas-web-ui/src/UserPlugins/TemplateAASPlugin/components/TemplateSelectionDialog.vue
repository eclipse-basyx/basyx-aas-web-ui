<template>
    <v-dialog v-model="dialog" width="860">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">Select AAS Template</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3">
                <v-row>
                    <v-col cols="12">
                        <v-text-field
                            v-model="search"
                            label="Search templates"
                            prepend-inner-icon="mdi-magnify"
                            clearable
                            hide-details
                            class="mb-4" />
                    </v-col>
                </v-row>

                <v-row>
                    <v-col v-for="template in filteredTemplates" :key="template.id" cols="12" md="6">
                        <v-card
                            :class="['template-card', { selected: selectedTemplate?.id === template.id }]"
                            variant="outlined"
                            hover
                            @click="selectTemplate(template)">
                            <v-card-title>
                                {{ template.name }}
                                <v-chip size="small" color="primary" class="ml-2"> v{{ template.version }} </v-chip>
                            </v-card-title>
                            <v-card-text>
                                <p>{{ template.description || 'No description available' }}</p>
                                <v-chip-group>
                                    <v-chip v-for="tag in template.tags" :key="tag" size="small" color="secondary">
                                        {{ tag }}
                                    </v-chip>
                                </v-chip-group>
                                <div class="mt-2">
                                    <strong>Submodels:</strong>
                                    <ul class="submodel-list">
                                        <li v-for="submodel in template.submodels" :key="submodel.id">
                                            {{ submodel.name }}
                                            <v-chip v-if="submodel.required" size="x-small" color="warning">
                                                Required
                                            </v-chip>
                                        </li>
                                    </ul>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="dialog = false"> Cancel </v-btn>
                <v-btn color="primary" :disabled="!selectedTemplate" @click="confirmSelection"> Select Template </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { TemplateStorageService } from '@/UserPlugins/TemplateAASPlugin/services/TemplateStorageService';
    import { AASTemplate } from '@/UserPlugins/TemplateAASPlugin/types/templates/TemplateTypes';

    const props = defineProps<{
        modelValue: boolean;
        loading?: boolean;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
        (event: 'selected', template: AASTemplate): void;
    }>();

    // Dialog state
    const dialog = ref(false);
    const search = ref('');
    const selectedTemplate = ref<AASTemplate | null>(null);

    // Get templates from storage service
    const templateStorage = new TemplateStorageService();
    const templates = ref<AASTemplate[]>([]);

    // Load templates
    async function loadTemplates(): Promise<void> {
        try {
            templates.value = await templateStorage.getTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
            templates.value = [];
        }
    }

    // Filter templates based on search
    const filteredTemplates = computed(() => {
        if (!search.value) return templates.value;

        const searchLower = search.value.toLowerCase();
        return templates.value.filter((template) => {
            return (
                template.name.toLowerCase().includes(searchLower) ||
                template.description?.toLowerCase().includes(searchLower) ||
                template.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
                template.submodels.some((sm) => sm.name.toLowerCase().includes(searchLower))
            );
        });
    });

    // Watch for dialog changes
    watch(
        () => props.modelValue,
        (value) => {
            dialog.value = value;
            if (value) {
                loadTemplates();
                selectedTemplate.value = null;
                search.value = '';
            }
        }
    );

    watch(
        () => dialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    // Methods
    function selectTemplate(template: AASTemplate): void {
        selectedTemplate.value = template;
    }

    function confirmSelection(): void {
        if (selectedTemplate.value) {
            emit('selected', selectedTemplate.value);
            dialog.value = false;
        }
    }
</script>

<style scoped>
    .template-card {
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .template-card.selected {
        border-color: rgb(var(--v-theme-primary));
        background-color: rgb(var(--v-theme-primary), 0.05);
    }

    .template-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .submodel-list {
        list-style: none;
        padding-left: 0;
        margin-top: 8px;
    }

    .submodel-list li {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }
</style>
