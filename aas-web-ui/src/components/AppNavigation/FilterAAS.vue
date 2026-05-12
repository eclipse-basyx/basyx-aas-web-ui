<template>
  <v-menu :close-on-content-click="false" location="bottom">
    <template #activator="{ props }">
      <v-icon icon="mdi-sort-variant" v-bind="props" variant="plain" />
    </template>

    <v-card>
      <v-list nav>
        <v-list-subheader>Sort</v-list-subheader>

        <v-list-item>
          <v-radio-group v-model="sortField" density="compact" hide-details>
            <v-radio label="Name" value="name" />
            <v-radio label="ID" value="id" />
            <v-radio label="ID Short" value="idShort" />
            <v-radio label="Date Created" value="createdAt" />
            <v-radio label="Last Updated" value="updatedAt" />
          </v-radio-group>
        </v-list-item>

        <v-btn-toggle
          v-model="sortDirection"
          class="mx-2 mt-1"
          color="primary"
          density="compact"
          divided
          mandatory
          variant="outlined"
        >
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
            <v-btn class="text-primary px-2" size="small" variant="text" @click="clearFilters">Clear</v-btn>
          </template>
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="filters.manufacturerName"
            class="mt-1"
            density="compact"
            hide-details
            label="Manufacturer Name"
            variant="outlined"
          />
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="filters.manufacturerProductDesignation"
            class="mt-1"
            density="compact"
            hide-details
            label="Product Designation"
            variant="outlined"
          />
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="filters.manufacturerProductFamily"
            class="mt-1"
            density="compact"
            hide-details
            label="Product Family"
            variant="outlined"
          />
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="filters.manufacturerProductType"
            class="mt-1"
            density="compact"
            hide-details
            label="Product Type"
            variant="outlined"
          />
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="filters.orderCodeOfManufacturer"
            class="mt-1"
            density="compact"
            hide-details
            label="Order Code Of Manufacturer"
            variant="outlined"
          />
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="filters.productArticleNumberOfManufacturer"
            class="mt-1"
            density="compact"
            hide-details
            label="Product Article Number Of Manufacturer"
            variant="outlined"
          />
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="filters.productClassificationSystem"
            class="mt-1"
            density="compact"
            hide-details
            label="Product Classification System"
            variant="outlined"
          />
        </v-list-item>

        <v-list-item>
          <v-text-field
            v-model="filters.productClassId"
            class="mt-1"
            density="compact"
            hide-details
            label="Product Class Id"
            variant="outlined"
          />
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
  import { reactive, ref, watch } from 'vue'

  interface AASAttributeSortValues {
    sortField: number
    sortDirection: string
  }

  interface AASAttributeFilters {
    manufacturerName: string
    manufacturerProductDesignation: string
    manufacturerProductFamily: string
    manufacturerProductType: string
    orderCodeOfManufacturer: string
    productArticleNumberOfManufacturer: string
    productClassificationSystem: string
    productClassId: string
  }

  const emit = defineEmits<{
    (event: 'update:sort', value: AASAttributeSortValues): void
    (event: 'update:filters', value: AASAttributeFilters): void
  }>()

  const sortField = ref('name')
  const sortDirection = ref(1)

  const filters = reactive<AASAttributeFilters>({
    manufacturerName: '',
    manufacturerProductDesignation: '',
    manufacturerProductFamily: '',
    manufacturerProductType: '',
    orderCodeOfManufacturer: '',
    productArticleNumberOfManufacturer: '',
    productClassificationSystem: '',
    productClassId: '',
  })

  function clearFilters () {
    for (const key of Object.keys(filters)) {
      filters[key as keyof AASAttributeFilters] = ''
    }
  }

  watch(
    [sortField, sortDirection, filters],
    () => {
      emit('update:sort', {
        sortField: sortField.value,
        sortDirection: sortDirection.value,
      })
    },
    { deep: true },
  )

  watch(
    () => ({ ...filters }),
    newFilters => {
      emit('update:filters', newFilters)
    },
    { deep: true, immediate: true },
  )
</script>
