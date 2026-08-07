<script setup lang="ts">
  import { useTemplateRef } from 'vue'
  import { usePolicy } from '../../hooks/usePolicy'
  import DefinitionDialog, { type DefinitionDialogMode } from './DefinitionDialog.vue'
  import DefinitionActions from './detail/DefinitionActions.vue'
  import DefinitionDetail from './detail/DefinitionDetail.vue'
  import DefinitionsList from './list/DefinitionsList.vue'

  const { policy } = usePolicy()

  const definitionDialog = useTemplateRef<InstanceType<typeof DefinitionDialog>>('definitionDialog')

  function openDialog (mode: DefinitionDialogMode): void {
    definitionDialog.value?.open(mode)
  }
</script>

<template>
  <div class="d-flex flex-grow-1 overflow-hidden">
    <div class="rules-list-panel">
      <DefinitionsList @create="openDialog('create')" />
    </div>

    <div class="d-flex flex-column align-content-start ga-0 w-100">
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

<style scoped>
.rules-list-panel {
  width: 30vw;
  max-width: 45%;
  height: 100%;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
