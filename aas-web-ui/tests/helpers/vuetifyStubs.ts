import { defineComponent } from 'vue'

// Consume prefix rather than forwarding it to the read-only DOM property.
export const hotkeyStub = defineComponent({
  props: ['keys', 'prefix'],
  template: '<span>{{ keys }}</span>',
})
