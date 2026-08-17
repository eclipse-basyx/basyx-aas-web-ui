import type { ViewType } from '../types/view'
import type { DefinitionKind } from '@/pages/modules/ABAC/types/definitions'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavigationStore } from '@/store/NavigationStore'
import { VIEW } from '../types/view'

export function useAbacNavigation () {
  const route = useRoute()
  const router = useRouter()
  const navigationStore = useNavigationStore()

  const isMobile = computed(() => navigationStore.getIsMobile)
  const isListOpen = ref(true)

  const selectedService = computed<BaSyxComponentKey | undefined>(() => {
    const paramService = route.query.service as string | undefined
    return paramService ? decodeURIComponent(paramService) as BaSyxComponentKey : undefined
  })

  function onSelectService (key: BaSyxComponentKey): void {
    const query = { ...route.query }

    delete query.policy
    delete query.rule
    delete query.definition
    delete query.kind
    delete query.view

    query.service = encodeURIComponent(key)

    router.replace({ query })
  }

  const selectedPolicyVersion = computed(() => {
    const paramId = route.query.policy as string | undefined
    return paramId ? decodeURIComponent(paramId) : undefined
  })

  function onSelectPolicy (version: string | number): void {
    const isCurrentlySelected = selectedPolicyVersion.value?.toString() === version?.toString()
    const query = { ...route.query }

    delete query.rule
    delete query.definition
    delete query.kind
    delete query.view

    if (isCurrentlySelected) {
      delete query.policy
    } else {
      query.policy = encodeURIComponent(version.toString())
    }

    router.push({ query })

    if (isMobile.value && !isCurrentlySelected) {
      isListOpen.value = false
    }
  }

  const selectedRuleIndex = computed(() => {
    const paramId = route.query.rule as string | undefined
    return paramId ? decodeURIComponent(paramId) : undefined
  })

  function onSelectRule (id: string | number): void {
    const isCurrentlySelected = selectedRuleIndex.value?.toString() === id?.toString()
    const query = { ...route.query }

    if (isCurrentlySelected) {
      delete query.rule
    } else {
      query.rule = encodeURIComponent(id.toString())
    }

    router.push({ query })
  }

  const selectedDefinitionKind = computed(() => {
    const paramId = route.query.kind as string | undefined
    return paramId ? decodeURIComponent(paramId) as DefinitionKind : undefined
  })

  const selectedDefinitionName = computed(() => {
    const paramId = route.query.definition as string | undefined
    return paramId ? decodeURIComponent(paramId) : undefined
  })

  function onSelectDefinition (name: string, kind: DefinitionKind): void {
    const isCurrentlySelected = selectedDefinitionName.value?.toString() === name?.toString()
    const query = { ...route.query }

    if (isCurrentlySelected) {
      delete query.definition
      delete query.kind
    } else {
      query.definition = encodeURIComponent(name)
      query.kind = kind
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
    selectedDefinitionName,
    onSelectDefinition,
    selectedView,
    onChangeView,
    isListOpen,
    isMobile,
  }
}
