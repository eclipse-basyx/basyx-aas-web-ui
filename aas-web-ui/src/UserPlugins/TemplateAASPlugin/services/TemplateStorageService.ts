import type { AASTemplate, AASTemplateMetadata } from '@/UserPlugins/TemplateAASPlugin/types/templates/TemplateTypes';
import { TemplateValidatorService } from './TemplateValidatorService';

const STORAGE_KEY = 'aas_templates';

// Import all template files dynamically
const templateModules = import.meta.glob<{ default: AASTemplate }>('@/UserPlugins/TemplateAASPlugin/templates/*.json', {
    eager: true,
});

export class TemplateStorageService {
    private templates: Map<string, AASTemplate>;
    private validator: TemplateValidatorService;

    constructor() {
        this.templates = new Map();
        this.validator = new TemplateValidatorService();
        this.loadOfficialTemplates();
        this.loadFromStorage();
    }

    private loadOfficialTemplates(): void {
        // Debug: Log all found template files
        //console.log('Found template files:', Object.keys(templateModules));

        // Load all template files except schema files
        const officialTemplates = Object.entries(templateModules)
            .filter(([path]) => !path.includes('schema'))
            .map(([, module]) => {
                // Debug: Log each template being processed
                //console.log('Processing template:', path);
                return module.default;
            });

        // Debug: Log number of templates found
        //console.log('Number of templates to process:', officialTemplates.length);

        officialTemplates.forEach((template) => {
            // Debug: Log template being validated
            //console.log('Validating template:', template.id);

            const validationResult = this.validator.validateTemplate(template);
            if (validationResult.isValid) {
                this.templates.set(template.id, template);
                //console.log('Successfully loaded template:', template.id);
            } else {
                //console.warn(`Template validation failed for ${template.id}:`, validationResult.errors);
            }
        });

        // Debug: Log final loaded templates
        //console.log('Final loaded templates:', Array.from(this.templates.keys()));
    }

    private loadFromStorage(): void {
        try {
            const storedTemplates = localStorage.getItem(STORAGE_KEY);
            if (storedTemplates) {
                const templates = JSON.parse(storedTemplates) as AASTemplate[];
                templates.forEach((template) => {
                    const validationResult = this.validator.validateTemplate(template);
                    if (validationResult.isValid) {
                        this.templates.set(template.id, template);
                    } else {
                        console.error(`Invalid stored template ${template.id}:`, validationResult.errors);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading templates from storage:', error);
        }
    }

    private saveToStorage(): void {
        try {
            const templates = Array.from(this.templates.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
        } catch (error) {
            console.error('Error saving templates to storage:', error);
        }
    }

    async clearStorage(): Promise<void> {
        try {
            localStorage.removeItem(STORAGE_KEY);
            this.templates.clear();
            this.loadOfficialTemplates();
        } catch (error) {
            console.error('Error clearing template storage:', error);
            throw new Error('Failed to clear template storage');
        }
    }

    async listTemplates(): Promise<AASTemplateMetadata[]> {
        return Array.from(this.templates.values()).map((template) => ({
            id: template.id,
            name: template.name,
            description: template.description,
            version: template.version,
            aasVersion: template.aasVersion,
            category: template.category,
            tags: template.tags,
        }));
    }

    async getTemplate(id: string): Promise<AASTemplate> {
        const template = this.templates.get(id);
        if (!template) {
            throw new Error(`Template ${id} not found`);
        }
        return template;
    }

    async saveTemplate(template: AASTemplate): Promise<void> {
        const validationResult = this.validator.validateTemplate(template);
        if (!validationResult.isValid) {
            throw new Error(`Invalid template: ${validationResult.errors.map((e) => e.message).join(', ')}`);
        }

        this.templates.set(template.id, template);
        this.saveToStorage();
    }

    async deleteTemplate(id: string): Promise<void> {
        const template = this.templates.get(id);
        if (!template) {
            throw new Error(`Template ${id} not found`);
        }

        this.templates.delete(id);
        this.saveToStorage();
    }

    async importTemplates(templates: AASTemplate[]): Promise<void> {
        const errors: string[] = [];

        for (const template of templates) {
            const validationResult = this.validator.validateTemplate(template);
            if (validationResult.isValid) {
                this.templates.set(template.id, template);
            } else {
                errors.push(
                    `Invalid template ${template.id}: ${validationResult.errors.map((e) => e.message).join(', ')}`
                );
            }
        }

        if (errors.length > 0) {
            throw new Error(`Import failed: ${errors.join('; ')}`);
        }

        this.saveToStorage();
    }

    async getTemplates(): Promise<AASTemplate[]> {
        return Array.from(this.templates.values());
    }

    async getTemplateById(id: string): Promise<AASTemplate | null> {
        return this.templates.get(id) || null;
    }
}
