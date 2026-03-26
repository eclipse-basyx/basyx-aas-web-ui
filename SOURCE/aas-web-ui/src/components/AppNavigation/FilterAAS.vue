<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-btn icon="mdi-sort-variant" v-bind="props" variant="plain" />
        </template>

        <v-card>
            <v-list nav>
                <v-list-subheader>Sort</v-list-subheader>

                <v-list-item>
                    <v-radio-group v-model="sortField" density="compact" hide-details>
                        <v-radio label="Name" value="nameLower" />
                        <v-radio label="Last Updated" value="updated" />
                        <v-radio label="Date Created" value="created" />
                    </v-radio-group>
                </v-list-item>

                <v-btn-toggle
                    v-model="sortDirection"
                    color="primary"
                    variant="outlined"
                    divided
                    mandatory
                    density="compact"
                    class="mx-2 mt-1">
                    <v-btn :value="1">
                        <span>Asc</span>
                        <v-icon class="ml-1">mdi-arrow-up</v-icon>
                    </v-btn>
                    <v-btn :value="-1">
                        <span>Desc</span>
                        <v-icon class="ml-1">mdi-arrow-down</v-icon>
                    </v-btn>
                </v-btn-toggle>

                <v-divider class="mt-3" />

                <v-list-item>
                    <v-list-subheader>Filters</v-list-subheader>
                    <template #append>
                        <v-btn variant="text" size="small" class="text-primary px-2" @click="clearFilters">Clear</v-btn>
                    </template>
                </v-list-item>

                <v-list-item>
                    <v-text-field
                        v-model="filters.manufacturerName"
                        label="Manufacturer Name"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.manufacturerProductDesignation"
                        label="Product Designation"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.manufacturerProductFamily"
                        label="Product Family"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.manufacturerProductType"
                        label="Product Type"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.orderCodeOfManufacturer"
                        label="Order Code Of Manufacturer"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.productArticleNumberOfManufacturer"
                        label="Product Article Number Of Manufacturer"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.productClassificationSystem"
                        label="Product Classification System"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.productClassId"
                        label="Product Class Id"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>
</template>

<script setup lang="ts">
    import { reactive, ref, watch } from 'vue';

    interface AASAttributeSortValues {
        sortField: number;
        sortDirection: string;
    }

    interface AASAttributeFilters {
        manufacturerName: string;
        manufacturerProductDesignation: string;
        manufacturerProductFamily: string;
        manufacturerProductType: string;
        orderCodeOfManufacturer: string;
        productArticleNumberOfManufacturer: string;
        productClassificationSystem: string;
        productClassId: string;
    }

    const emit = defineEmits<{
        (event: 'update:sort', value: AASAttributeSortValues): void;
        (event: 'update:filters', value: AASAttributeFilters): void;
    }>();

    const sortField = ref('nameLower');
    const sortDirection = ref(1);

    const filters = reactive<AASAttributeFilters>({
        manufacturerName: '',
        manufacturerProductDesignation: '',
        manufacturerProductFamily: '',
        manufacturerProductType: '',
        orderCodeOfManufacturer: '',
        productArticleNumberOfManufacturer: '',
        productClassificationSystem: '',
        productClassId: '',
    });

    const clearFilters = () => {
        Object.keys(filters).forEach((key) => {
            filters[key as keyof AASAttributeFilters] = '';
        });
    };

    watch(
        [sortField, sortDirection, filters],
        () => {
            emit('update:sort', {
                sortField: sortField.value,
                sortDirection: sortDirection.value,
            });
        },
        { deep: true }
    );

    watch(
        () => ({ ...filters }),
        (newFilters) => {
            emit('update:filters', newFilters);
        },
        { deep: true, immediate: true }
    );
</script>
