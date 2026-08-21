import type { ViewType } from '../types/view'
import type { DefinitionKind } from '@/pages/modules/ABAC/types/definitions'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavigationStore } from '@/store/NavigationStore'
import { hasContent } from '@/utils/StringUtils'
import { VIEW } from '../types/view'

// Module-level shared state so all composable consumers mutate the same ref.
const isListOpen = ref(true)

export function useAbacNavigation () {
  const route = useRoute()
  const router = useRouter()
  const navigationStore = useNavigationStore()

  const isMobile = computed(() => navigationStore.getIsMobile)

  const selectedService = computed<BaSyxComponentKey | undefined>(() => {
    const paramService = route.query.service as BaSyxComponentKey | undefined
    return paramService
  })

  function onSelectService (key: BaSyxComponentKey): void {
    const query = { ...route.query }

    delete query.policy
    delete query.rule
    delete query.definition
    delete query.kind
    delete query.view

    query.service = (key)

    router.replace({ query })
  }

  const selectedPolicyVersion = computed(() => {
    const paramId = route.query.policy as string | undefined
    return paramId
  })

  function onSelectPolicy (version: string | number): void {
    const isCurrentlySelected = selectedPolicyVersion.value?.toString() === version?.toString()
    const query = { ...route.query }

    delete query.rule
    delete query.definition
    delete query.kind

    if (isCurrentlySelected) {
      delete query.policy
    } else {
      query.policy = (version.toString())
    }

    router.push({ query })

    if (isMobile.value && !isCurrentlySelected) {
      isListOpen.value = false
    }
  }

  const selectedRuleIndex = computed(() => {
    const paramIndex = route.query.rule as string | undefined
    return paramIndex
  })

  function onSelectRule (index: string | number): void {
    const isCurrentlySelected = selectedRuleIndex.value?.toString() === index?.toString()
    const query = { ...route.query }

    if (isCurrentlySelected) {
      delete query.rule
    } else {
      query.rule = (index.toString())
    }

    router.push({ query })
  }

  const selectedDefinitionKind = computed<DefinitionKind | undefined>(() => {
    const paramKind = route.query.kind as DefinitionKind | undefined
    return paramKind
  })

  const selectedDefinitionName = computed(() => {
    const paramDefinition = route.query.definition as string | undefined
    return paramDefinition
  })

  function onSelectDefinitionKind (kind: DefinitionKind | 'all'): void {
    const isCurrentlySelected = selectedDefinitionKind.value?.toString() === kind.toString()

    const query = { ...route.query }

    if (kind === 'all') {
      // Remove kind if no definition is selected
      if (!hasContent(selectedDefinitionName.value)) {
        delete query.kind
      }
    } else {
      // Remove definition if selected kind changes
      if (!isCurrentlySelected) {
        delete query.definition
      }

      query.kind = (kind)
    }

    router.push({ query })
  }

  function onSelectDefinition (name: string, kind: DefinitionKind): void {
    // Note: we can have definitions of different kind using the same name
    const isCurrentlySelected = selectedDefinitionName.value?.toString() === name?.toString() && selectedDefinitionKind.value?.toString() === kind.toString()
    const query = { ...route.query }

    if (isCurrentlySelected) {
      delete query.definition
      delete query.kind
    } else {
      query.definition = (name)
      query.kind = (kind)
    }

    router.push({ query })
  }

  const selectedView = computed<ViewType>(() => {
    const v = route.query.view as string | undefined
    return v && Object.values(VIEW).includes(v as ViewType) ? (v as ViewType) : VIEW.RULES
  })

  function onChangeView (value: string): void {
    if (route.query.view === value) {
      return
    }
    router.replace({ query: { ...route.query, view: value } })
  }

  watch(isMobile, val => {
    if (!val) {
      isListOpen.value = true
    }
  })

  return {
    selectedService,
    onSelectService,
    selectedPolicyVersion,
    onSelectPolicy,
    selectedRuleIndex,
    onSelectRule,
    selectedDefinitionKind,
    onSelectDefinitionKind,
    selectedDefinitionName,
    onSelectDefinition,
    selectedView,
    onChangeView,
    isListOpen,
    isMobile,
  }
}
