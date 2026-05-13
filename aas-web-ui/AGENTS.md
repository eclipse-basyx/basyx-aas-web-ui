# Project Rules

## General

- Follow the existing code style and patterns.
- Use pnpm for running project commands.
- Keep code in TypeScript unless migration is required.

## Stack

- Framework: Vue 3 + Vite
- UI Library: Vuetify
- Enabled Features: ESLint, Pinia, Vuetify MCP, Vue Router

## Handoff Checks

- Before handing implementation back, run lint and relevant tests for changed files.
- Do not mark work as complete if CI-relevant lint errors are still present.
