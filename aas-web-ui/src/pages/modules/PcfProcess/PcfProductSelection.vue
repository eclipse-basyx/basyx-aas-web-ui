<template>
    <v-card border rounded="lg" class="flex-grow-1">
        <v-card-text class="pa-0 d-flex">
            <v-sheet :width="340" class="border-e-thin rounded-s-lg">
                <!-- List of shells -->
                <v-list
                    nav
                    class="px-0 pt-0 rounded-s-lg"
                    :style="{
                        display: 'flex',
                        'flex-direction': 'column',
                        height: listHeight,
                    }">
                    <!-- Title -->
                    <v-list-item class="pl-3">
                        <v-list-item-title class="text-subtitle-1">Select product</v-list-item-title>
                    </v-list-item>
                    <!-- Search -->
                    <v-list-item class="mb-3 mt-0">
                        <v-combobox
                            v-model="search"
                            bg-color="surface-light"
                            density="compact"
                            flat
                            hide-details
                            placeholder="Search..."
                            prepend-inner-icon="mdi-magnify"
                            rounded="lg"
                            single-line
                            clearable
                            variant="outlined"
                            @update:search="applySearch">
                        </v-combobox>
                    </v-list-item>
                    <v-divider></v-divider>
                    <!-- List of Product Types -->
                    <v-virtual-scroll ref="virtualScrollRef" :items="onlyTypeShells" :item-height="46">
                        <template #default="{ item }">
                            <!-- Single AAS -->
                            <v-list-item
                                class="mt-2 mx-2 pr-1"
                                :active="isSelected(item)"
                                color="primarySurface"
                                base-color="listItem"
                                variant="tonal"
                                style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
                                :border="isSelected(item) ? 'primary' : 'listItem thin'"
                                :style="{
                                    'border-color': isSelected(item)
                                        ? primaryColor + ' !important'
                                        : isDark
                                          ? '#686868 !important'
                                          : '#ABABAB !important',
                                }"
                                @click="selectShell(item)">
                                <!-- Tooltip with idShort and id -->
                                <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                                    <div class="text-caption">
                                        <span class="font-weight-bold">{{ 'idShort: ' }}</span
                                        >{{ item['idShort'] }}
                                    </div>
                                    <div class="text-caption">
                                        <span class="font-weight-bold">{{ 'ID: ' }}</span
                                        >{{ item['id'] }}
                                    </div>
                                </v-tooltip>
                                <!-- idShort of the AAS -->
                                <template #title>
                                    <div class="text-primary" style="z-index: 9999">{{ nameToDisplay(item) }}</div>
                                </template>
                                <!-- id of the AAS -->
                                <template #subtitle>
                                    <div class="text-listItemText">{{ item['id'] }}</div>
                                </template>
                                <!-- open Shell in new tab -->
                                <template #append>
                                    <v-btn
                                        icon="custom:aasIcon"
                                        size="x-small"
                                        variant="plain"
                                        color="primary"
                                        style="z-index: 9000; margin-left: -6px"
                                        :href="getHref(item)"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        @click.stop></v-btn>
                                </template>
                            </v-list-item>
                        </template>
                    </v-virtual-scroll>
                </v-list>
            </v-sheet>
            <div class="flex-grow-1 pa-4">
                <v-empty-state
                    v-if="!selectedShell"
                    icon="mdi-gesture-tap"
                    text="Please select a product type to create a production order."
                    title="Select Product Type">
                    <template #media>
                        <v-icon size="64" />
                    </template>
                </v-empty-state>
                <template v-else>
                    <v-list-item class="pl-0 pt-0">
                        <template #title>
                            <div class="text-subtitle-2">Display Name for the product</div>
                        </template>
                    </v-list-item>
                    <MultiLanguageTextInput v-model="displayName" :show-label="false" type="displayName" />
                </template>
            </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
            <div style="width: 340px"></div>
            <v-spacer></v-spacer>
            <v-btn
                variant="flat"
                color="success"
                class="text-none text-buttonText"
                :disabled="!selectedShell"
                text="Produce"
                @click="produce" />
            <v-spacer></v-spacer>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts" setup>
    import { computed, defineEmits, onMounted, ref } from 'vue';
    import { useTheme } from 'vuetify';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    const { nameToDisplay } = useReferableUtils();
    const { fetchAasList } = useAASHandling();

    const theme = useTheme();

    const emit = defineEmits<{
        (e: 'finished', shell: any): void;
    }>();

    const modelValue = defineModel<number>();
    const listHeight = ref('calc(100vh - 184px)');
    const search = ref<string | null>(null);
    const selectedShell = ref<any>(null);
    const virtualScrollRef = ref<any>(null);
    const allShells = ref<Array<any>>([]);
    const shells = ref<Array<any>>([]);
    const displayName = ref<any>(undefined);

    const isDark = computed(() => theme.global.current.value.dark);
    const primaryColor = computed(() => theme.current.value.colors.primary);
    const onlyTypeShells = computed(() =>
        shells.value.filter(
            (shell) =>
                shell['assetInformation'] &&
                shell['assetInformation']['assetKind'] &&
                shell['assetInformation']['assetKind'] === 'Type'
        )
    );

    onMounted(async () => {
        await fetchShells();
    });

    async function fetchShells(): Promise<void> {
        allShells.value = await fetchAasList();
        shells.value = allShells.value;
    }

    async function applySearch(): Promise<void> {
        if (search.value) {
            shells.value = allShells.value.filter((shell) =>
                shell['idShort'].toLowerCase().includes(search.value?.toLowerCase() || '')
            );
        } else {
            shells.value = allShells.value;
        }
    }

    function isSelected(shell: any): boolean {
        return selectedShell.value?.id === shell.id;
    }

    function selectShell(shell: any): void {
        selectedShell.value = JSON.parse(JSON.stringify(shell));
        displayName.value = selectedShell.value['displayName'];
    }

    function getHref(shell: any): string {
        return `${window.location.origin}?aas=${shell.path}`;
    }

    function produce(): void {
        if (selectedShell.value) {
            modelValue.value = 2; // Move to next step
            emit('finished', selectedShell.value);
        }
    }
</script>
