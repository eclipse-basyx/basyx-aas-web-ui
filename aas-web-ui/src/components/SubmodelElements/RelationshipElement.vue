<template>
    <v-container fluid class="pa-0">
        <div v-for="(referenceKey, j) in referenceKeys" :key="j">
            <v-list-item class="px-1 pb-1 pt-0">
                <v-list-item-title class="text-subtitle-2 mt-2">{{
                    capitalizeFirstLetter(referenceKey) +
                    ' (' +
                    getReferences[referenceKey as 'first' | 'second'].type +
                    '): '
                }}</v-list-item-title>
            </v-list-item>
            <v-card v-if="relationshipElementObject" color="elevatedCard">
                <!-- Value of the Property -->
                <v-list nav class="bg-elevatedCard pt-0">
                    <template v-for="(keys, i) in getReferences[referenceKey as 'first' | 'second'].keys" :key="i">
                        <v-list-item>
                            <!-- Tooltip with Reference ID -->
                            <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                                <div class="text-caption">
                                    <span class="font-weight-bold">{{ '(' + keys.type + ') ' }}</span
                                    >{{ keys.value }}
                                </div>
                            </v-tooltip>
                            <!-- Reference Representation -->
                            <template #subtitle>
                                <div class="pt-2">
                                    <v-chip label size="x-small" border class="mr-2">{{ keys.type }}</v-chip>
                                    <span>{{ keys.value }}</span>
                                </div>
                            </template>
                        </v-list-item>
                        <v-divider
                            v-if="(i as number) < getReferences[referenceKey as 'first' | 'second'].keys.length - 1"
                            class="mt-3"></v-divider>
                    </template>
                </v-list>
                <v-divider></v-divider>
                <!-- Action Buttons for Reference Jump -->
                <v-list nav class="bg-elevatedCard pa-0">
                    <v-list-item>
                        <template #append>
                            <!-- Jump-Button -->
                            <v-btn
                                size="small"
                                class="text-buttonText"
                                color="primary"
                                :disabled="getDisabledState[referenceKey as 'first' | 'second']"
                                @click="jumpToReference(getReferences[referenceKey as 'first' | 'second'])"
                                >Jump</v-btn
                            >
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useReferenceComposable } from '@/composables/AAS/ReferenceComposable';
    import { useJumpHandling } from '@/composables/JumpHandling';
    import { capitalizeFirstLetter } from '@/utils/StringUtils';

    const props = defineProps({
        relationshipElementObject: {
            type: Object as any,
            default: {} as any,
        },
    });

    const { checkReference } = useReferenceComposable();
    const { jumpToReference } = useJumpHandling();

    const referenceKeys = ref<Array<string>>(['first', 'second']); // Keys of the References
    const firstReference = ref<any>({});
    const secondReference = ref<any>({});
    const firstLoading = ref<boolean>(false); // Loading State of the first Jump-Button
    const secondLoading = ref<boolean>(false); // Loading State of the second Jump-Button
    const firstDisabled = ref<boolean>(true); // Disabled State of the first Jump-Button
    const secondDisabled = ref<boolean>(true); // Disabled State of the second Jump-Button

    const getReferences = computed(() => {
        return {
            first: firstReference.value,
            second: secondReference.value,
        };
    });

    const getDisabledState = computed(() => {
        return {
            first: firstDisabled.value,
            second: secondDisabled.value,
        };
    });

    watch(
        () => props.relationshipElementObject,
        () => {
            if (props.relationshipElementObject) {
                firstReference.value = props.relationshipElementObject.first;
                secondReference.value = props.relationshipElementObject.second;
                validateReference('first');
                validateReference('second');
            }
        },
        { deep: true, immediate: true }
    );

    onMounted(() => {
        if (props.relationshipElementObject) {
            firstReference.value = props.relationshipElementObject.first;
            secondReference.value = props.relationshipElementObject.second;
            validateReference('first');
            validateReference('second');
        }
    });

    function validateReference(referenceKey: string): void {
        (referenceKey === 'first' ? firstLoading : secondLoading).value = true;

        checkReference((referenceKey === 'first' ? firstReference : secondReference).value)
            .then((success) => {
                (referenceKey === 'first' ? firstDisabled : secondDisabled).value = !success;
                (referenceKey === 'first' ? firstLoading : secondLoading).value = false;
            })
            .catch((error) => {
                // Handle any errors
                console.error('Error:', error);
                (referenceKey === 'first' ? firstLoading : secondLoading).value = false;
            });
    }
</script>
