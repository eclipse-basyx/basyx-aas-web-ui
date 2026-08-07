<script setup lang="ts">
  import { useTemplateRef } from 'vue'
  import { usePolicy } from '../../hooks/usePolicy'
  import RuleActions from './detail/RuleActions.vue'
  import RuleDetail from './detail/RuleDetail.vue'
  import RulesList from './list/RulesList.vue'
  import RuleDialog, { type RuleDialogMode } from './RuleDialog.vue'

  const { policy } = usePolicy()

  const ruleDialog = useTemplateRef<InstanceType<typeof RuleDialog>>('ruleDialog')

  function openDialog (mode: RuleDialogMode): void {
    ruleDialog.value?.open(mode)
  }

</script>

<template>
  <div class="d-flex flex-grow-1 overflow-hidden">
    <div class="rules-list-panel">
      <RulesList @create="openDialog('create')" />
    </div>

    <div class="d-flex flex-column align-content-start ga-0 w-100">
      <RuleActions
        v-if="policy?.status === 'staged'"
        @patch="openDialog('patch')"
        @replace="openDialog('replace')"
      />

      <RuleDetail />
    </div>
  </div>

  <RuleDialog ref="ruleDialog" />

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
