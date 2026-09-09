import type { ShortcutDefinition } from '@/composables/Shortcuts/useShortcutDefinitions'

export const querySuggestionsShortcut: ShortcutDefinition = {
  id: 'query-language-suggestions',
  title: 'Show Query Suggestions',
  description: 'Focus the query editor and open schema suggestions',
  prependIcon: 'mdi-code-json',
  category: 'Query Language Shortcuts',
  keys: 'cmd+i',
  handler: event => {
    event.preventDefault()
    event.stopPropagation()
    document.querySelector('#query-language-editor')?.dispatchEvent(new Event('show-suggestions'))
  },
}
