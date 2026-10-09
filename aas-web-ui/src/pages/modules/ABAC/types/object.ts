// Objects merge recursively; arrays (including their elements) are replaced whole.
export type Merge<T> = T extends readonly unknown[] ? T
  : T extends object ? { [K in keyof T]?: Merge<T[K]> | null }
    : T
