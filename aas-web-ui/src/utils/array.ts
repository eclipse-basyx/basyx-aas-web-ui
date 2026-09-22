/**
 * Checks if the array is defined and contains at least one item
 * that is neither null nor undefined.
 *
 * @param array - The optional array to check
 * @returns A boolean indicating if the array has valid items
 */
export function hasItems<T> (array?: T[] | null): array is T[] {
  return !!array && array.some(item => item !== null && item !== undefined)
}
