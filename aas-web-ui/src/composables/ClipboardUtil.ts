import { useNavigationStore } from '@/store/NavigationStore';

export function useClipboardUtil() {
    // Store
    const navigationStore = useNavigationStore();

    function copyToClipboard(value: string, valueName: string, iconReference: { value: string }): void {
        if (!value) return;

        iconReference.value = 'mdi-check';

        // copy value to clipboard
        try {
            navigator.clipboard.writeText(value);
        } catch {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'false',
                btnColor: 'buttonText',
                text: 'Failed to copy JSON to Clipboard.',
            });
        }

        // set the clipboard tooltip to false after 1.5 seconds
        setTimeout(() => {
            iconReference.value = 'mdi-clipboard-file-outline';
        }, 2000);

        // open Snackbar to inform the user that the path was copied to the clipboard
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 2000,
            color: 'success',
            btnColor: 'buttonText',
            text: (valueName.trim() !== '' ? valueName : "'" + value + "'") + ' copied to Clipboard.',
        });
    }

    function copyJsonToClipboard(value: unknown, valueName: string, iconReference: { value: string }): void {
        if (!value) return;

        // Clean the JSON object recursively
        const cleanedValue = cleanObjectRecursively(value);

        iconReference.value = 'mdi-check';

        // copy value to clipboard
        try {
            navigator.clipboard.writeText(JSON.stringify(cleanedValue, null, 2));
        } catch {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'false',
                btnColor: 'buttonText',
                text: 'Failed to copy JSON to Clipboard.',
            });
        }

        // set the clipboard tooltip to false after 1.5 seconds
        setTimeout(() => {
            iconReference.value = 'mdi-clipboard-text-outline';
        }, 2000);

        // open Snackbar to inform the user that the path was copied to the clipboard
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 2000,
            color: 'success',
            btnColor: 'buttonText',
            text:
                (valueName.trim() !== ''
                    ? valueName
                    : typeof cleanedValue === 'object' && cleanedValue !== null && 'modelType' in cleanedValue
                      ? (cleanedValue as { modelType?: string }).modelType || 'JSON'
                      : 'JSON') + ' copied to Clipboard.',
        });
    }

    function cleanObjectRecursively(obj: unknown): unknown {
        if (obj === null || obj === undefined) {
            return obj;
        }

        // If it's an array, recursively clean each element
        if (Array.isArray(obj)) {
            return obj.map((item) => cleanObjectRecursively(item));
        }

        // If it's an object, create a copy and recursively clean it
        if (typeof obj === 'object') {
            const cleaned = { ...(obj as Record<string, unknown>) };

            // Remove tree-specific properties that were added by prepareForTree
            delete cleaned.showChildren;
            delete cleaned.parent;
            delete cleaned.path;
            delete cleaned.timestamp;
            delete cleaned.conceptDescriptions;
            delete cleaned.idLower;
            delete cleaned.idShortLower;
            delete cleaned.nameLower;
            delete cleaned.descLower;
            delete cleaned.endpoints;

            // Remove id property for all elements except Submodels
            if (cleaned.modelType !== 'Submodel') {
                delete cleaned.id;
            }

            // Restore original structure based on modelType
            if (cleaned.modelType === 'Submodel' && Array.isArray(cleaned.children)) {
                // For Submodels, children should go back to submodelElements
                cleaned.submodelElements = cleanObjectRecursively(cleaned.children);
                delete cleaned.children;
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(cleaned.modelType as string) &&
                Array.isArray(cleaned.children)
            ) {
                // For Collections and Lists, children should go back to value
                cleaned.value = cleanObjectRecursively(cleaned.children);
                delete cleaned.children;
            } else if (cleaned.modelType === 'Entity' && Array.isArray(cleaned.children)) {
                // For Entities, children should go back to statements
                cleaned.statements = cleanObjectRecursively(cleaned.children);
                delete cleaned.children;
            } else {
                // Remove children property if it exists but doesn't match any known pattern
                delete cleaned.children;
            }

            // Recursively clean all remaining properties
            for (const key in cleaned) {
                if (Object.prototype.hasOwnProperty.call(cleaned, key)) {
                    cleaned[key] = cleanObjectRecursively(cleaned[key]);
                }
            }

            return cleaned;
        }

        // For primitive types, return as is
        return obj;
    }

    return { copyToClipboard, copyJsonToClipboard, cleanObjectRecursively };
}
