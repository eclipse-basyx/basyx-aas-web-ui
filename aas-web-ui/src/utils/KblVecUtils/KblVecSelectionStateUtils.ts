export function toggleSelection(current: Set<string>, key: string): Set<string> {
    const next = new Set(current);
    if (next.has(key)) {
        next.delete(key);
    } else {
        next.add(key);
    }

    return next;
}

export function toggleRowSelection(current: Set<string>, selectableKeys: string[]): Set<string> {
    if (selectableKeys.length === 0) {
        return current;
    }

    const next = new Set(current);
    const allSelected = selectableKeys.every((key) => next.has(key));

    for (const key of selectableKeys) {
        if (allSelected) {
            next.delete(key);
        } else {
            next.add(key);
        }
    }

    return next;
}

export function isRowFullySelected(current: Set<string>, selectableKeys: string[]): boolean {
    if (selectableKeys.length === 0) {
        return false;
    }

    return selectableKeys.every((key) => current.has(key));
}

export function isRowPartiallySelected(current: Set<string>, selectableKeys: string[]): boolean {
    if (selectableKeys.length === 0) {
        return false;
    }

    const selectedCount = selectableKeys.reduce((count, key) => (current.has(key) ? count + 1 : count), 0);
    return selectedCount > 0 && selectedCount < selectableKeys.length;
}
