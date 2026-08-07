<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { hasItems } from '@/utils/array'
  import { hasContent } from '@/utils/StringUtils'

  export interface JsonErrorMessage {
    title: string
    messages?: string[]
  }

  const model = defineModel<string>({ required: true })

  const props = withDefaults(defineProps<{
    label?: string
    errorLines?: number[]
    errorMessage?: JsonErrorMessage | null
    /** Number of visible rows, or 'auto' to fill available height. */
    rows?: number | 'auto'
    disabled?: boolean
  }>(), {
    label: '',
    errorLines: () => [],
    rows: 'auto',
    disabled: false,
  })

  const gutterInner = ref<HTMLElement | null>(null)

  const grow = computed(() => props.rows === 'auto')
  const editorHeight = computed(() => grow.value ? '100%' : `${(props.rows as number) * 20 + 16}px`)
  const lineCount = computed(() => Math.max(1, model.value.split('\n').length))

  function syncScroll (event: Event): void {
    if (gutterInner.value) {
      const { scrollTop } = event.target as HTMLTextAreaElement
      gutterInner.value.style.transform = `translateY(${-scrollTop}px)`
    }
  }

  const isError = computed(() => hasItems(props.errorLines))

  function isErrorLine (n: number): boolean {
    return props.errorLines.includes(n)
  }
  </script>

<template>
  <div class="d-flex flex-column flex-1-1" style="min-height: 0;">
    <span v-if="hasContent(label)" :class="`pa-4 text-body-small ${isError?'text-error':''}`">
      {{ label }}
    </span>

    <div
      class="json-editor"
      :class="{ 'json-editor--grow': grow, 'json-editor--error': isError }"
      :style="{ height: editorHeight }"
    >
      <div class="json-editor__gutter">
        <div ref="gutterInner" class="json-editor__gutter-inner">
          <div
            v-for="n in lineCount"
            :key="n"
            class="json-editor__line-number"
            :class="{ 'json-editor__line-number--error': isErrorLine(n) }"
          >
            {{ n }}
          </div>
        </div>
      </div>

      <textarea
        id="json-editor"
        v-model="model"
        class="json-editor__textarea"
        :disabled="disabled"
        spellcheck="false"
        wrap="off"
        @scroll="syncScroll"
      />
    </div>

    <div v-if="errorMessage" class="text-error ps-4 mt-2 text-body-small">
      <span>{{ errorMessage.title }}</span>

      <ul v-if="hasItems(errorMessage.messages)">
        <li v-for="(err, i) in errorMessage.messages" :key="i">{{ err }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
  .json-editor {
    display: flex;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    font-family: 'Fira Code', 'Roboto Mono', monospace;
    font-size: 13px;
    line-height: 20px; /* MUST match line-number height */
    overflow: hidden;
    background: rgb(var(--v-theme-surface));
  }

  .json-editor--error {
    border-color: rgb(var(--v-theme-error));
  }

  /* Fill the parent when rows === 'auto' */
  .json-editor--grow {
    flex: 1 1 auto;
    min-height: 0; /* allow shrinking inside a flex column */
  }

  .json-editor__gutter {
    flex: 0 0 auto;
    min-width: 40px;
    padding: 8px 8px 8px 12px;
    text-align: right;
    color: rgba(var(--v-theme-on-surface), 0.5);
    background: rgba(var(--v-theme-on-surface), 0.04);
    user-select: none;
    overflow: hidden;
  }

  .json-editor__gutter-inner {
    will-change: transform;
  }

  .json-editor__line-number {
    height: 20px; /* MUST match line-height */
  }

  .json-editor__line-number--error {
    color: rgb(var(--v-theme-error));
    font-weight: 700;
    background: rgba(var(--v-theme-error), 0.12);
  }

  .json-editor__textarea {
    flex: 1 1 auto;
    padding: 8px 12px;
    border: none;
    outline: none;
    resize: none;
    font: inherit;
    line-height: inherit;
    white-space: pre;
    overflow: auto;
    color: rgb(var(--v-theme-on-surface));
    background: transparent;
  }
</style>
