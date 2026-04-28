import type { LangString } from './template'

export type ArbitraryNodeType
  = | 'section'
    | 'property'
    | 'multiLanguageProperty'
    | 'range'

type BaseArbitraryNode = {
  id: string
  type: ArbitraryNodeType
  label: string
}

export type ArbitraryPropertyNode = BaseArbitraryNode & {
  type: 'property'
  value: string
  valueType?: string
}

export type ArbitraryMultiLanguagePropertyNode = BaseArbitraryNode & {
  type: 'multiLanguageProperty'
  value: LangString[]
}

export type ArbitraryRangeNode = BaseArbitraryNode & {
  type: 'range'
  valueType?: string
  min: string
  max: string
}

export type ArbitrarySectionNode = BaseArbitraryNode & {
  type: 'section'
  children: ArbitraryNode[]
}

export type ArbitraryNode
  = | ArbitrarySectionNode
    | ArbitraryPropertyNode
    | ArbitraryMultiLanguagePropertyNode
    | ArbitraryRangeNode

export type TechnicalPropertyAreaEditorItem = {
  id: string
  arbitraryNodes: ArbitraryNode[]
}
