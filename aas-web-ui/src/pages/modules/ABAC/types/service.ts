import type { BaSyxComponentKey } from '@/types/BaSyx'

export interface AbacService {
  name: string
  url: string
  componentKey: BaSyxComponentKey
  available: boolean
}
