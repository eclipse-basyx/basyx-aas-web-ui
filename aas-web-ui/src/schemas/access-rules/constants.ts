import type { ACL, AttributeItem, ObjectItem, RightsEnum } from './types/accessRules.generated'
import source from './aas-queries-and-access-rules-3.2.schema.json'

export const ATTRIBUTE_SOURCE_KINDS = Object.keys(source.definitions.attributeItem.properties) as Array<keyof AttributeItem>
export const GLOBAL_ATTRIBUTE_VALUES = source.definitions.attributeItem.properties.GLOBAL.enum as Array<NonNullable<AttributeItem['GLOBAL']>>
export const OBJECT_ITEM_KINDS = Object.keys(source.definitions.objectItem.properties) as Array<keyof ObjectItem>
export const ACCESS_VALUES = source.definitions.ACL.properties.ACCESS.enum as Array<ACL['ACCESS']>
export const RIGHTS_VALUES = source.definitions.rightsEnum.enum as RightsEnum[]
