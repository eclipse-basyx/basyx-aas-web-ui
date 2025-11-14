<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-btn icon="mdi-sort-variant" v-bind="Object.assign({}, props, tooltipProps)" variant="plain" />
        </template>

        <v-card>
            <v-list nav>
                <v-list-subheader>Sort</v-list-subheader>

                <v-list-item>
                    <v-radio-group v-model="sortField" density="compact" hide-details>
                        <v-radio label="Name" value="name" />
                        <v-radio label="Last Updated" value="updated" />
                        <v-radio label="Date Created" value="created" />
                    </v-radio-group>
                </v-list-item>

                <v-btn-toggle
                    v-model="sortDirection"
                    color="primary"
                    variant="outlined"
                    divided
                    density="compact"
                    class="mx-2 mt-1">
                    <v-btn value="asc">
                        <span>Asc</span>
                        <v-icon class="ml-1">mdi-arrow-up</v-icon>
                    </v-btn>
                    <v-btn value="desc">
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
                        v-model="filters.productDesignation"
                        label="Product Designation"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.orderCode"
                        label="Order Code"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.manufacturerCode"
                        label="Manufacturer Code"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
                <v-list-item>
                    <v-text-field
                        v-model="filters.globalAssetId"
                        label="Global Asset ID"
                        density="compact"
                        hide-details
                        class="mt-1"
                        variant="outlined" />
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>
</template>

<script setup>
    import { reactive, ref } from 'vue';

    const sortField = ref('name');
    const sortDirection = ref('asc');

    const filters = reactive({
        manufacturerName: '',
        productDesignation: '',
        orderCode: '',
        manufacturerCode: '',
        globalAssetId: '',
    });

    const clearFilters = () => {
        Object.keys(filters).forEach(k => filters[k] = '');
    };
</script>
