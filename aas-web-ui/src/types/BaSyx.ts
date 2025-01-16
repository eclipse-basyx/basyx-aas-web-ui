import { Ref } from 'vue';

export interface BaSyxComponent {
    url: Ref<string>;
    loading: Ref<boolean>;
    connected: Ref<boolean | null>;
    connect: () => void;
    label: string;
    pathCheck?: string;
    additionalParams?: (type?: string) => string;
}

export type RepositoryKey =
    | 'AASDiscovery'
    | 'AASRegistry'
    | 'SubmodelRegistry'
    | 'AASRepo'
    | 'SubmodelRepo'
    | 'ConceptDescriptionRepo';
