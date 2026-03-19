export function formatLabel(idShort: string): string {
    return idShort.replace(/([a-z])([A-Z])/g, '$1 $2');
}
