export interface AasListItemLike {
  id?: string | null
}

function toComparableId (item: AasListItemLike): string {
  return String(item?.id ?? '')
}

export function compareAasById<T extends AasListItemLike> (a: T, b: T): number {
  const idA = toComparableId(a)
  const idB = toComparableId(b)

  if (idA === idB) {
    return 0
  }

  return idA > idB ? 1 : -1
}

export function mergeSortedAasById<T extends AasListItemLike> (existingItems: Array<T>, incomingItems: Array<T>): Array<T> {
  if (existingItems.length === 0) {
    return incomingItems
  }

  if (incomingItems.length === 0) {
    return existingItems
  }

  const mergedItems: Array<T> = []
  let existingIndex = 0
  let incomingIndex = 0

  while (existingIndex < existingItems.length && incomingIndex < incomingItems.length) {
    const comparison = compareAasById(existingItems[existingIndex], incomingItems[incomingIndex])

    if (comparison <= 0) {
      mergedItems.push(existingItems[existingIndex])
      existingIndex += 1

      // Skip duplicate IDs if they ever occur despite upstream de-duplication.
      if (comparison === 0) {
        incomingIndex += 1
      }
    } else {
      mergedItems.push(incomingItems[incomingIndex])
      incomingIndex += 1
    }
  }

  while (existingIndex < existingItems.length) {
    mergedItems.push(existingItems[existingIndex])
    existingIndex += 1
  }

  while (incomingIndex < incomingItems.length) {
    mergedItems.push(incomingItems[incomingIndex])
    incomingIndex += 1
  }

  return mergedItems
}

export function appendOrMergeSortedAasById<T extends AasListItemLike> (existingItems: Array<T>, incomingItems: Array<T>): Array<T> {
  if (existingItems.length === 0) {
    return incomingItems
  }

  if (incomingItems.length === 0) {
    return existingItems
  }

  const lastExistingItem = existingItems.at(-1)
  const firstIncomingItem = incomingItems[0]

  if (!lastExistingItem) {
    return incomingItems
  }

  // Fast path: cursor pages continue in strictly increasing sorted order.
  if (compareAasById(lastExistingItem, firstIncomingItem) < 0) {
    return existingItems.concat(incomingItems)
  }

  // Fallback for out-of-order or overlapping pages to preserve deterministic list ordering.
  return mergeSortedAasById(existingItems, incomingItems)
}
