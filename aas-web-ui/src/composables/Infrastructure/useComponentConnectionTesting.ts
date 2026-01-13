import type { BaSyxComponentKey } from '@/types/BaSyx';
import type { ComponentConnectionStatus, ComponentTestingLoading } from '@/types/Infrastructure';
import { type Ref, ref } from 'vue';
import { useInfrastructureStore } from '@/store/InfrastructureStore';
import { BASYX_COMPONENT_KEYS } from '@/utils/InfrastructureUtils';

/**
 * Composable for managing BaSyx component connection testing
 */
export function useComponentConnectionTesting(): {
    componentConnectionStatus: Ref<ComponentConnectionStatus>;
    componentTestingLoading: Ref<ComponentTestingLoading>;
    testingAllConnections: Ref<boolean>;
    testComponentConnection: (componentKey: BaSyxComponentKey, url: string) => Promise<void>;
    testAllConnections: (components: Record<BaSyxComponentKey, { url: string }>) => Promise<void>;
    resetConnectionStatus: () => void;
} {
    const infrastructureStore = useInfrastructureStore();

    // State
    const componentConnectionStatus = ref<ComponentConnectionStatus>({} as ComponentConnectionStatus);
    const componentTestingLoading = ref<ComponentTestingLoading>({} as ComponentTestingLoading);
    const testingAllConnections = ref(false);

    /**
     * Test connection to a single component
     */
    async function testComponentConnection(componentKey: BaSyxComponentKey, url: string): Promise<void> {
        if (!url || url.trim() === '') {
            componentConnectionStatus.value[componentKey] = false;
            return;
        }

        componentTestingLoading.value[componentKey] = true;
        componentConnectionStatus.value[componentKey] = null;

        try {
            // Temporarily set the component URL in the store to test it
            const originalUrl = infrastructureStore.getBasyxComponents[componentKey].url;
            infrastructureStore.dispatchIsTestingConnections(true);
            infrastructureStore.getBasyxComponents[componentKey].url = url;

            // Test the connection
            await infrastructureStore.connectComponent(componentKey);

            // Get the connection result
            const connected = infrastructureStore.getBasyxComponents[componentKey].connected;
            componentConnectionStatus.value[componentKey] = connected;

            // Restore original URL
            infrastructureStore.getBasyxComponents[componentKey].url = originalUrl;
        } catch {
            componentConnectionStatus.value[componentKey] = false;
        } finally {
            infrastructureStore.dispatchIsTestingConnections(false);
            componentTestingLoading.value[componentKey] = false;
        }
    }

    /**
     * Test all component connections
     */
    async function testAllConnections(components: Record<BaSyxComponentKey, { url: string }>): Promise<void> {
        testingAllConnections.value = true;
        const testPromises = BASYX_COMPONENT_KEYS.map((key) => testComponentConnection(key, components[key].url));
        await Promise.all(testPromises);
        testingAllConnections.value = false;
    }

    /**
     * Reset connection status for all components
     */
    function resetConnectionStatus(): void {
        BASYX_COMPONENT_KEYS.forEach((key) => {
            componentConnectionStatus.value[key] = null;
            componentTestingLoading.value[key] = false;
        });
    }

    return {
        // State
        componentConnectionStatus,
        componentTestingLoading,
        testingAllConnections,
        // Methods
        testComponentConnection,
        testAllConnections,
        resetConnectionStatus,
    };
}
