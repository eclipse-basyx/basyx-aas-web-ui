import { ESLint } from 'eslint'

const eslint = new ESLint({ cwd: process.cwd() })

async function lintRule (code: string, filePath: string, ruleId: string) {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter(message => message.ruleId === ruleId)
}

describe('Vue API auto-import restrictions', () => {
  const ruleId = 'no-restricted-imports'

  it('reports runtime APIs configured for auto-import', async () => {
    const messages = await lintRule('import { computed, ref } from \'vue\'\nvoid computed\nvoid ref\n', 'src/rule-probe.ts', ruleId)

    expect(messages).toHaveLength(2)
  })

  it('allows Vue APIs outside the configured auto-import list', async () => {
    const messages = await lintRule('import { withDirectives } from \'vue\'\nvoid withDirectives\n', 'src/rule-probe.ts', ruleId)

    expect(messages).toHaveLength(0)
  })

  it('allows type imports', async () => {
    const messages = await lintRule('import type { EffectScope } from \'vue\'\ntype Scope = EffectScope\n', 'src/rule-probe.ts', ruleId)

    expect(messages).toHaveLength(0)
  })
})

describe('component auto-import restrictions', () => {
  const ruleId = 'basyx/no-redundant-auto-imported-component'

  it('reports a component import used only as a static template tag', async () => {
    const messages = await lintRule(`<template>
  <AASList />
</template>

<script setup lang="ts">
  import AASList from '@/components/AppNavigation/AASList.vue'
</script>
`, 'src/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(1)
    expect(messages[0].message).toContain('The \'AASList\' import is redundant')
  })

  it('detects extensionless component imports', async () => {
    const messages = await lintRule(`<template>
  <AASList />
</template>

<script setup lang="ts">
  import AASList from '@/components/AppNavigation/AASList'
</script>
`, 'src/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(1)
  })

  it('detects relative component imports and kebab-case template tags', async () => {
    const messages = await lintRule(`<template>
  <aas-list />
</template>

<script setup lang="ts">
  import AASList from './AASList.vue'
</script>
`, 'src/components/AppNavigation/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(1)
  })

  it('allows components used as script values', async () => {
    const messages = await lintRule(`<template>
  <AASList />
</template>

<script setup lang="ts">
  import AASList from '@/components/AppNavigation/AASList.vue'

  const componentRegistry = { AASList }
  void componentRegistry
</script>
`, 'src/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(0)
  })

  it('allows components used as script types', async () => {
    const messages = await lintRule(`<template>
  <AASList />
</template>

<script setup lang="ts">
  import AASList from '@/components/AppNavigation/AASList.vue'

  type AASListInstance = InstanceType<typeof AASList>
  defineExpose<{ instance?: AASListInstance }>()
</script>
`, 'src/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(0)
  })

  it('allows components referenced in template expressions', async () => {
    const messages = await lintRule(`<template>
  <AASList :is="AASList" />
</template>

<script setup lang="ts">
  import AASList from '@/components/AppNavigation/AASList.vue'
</script>
`, 'src/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(0)
  })

  it('allows type-only component imports', async () => {
    const messages = await lintRule(`<template>
  <div />
</template>

<script setup lang="ts">
  import type AASList from '@/components/AppNavigation/AASList.vue'

  type AASListInstance = InstanceType<typeof AASList>
  defineExpose<{ instance?: AASListInstance }>()
</script>
`, 'src/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(0)
  })

  it('allows component resource imports', async () => {
    const messages = await lintRule(`<template>
  <div />
</template>

<script setup lang="ts">
  import aasListSource from '@/components/AppNavigation/AASList.vue?raw'

  void aasListSource
</script>
`, 'src/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(0)
  })

  it('allows aliases that are not globally auto-imported names', async () => {
    const messages = await lintRule(`<template>
  <NavigationList />
</template>

<script setup lang="ts">
  import NavigationList from '@/components/AppNavigation/AASList.vue'
</script>
`, 'src/rule-probe.vue', ruleId)

    expect(messages).toHaveLength(0)
  })
})
