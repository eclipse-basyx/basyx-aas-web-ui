<template>
    <v-container fluid class="pa-0">
        <div v-for="(referenceKey, j) in referenceKeys" :key="j">
            <v-list-item class="px-1 pb-1 pt-0">
                <v-list-item-title class="text-subtitle-2 mt-2">{{
                    capitalizeFirstLetter(referenceKey) +
                    ' (' +
                    getReferences[referenceKey as 'first' | 'second']?.type +
                    '): '
                }}</v-list-item-title>
            </v-list-item>
            <v-card v-if="relationshipElementObject" color="elevatedCard">
                <!-- Value of the Property -->
                <v-list nav class="bg-elevatedCard pt-0">
                    <template v-if="hasReferenceKeysByKey(referenceKey as 'first' | 'second')">
                        <template v-for="(keys, i) in getReferences[referenceKey as 'first' | 'second']?.keys" :key="i">
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
                                v-if="
                                    (i as number) <
                                    (getReferences[referenceKey as 'first' | 'second']?.keys.length ?? 0) - 1
                                "
                                class="mt-3"></v-divider>
                        </template>
                    </template>
                    <template v-else>
                        <v-list-item class="px-1">
                            <v-alert
                                text="No reference keys set"
                                density="compact"
                                type="info"
                                variant="outlined"
                                class="mt-2">
                            </v-alert>
                        </v-list-item>
                    </template>
                </v-list>
                <v-divider v-if="hasReferenceKeysByKey(referenceKey as 'first' | 'second')"></v-divider>
                <!-- Action Buttons for Reference Jump -->
                <v-list
                    v-if="hasReferenceKeysByKey(referenceKey as 'first' | 'second')"
                    nav
                    class="bg-elevatedCard pa-0">
                    <v-list-item>
                        <template #append>
                            <!-- Jump-Button -->
                            <v-btn
                                size="small"
                                class="text-buttonText"
                                color="primary"
                                :disabled="getDisabledState[referenceKey as 'first' | 'second']"
                                @click="jumpToReferenceByKey(referenceKey as 'first' | 'second')"
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
    import { computed, ref, watch } from 'vue';
    import { useReferenceComposable } from '@/composables/AAS/ReferenceComposable';
    import { useJumpHandling } from '@/composables/JumpHandling';
    import { capitalizeFirstLetter } from '@/utils/StringUtils';

    type RelationshipReferenceKey = 'first' | 'second';

    type RelationshipReference = {
        type: string;
        keys: Array<{ type: string; value: string }>;
    };

    type RelationshipElementObject = {
        first?: RelationshipReference | null;
        second?: RelationshipReference | null;
    };

    const emptyReference: RelationshipReference = {
        type: 'Not set',
        keys: [],
    };

    const props = defineProps<{
        relationshipElementObject?: RelationshipElementObject | null;
    }>();

    const { checkReference } = useReferenceComposable();
    const { jumpToReference } = useJumpHandling();

    const referenceKeys = ref<Array<RelationshipReferenceKey>>(['first', 'second']); // Keys of the References
    const firstReference = ref<RelationshipReference | null>(null);
    const secondReference = ref<RelationshipReference | null>(null);
    const firstLoading = ref<boolean>(false); // Loading State of the first Jump-Button
    const secondLoading = ref<boolean>(false); // Loading State of the second Jump-Button
    const firstDisabled = ref<boolean>(true); // Disabled State of the first Jump-Button
    const secondDisabled = ref<boolean>(true); // Disabled State of the second Jump-Button

    function hasReferenceObject(reference: RelationshipReference | null): boolean {
        return !!reference && typeof reference.type === 'string' && Array.isArray(reference.keys);
    }

    function hasReferenceKeys(reference: RelationshipReference | null): boolean {
        return hasReferenceObject(reference) && (reference?.keys.length ?? 0) > 0;
    }

    const getReferences = computed(() => {
        return {
            first: hasReferenceObject(firstReference.value) ? firstReference.value : emptyReference,
            second: hasReferenceObject(secondReference.value) ? secondReference.value : emptyReference,
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
                firstReference.value = props.relationshipElementObject.first ?? null;
                secondReference.value = props.relationshipElementObject.second ?? null;
                validateReference('first');
                validateReference('second');
            }
        },
        { deep: true, immediate: true }
    );

    function validateReference(referenceKey: RelationshipReferenceKey): void {
        const reference = (referenceKey === 'first' ? firstReference : secondReference).value;
        if (!hasReferenceKeys(reference)) {
            (referenceKey === 'first' ? firstDisabled : secondDisabled).value = true;
            (referenceKey === 'first' ? firstLoading : secondLoading).value = false;
            return;
        }

        (referenceKey === 'first' ? firstLoading : secondLoading).value = true;

        checkReference(reference)
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

    function jumpToReferenceByKey(referenceKey: RelationshipReferenceKey): void {
        const reference = (referenceKey === 'first' ? firstReference : secondReference).value;
        if (!hasReferenceKeys(reference)) {
            return;
        }
        jumpToReference(reference);
    }

    function hasReferenceKeysByKey(referenceKey: RelationshipReferenceKey): boolean {
        const reference = (referenceKey === 'first' ? firstReference : secondReference).value;
        return hasReferenceKeys(reference);
    }
</script>
