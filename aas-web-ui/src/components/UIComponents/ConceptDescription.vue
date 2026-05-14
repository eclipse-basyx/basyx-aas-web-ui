<template>
  <v-container class="pa-0" fluid>
    <v-card v-if="conceptDescriptionObject && Object.keys(conceptDescriptionObject).length > 0">
      <v-list nav>
        <!-- ConceptDescription Identification -->
        <IdentificationElement :identification-object="conceptDescriptionObject" />

        <v-divider
          v-if="conceptDescriptionObject.displayName && conceptDescriptionObject.displayName.length > 0"
          class="mt-2"
        />
        <!-- ConceptDescription DisplayName -->
        <DisplayNameElement
          v-if="conceptDescriptionObject.displayName && conceptDescriptionObject.displayName.length > 0"
          :display-name-array="conceptDescriptionObject.displayName"
          :display-name-title="'Display Name'"
          :small="false"
        />

        <v-divider
          v-if="conceptDescriptionObject.description && conceptDescriptionObject.description.length > 0"
          class="mt-2"
        />
        <!-- ConceptDescription Description -->
        <DescriptionElement
          v-if="conceptDescriptionObject.description && conceptDescriptionObject.description.length > 0"
          :description-array="conceptDescriptionObject.description"
          :description-title="'Description'"
          :small="false"
        />
      </v-list>

      <v-divider
        v-if="
          conceptDescriptionObject.embeddedDataSpecifications &&
            conceptDescriptionObject.embeddedDataSpecifications.length > 0
        "
      />

      <v-list
        v-if="
          conceptDescriptionObject.embeddedDataSpecifications &&
            conceptDescriptionObject.embeddedDataSpecifications.length > 0
        "
        class="px-4 pt-2 pb-4"
        nav
      >
        <v-card
          v-for="(embeddedDataSpecification, i) in conceptDescriptionObject.embeddedDataSpecifications"
          :key="i"
          class="mt-2"
          color="elevatedCard"
        >
          <v-list class="bg-elevatedCard pt-0" nav>
            <!-- hasDataSpecification -->
            <SemanticID
              v-if="
                embeddedDataSpecification.dataSpecification &&
                  embeddedDataSpecification.dataSpecification.keys &&
                  embeddedDataSpecification.dataSpecification.keys.length > 0
              "
              class="mb-2"
              :semantic-id-object="embeddedDataSpecification.dataSpecification"
              :semantic-title="'Data Specification'"
              :small="false"
            />

            <v-divider v-if="embeddedDataSpecification.dataSpecificationContent" class="mt-2" />
            <!-- dataSpecificationContent -->
            <DataSpecificationContent
              v-if="embeddedDataSpecification.dataSpecificationContent"
              :data-specification-object="
                embeddedDataSpecification.dataSpecificationContent
              "
            />
          </v-list>
        </v-card>
      </v-list>
      <!-- Last Sync -->
      <v-divider />
      <LastSync :timestamp="conceptDescriptionObject.timestamp" />
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  defineProps({
    small: {
      type: Boolean,
      default: false,
    },
    conceptDescriptionObject: {
      type: Object as any,
      default: {} as any,
    },
  })
</script>
