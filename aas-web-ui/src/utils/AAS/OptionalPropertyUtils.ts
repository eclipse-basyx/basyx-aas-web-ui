export function clearOptionalIdShort(element: object): void {
    // AAS core classes treat optional text fields as nullable. Using delete can produce
    // undefined values that break verification in some cases.
    (element as Record<string, unknown>).idShort = null;
}
