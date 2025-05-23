import { sampleTemplates } from '@/UserPlugins/TemplateAASPlugin/data/sampleTemplates';
import { TemplateStorageService } from '@/UserPlugins/TemplateAASPlugin/services/TemplateStorageService';

export async function loadSampleTemplates(): Promise<void> {
    const storage = new TemplateStorageService();

    // Clear any existing templates first
    await storage.clearStorage();

    // Import the sample templates
    await storage.importTemplates(sampleTemplates);
}
