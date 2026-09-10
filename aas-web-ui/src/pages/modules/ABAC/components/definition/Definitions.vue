<template>
  <div class="d-flex flex-grow-1 overflow-y-auto">
    <div class="list-panel">
      <DefinitionsList @create="openDialog" />
    </div>

    <div class="d-flex flex-column ga-0 w-100">
      <DefinitionDetail />
    </div>
  </div>

  <DefinitionDialog ref="definitionDialog" />

</template>

<script setup lang="ts">
  import { DEFINITION_DIALOG_KEY } from '../../constants/inject'
  import DefinitionDialog, { type DefinitionDialogProps } from './DefinitionDialog.vue'
  import DefinitionDetail from './detail/DefinitionDetail.vue'
  import DefinitionsList from './list/DefinitionsList.vue'

  const definitionDialog = useTemplateRef<InstanceType<typeof DefinitionDialog>>('definitionDialog')

  function openDialog (props: DefinitionDialogProps): void {
    definitionDialog.value?.open(props)
  }

  provide(DEFINITION_DIALOG_KEY, openDialog)
</script>

<style scoped>
.list-panel {
  width: 35vw;
  min-width: 280px;
  max-width: 360px;
  flex-shrink: 1;
  height: 100%;
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
