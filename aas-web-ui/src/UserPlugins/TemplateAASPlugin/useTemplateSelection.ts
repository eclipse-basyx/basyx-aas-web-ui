import { computed, ref } from 'vue';
import { TemplateStorageService } from '@/UserPlugins/TemplateAASPlugin/services/TemplateStorageService';
import { TemplateValidatorService } from '@/UserPlugins/TemplateAASPlugin/services/TemplateValidatorService';
import {
    AASTemplate,
    AASTemplateMetadata,
    TemplateError,
} from '@/UserPlugins/TemplateAASPlugin/types/templates/TemplateTypes';

// Define the return type interface
interface TemplateSelection {
    templates: ReturnType<typeof ref<AASTemplateMetadata[]>>;
    selectedTemplate: ReturnType<typeof ref<AASTemplate | null>>;
    loading: ReturnType<typeof ref<boolean>>;
    error: ReturnType<typeof ref<string | null>>;
    searchQuery: ReturnType<typeof ref<string>>;
    selectedCategory: ReturnType<typeof ref<string | null>>;
    selectedTags: ReturnType<typeof ref<string[]>>;
    filteredTemplates: import('vue').ComputedRef<AASTemplateMetadata[]>;
    loadTemplates: () => Promise<void>;
    selectTemplate: (templateId: string) => Promise<void>;
    clearSelection: () => void;
    setSearchQuery: (query: string) => void;
    setCategory: (category: string | null) => void;
    toggleTag: (tag: string) => void;
}

export function useTemplateSelection(): TemplateSelection {
    const templates = ref<AASTemplateMetadata[]>([]);
    const selectedTemplate = ref<AASTemplate | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const storage = new TemplateStorageService();
    const validator = new TemplateValidatorService();

    // Filter and search state
    const searchQuery = ref('');
    const selectedCategory = ref<string | null>(null);
    const selectedTags = ref<string[]>([]);

    const filteredTemplates = computed(() => {
        let result = templates.value;

        // Filter by search query
        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase();
            result = result.filter(
                (t) =>
                    t.name.toLowerCase().includes(query) ||
                    t.description?.toLowerCase().includes(query) ||
                    t.tags?.some((tag) => tag.toLowerCase().includes(query))
            );
        }

        // Filter by category
        if (selectedCategory.value) {
            result = result.filter((t) => t.category === selectedCategory.value);
        }

        // Filter by tags
        if (selectedTags.value.length > 0) {
            result = result.filter((t) => selectedTags.value.every((tag) => t.tags?.includes(tag)));
        }

        return result;
    });

    async function loadTemplates(): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            templates.value = await storage.listTemplates();
        } catch (e) {
            if (e instanceof TemplateError) {
                error.value = e.message;
            } else {
                error.value = 'Failed to load templates';
            }
            templates.value = [];
        } finally {
            loading.value = false;
        }
    }

    async function selectTemplate(templateId: string): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            const template = await storage.getTemplate(templateId);
            const validationResult = validator.validateTemplate(template);

            if (!validationResult.isValid) {
                throw new TemplateError('Invalid template', 'VALIDATION_ERROR', validationResult.errors);
            }

            selectedTemplate.value = template;
        } catch (e) {
            if (e instanceof TemplateError) {
                error.value = e.message;
            } else {
                error.value = 'Failed to select template';
            }
            selectedTemplate.value = null;
        } finally {
            loading.value = false;
        }
    }

    function clearSelection(): void {
        selectedTemplate.value = null;
        error.value = null;
    }

    function setSearchQuery(query: string): void {
        searchQuery.value = query;
    }

    function setCategory(category: string | null): void {
        selectedCategory.value = category;
    }

    function toggleTag(tag: string): void {
        const index = selectedTags.value.indexOf(tag);
        if (index === -1) {
            selectedTags.value.push(tag);
        } else {
            selectedTags.value.splice(index, 1);
        }
    }

    return {
        // State
        templates,
        selectedTemplate,
        loading,
        error,
        searchQuery,
        selectedCategory,
        selectedTags,
        filteredTemplates,

        // Methods
        loadTemplates,
        selectTemplate,
        clearSelection,
        setSearchQuery,
        setCategory,
        toggleTag,
    };
}
