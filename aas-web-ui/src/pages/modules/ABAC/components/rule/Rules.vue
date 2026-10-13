<template>
  <div class="d-flex flex-grow-1 overflow-x-hidden overflow-y-auto">
    <div class="list-panel">
      <RulesList @create="openDialog" />
    </div>

    <div class="detail-panel d-flex flex-column flex-1-1 ga-0">
      <RuleDetail />
    </div>
  </div>

  <RuleDialog ref="ruleDialog" />

</template>

<script setup lang="ts">
  import { RULE_DIALOG_KEY } from '../../constants/inject'
  import RuleDetail from './detail/RuleDetail.vue'
  import RulesList from './list/RulesList.vue'
  import RuleDialog, { type RuleDialogProps } from './RuleDialog.vue'

  const ruleDialog = useTemplateRef<InstanceType<typeof RuleDialog>>('ruleDialog')

  function openDialog (props: RuleDialogProps): void {
    ruleDialog.value?.open(props)
  }

  provide(RULE_DIALOG_KEY, openDialog)
</script>

<style scoped>
.detail-panel { min-width: 0; }
.list-panel {
  width: 35vw;
  min-width: 280px;
  max-width: 360px;
  flex-shrink: 1;
  height: 100%;
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
