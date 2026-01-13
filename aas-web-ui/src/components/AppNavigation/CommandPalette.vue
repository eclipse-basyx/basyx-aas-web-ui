<template>
    <v-dialog v-model="dialogModel" :max-width="500" absolute contained>
        <v-sheet rounded="lg" border>
            <!-- Global search -->
            <v-combobox
                v-model="search"
                density="comfortable"
                hide-details
                placeholder="Search..."
                autofocus
                prepend-inner-icon="mdi-magnify" />
            <v-card-text class="pa-0" style="max-height: 400px; overflow-y: auto">
                <!-- List of search results -->
                <!-- List of available commands/shortcuts -->
                <v-list density="compact" nav slim>
                    <template v-for="command in commands" :key="command.id">
                        <v-list-subheader v-if="command.isHeader" class="mt-2">
                            {{ command.category }}
                        </v-list-subheader>
                        <v-list-item v-else :title="command.title" link rounded>
                            <template #prepend>
                                <v-icon
                                    v-if="command.prependIcon"
                                    :icon="command.prependIcon"
                                    class="me-2"
                                    size="small" />
                            </template>
                            <template #append>
                                <v-hotkey v-if="command.shortcut" class="text-caption" :keys="command.shortcut" />
                            </template>
                        </v-list-item>
                    </template>
                </v-list>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer />
                <div class="pe-4 text-caption">
                    <v-kbd>Esc</v-kbd>
                    to close
                </div>
            </v-card-actions>
        </v-sheet>
    </v-dialog>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useRouteShortcuts } from '@/composables/Shortcuts/useRouteShortcuts';
    import { useShortcutDefinitions } from '@/composables/Shortcuts/useShortcutDefinitions';

    const props = defineProps<{
        modelValue: boolean;
    }>();

    const emit = defineEmits<{
        'update:modelValue': [value: boolean];
    }>();

    const { shortcuts: globalShortcuts, getDisplayKeys } = useShortcutDefinitions();
    const { shortcuts: routeShortcuts } = useRouteShortcuts();

    const search = ref(null);

    const commands = computed(() => {
        // Combine global and route-specific shortcuts
        const allShortcuts = [...globalShortcuts.value, ...routeShortcuts.value];

        // Group shortcuts by category
        const grouped = allShortcuts.reduce(
            (acc, shortcut) => {
                const category = shortcut.category;
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push({
                    id: shortcut.id,
                    title: shortcut.title,
                    prependIcon: shortcut.prependIcon,
                    shortcut: getDisplayKeys(shortcut),
                    category: category,
                });
                return acc;
            },
            {} as Record<
                string,
                Array<{ id: string; title: string; prependIcon?: string; shortcut: string; category: string }>
            >
        );

        // Convert to array with category headers
        const result: Array<{
            id: string;
            title?: string;
            prependIcon?: string;
            shortcut?: string;
            category: string;
            isHeader?: boolean;
        }> = [];
        Object.keys(grouped).forEach((category) => {
            result.push({ id: `header-${category}`, category, isHeader: true });
            result.push(...grouped[category]);
        });

        return result;
    });

    const dialogModel = computed({
        get: () => props.modelValue,
        set: (value: boolean) => emit('update:modelValue', value),
    });
</script>
