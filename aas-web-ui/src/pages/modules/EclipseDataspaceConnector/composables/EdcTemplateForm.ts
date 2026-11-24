import type { CatenaXEdcCreateResult } from '@/composables/Client/CatenaXEdcClient'
import type { Ref } from 'vue'
import {
  edcRequestFailureText,
  useEdcRequestFailureMessage,
} from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'

/**
 * A template to choose from when creating an EDC resource, its placeholders are described in `EdcTemplatePlaceholders`.
 */
export interface EdcTemplate<Value extends string = string> {
  value: Value
  name: string
  description: string
  template: unknown
}

/**
 * Form of a dialog creating an EDC resource, e.g. an `Asset`, from a chosen template.
 * The placeholder values are kept by label and reset when another template is chosen.
 */
export function useEdcTemplateForm<Value extends string> (resourceLabel: string, templates: EdcTemplate<Value>[]) {
  // Composables
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const selectedTemplate = ref('') as Ref<Value | ''>
  const placeholderValues = ref<Record<string, string>>({})
  const form = ref<any>(null)

  // Computed properties
  const activeTemplate = computed(() => templates.find(template => template.value === selectedTemplate.value))

  // Watchers
  watch(selectedTemplate, () => {
    placeholderValues.value = {}
  })

  // Methods
  function resetForm (): void {
    selectedTemplate.value = ''
    placeholderValues.value = {}
    if (form.value) {
      form.value.reset()
    }
  }

  /**
   * Creates the resource from the active template and returns its ID, or shows why it was not created.
   */
  async function createFromTemplate (create: (template: unknown) => Promise<CatenaXEdcCreateResult>): Promise<string | undefined> {
    const template = activeTemplate.value
    if (!template) {
      console.warn('Template not selected')
      return undefined
    }

    try {
      const result = await create(template.template)
      if (result.success) {
        return result.data['@id']
      }
      showFailureMessage(`Failed to create ${resourceLabel}.`, edcRequestFailureText(result, resourceLabel, 'create'))
    } catch (error_) {
      console.error(`Error creating ${resourceLabel.toLowerCase()}:`, error_)
      showFailureMessage(`Failed to create ${resourceLabel}.`, error_ instanceof Error ? error_.message : String(error_))
    }
    return undefined
  }

  return {
    selectedTemplate,
    placeholderValues,
    form,
    activeTemplate,
    resetForm,
    createFromTemplate,
  }
}
