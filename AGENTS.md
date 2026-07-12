# Project Rules

## General

- Follow the existing code style and patterns.
- Use pnpm for running project commands.
- Keep code in TypeScript unless migration is required.
- Dont use <style> tags in Vue templates. Use Vuetify classes or scoped CSS instead.
- Keep components small and focused. If a components <template> exceeds 200 lines, consider splitting it into smaller components.
- Keep the code DRY. If you find yourself repeating code, consider creating a reusable component or composable.
- Keep the code readable and lean. Avoid unnecessary complexity and abstractions. If a piece of code is hard to understand, consider refactoring it.
- Structure vue components with the following order: <template>, <script setup>, <style scoped>. Use the <script setup> syntax for all components.
- Structure the <script> section with the following order: imports, props, emits, refs, reactive state, computed properties, watchers, lifecycle hooks and methods

## Stack

- Framework: Vue 3 + Vite
- UI Library: Vuetify 4
- Enabled Features: ESLint, Pinia, Vuetify MCP, Vue Router

## Handoff Checks

- Before handing implementation back, run lint and relevant tests for changed files.
- Do not mark work as complete if CI-relevant lint errors are still present.

## E2E Testing (Vuetify)

- For integration E2E, test against the current branch UI build, not a published snapshot image.
- If local results look inconsistent, rebuild and recreate the UI container before debugging selectors.
- Prefer user-facing selectors (role and visible labels) over component internals.
- For Vuetify v-select in Playwright, keyboard selection is often more reliable than option click:
	click combobox, then ArrowDown and Enter.
- When multiple v-select controls are present and labels are unstable in headless mode, scope selection by layout position (for example, v-select index in the active panel).
- After selection steps, assert committed state before continuing (for example, Fetch Data button becomes visible for LinkedSegment).
- For chart assertions, prefer accessibility roles and names (for example, line chart application role) instead of low-level DOM primitives like canvas.
