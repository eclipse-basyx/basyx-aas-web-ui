import type { IconProps, IconSet } from 'vuetify'
import aasIcon from './AASIcon.vue'

const customSvgNameToComponent: any = {
  aasIcon,
}

const customIcons: IconSet = {
  component: (props: IconProps) => h(customSvgNameToComponent[props.icon as string]),
}

export { customIcons }
