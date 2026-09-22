export type Accessor = 'created_at' | 'updated_at' | 'status'
export type Order = 'asc' | 'desc'

export interface Sort {
  accessor: Accessor
  order: Order
}
