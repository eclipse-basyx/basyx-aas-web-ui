import { Ref } from 'vue';

export interface BaSyxComponent {
    url: Ref<string>;
    loading: Ref<boolean>;
    connected: Ref<boolean | null>;
    connect: () => void;
    label: string;
    identification: string;
    pathCheck?: string;
    additionalParams?: (type?: string) => string;
}

export type BaSyxComponentKey =
    | 'AASDiscovery'
    | 'AASRegistry'
    | 'SubmodelRegistry'
    | 'AASRepo'
    | 'SubmodelRepo'
    | 'ConceptDescriptionRepo';
