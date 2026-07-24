import type { IconProps, IconSet } from 'vuetify'
import { h } from 'vue'
import aasIcon from './AASIcon.vue'
import edcIcon from './EDCIcon.vue'
import tractusxIcon from './TractusXIcon.vue'

const customSvgNameToComponent: any = {
  aasIcon, edcIcon, tractusxIcon,
}

const customIcons: IconSet = {
  component: (props: IconProps) => h(customSvgNameToComponent[props.icon as string]),
}

export { customIcons }
