<template>
  <div class="d-flex flex-grow-1 overflow-hidden">
    <div class="rules-list-panel">
      <RulesList @create="openDialog('create')" />
    </div>

    <div class="d-flex flex-column ga-0 w-100">
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

<script setup lang="ts">
  import { useTemplateRef } from 'vue'
  import RuleActions from '@/pages/modules/ABAC/components/rule/detail/RuleActions.vue'
  import RuleDetail from '@/pages/modules/ABAC/components/rule/detail/RuleDetail.vue'
  import RulesList from '@/pages/modules/ABAC/components/rule/list/RulesList.vue'
  import RuleDialog, { type RuleDialogMode } from '@/pages/modules/ABAC/components/rule/RuleDialog.vue'
  import { usePolicy } from '@/pages/modules/ABAC/hooks/usePolicy'

  const { policy } = usePolicy()

  const ruleDialog = useTemplateRef<InstanceType<typeof RuleDialog>>('ruleDialog')

  function openDialog (mode: RuleDialogMode): void {
    ruleDialog.value?.open(mode)
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
