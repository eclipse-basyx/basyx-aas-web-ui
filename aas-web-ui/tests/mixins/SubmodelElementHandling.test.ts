import { shallowMount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

describe('SubmodelElementHandling', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('should return true for valid Eclass SemanticId', () => {
        // Define a test component that uses the mixin
        const TestComponent = defineComponent({
            mixins: [SubmodelElementHandling],
            template: '<div></div>',
        });

        // Mount the component
        const wrapper: VueWrapper<any> = shallowMount(TestComponent);

        // Define test data
        const submodelElement = {
            semanticId: { keys: [{ value: '0173-1#01-AHF578#001' }] },
        };
        const validEclassSemanticId = '0173-1#01-AHF578#001';

        // Perform the assertion
        expect(wrapper.vm.checkSemanticId(submodelElement, validEclassSemanticId)).toBe(true);
    });
});
