/**
 * Shared row actions for editable entry lists (add, remove, update) so
 * the guided list editors behave uniformly without duplicating splice logic.
 */
export function useListRows<T> (
  entries: () => T[],
  setEntries: (entries: T[]) => void,
  createEntry: () => T,
) {
  function add (): void {
    setEntries([...entries(), createEntry()])
  }

  function update (index: number, entry: T): void {
    setEntries(entries().map((current, i) => (i === index ? entry : current)))
  }

  function remove (index: number): void {
    setEntries(entries().filter((_, i) => i !== index))
  }

  return { add, update, remove }
}
