<template>
  <div class="d-flex flex-grow-1 overflow-hidden">
    <div class="rules-list-panel">
      <DefinitionsList @create="openDialog('create')" />
    </div>

    <div class="d-flex flex-column ga-0 w-100">
      <DefinitionActions
        v-if="policy?.status === 'staged'"
        @patch="openDialog('patch')"
        @replace="openDialog('replace')"
      />

      <DefinitionDetail />
    </div>
  </div>

  <DefinitionDialog ref="definitionDialog" />

</template>

<script setup lang="ts">
  import { useTemplateRef } from 'vue'
  import DefinitionDialog, { type DefinitionDialogMode } from '@/pages/modules/ABAC/components/definition/DefinitionDialog.vue'
  import DefinitionActions from '@/pages/modules/ABAC/components/definition/detail/DefinitionActions.vue'
  import DefinitionDetail from '@/pages/modules/ABAC/components/definition/detail/DefinitionDetail.vue'
  import DefinitionsList from '@/pages/modules/ABAC/components/definition/list/DefinitionsList.vue'
  import { usePolicy } from '@/pages/modules/ABAC/hooks/usePolicy'

  const { policy } = usePolicy()

  const definitionDialog = useTemplateRef<InstanceType<typeof DefinitionDialog>>('definitionDialog')

  function openDialog (mode: DefinitionDialogMode): void {
    definitionDialog.value?.open(mode)
  }
</script>

<style scoped>
.rules-list-panel {
  width: 35vw;
  min-width: 280px;
  max-width: 360px;
  flex-shrink: 1;
  height: 100%;
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
