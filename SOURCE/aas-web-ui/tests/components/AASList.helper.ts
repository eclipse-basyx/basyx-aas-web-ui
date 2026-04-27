import { vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AASList from '@/components/AppNavigation/AASList.vue';
import { setActivePinia, createPinia } from 'pinia';


export function initMockEnvironment() {
    const pinia = createPinia();
    setActivePinia(pinia);

    vi.mock('vue-router', () => {
        const pushMock = vi.fn();

        return {
            useRoute: () => ({
                name: 'AASEditor',
                query: {},
            }),
            useRouter: () => ({
                push: pushMock,
            }),
        };
    });

    vi.mock('vuetify', () => ({
    useTheme: () => ({
        global: {
        current: {
            value: {
            dark: false,
            },
        },
        },
        current: {
        value: {
            colors: {
            primary: '#1976d2',
            },
        },
        },
    }),
    }));

    vi.mock('@/composables/AAS/AASHandling', () => ({
        useAASHandling: () => ({
            fetchAasDescriptorList: vi.fn().mockResolvedValue([]),
            fetchAasList: vi.fn().mockResolvedValue([]),
            fetchAas: vi.fn().mockResolvedValue({}),
            fetchAasSmListById: vi.fn().mockResolvedValue([]),
            aasIsAvailableById: vi.fn().mockResolvedValue(true),
        }),
    }));

    vi.mock('@/composables/AAS/ReferableUtils', () => ({
        useReferableUtils: () => ({
            nameToDisplay: (item: any) => item.id,
            descriptionToDisplay: () => '',
        }),
    }));

    vi.mock('@/composables/ClipboardUtil', () => ({
        useClipboardUtil: () => ({
            copyToClipboard: vi.fn(),
        }),
    }));
}

export function createWrapper() {
    const wrapper = mount(AASList, {
        global: {
            mocks: {
                nameToDisplay: (item: any) => item.id,
            },
            stubs: {
                'v-virtual-scroll': true,
                'v-container': true,
                'v-card': true,
                'v-list': true,
                'v-list-item': true,
                'v-btn': true,
                'v-icon': true,
            },
        },
    });

    const setList = (list: any[]) => {
        wrapper.vm.aasList = [...list];
        wrapper.vm.aasListUnfiltered = [...list];
    };

    return { wrapper, setList };
}