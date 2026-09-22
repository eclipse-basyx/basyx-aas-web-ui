export interface AbacResponse<T> {
  success: boolean
  data?: T
  status?: number
}
