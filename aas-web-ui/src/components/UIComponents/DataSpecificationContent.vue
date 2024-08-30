<template>
    <v-container fluid class="pa-0">
        <v-list-item>
            <!-- Title -->
            <template v-slot:title>
                <div v-html="'Data Specification Content:'" class="text-subtitle-2 mt-2"></div>
            </template>
            <!-- Content List -->
            <!-- dataType -->
            <v-list-item-title class="pt-3 pl-2" v-if="dataSpecificationObject.dataType">
                <span class="text-caption">DataType: </span>
                <span class="text-primary">{{ dataSpecificationObject.dataType }}</span>
            </v-list-item-title>
            <v-divider
                class="mt-2"
                v-if="dataSpecificationObject.definition && dataSpecificationObject.definition.length > 0"></v-divider>
            <!-- definition -->
            <DescriptionElement
                v-if="dataSpecificationObject.definition && dataSpecificationObject.definition.length > 0"
                :descriptionObject="dataSpecificationObject.definition"
                :descriptionTitle="'Definition'"
                :small="true"></DescriptionElement>
            <v-divider
                class="mt-2"
                v-if="dataSpecificationObject.levelTypes && dataSpecificationObject.levelTypes.length > 0"></v-divider>
            <!-- levelTypes -->
            <!-- TODO: needs visual update -->
            <v-list-item-title
                class="pt-2 pl-2"
                v-if="dataSpecificationObject.levelTypes && dataSpecificationObject.levelTypes.length > 0">
                <div class="text-caption">LevelTypes:</div>
                <span v-for="(levelType, i) in dataSpecificationObject.levelTypes" :key="i" class="text-primary">{{
                    levelType
                }}</span>
            </v-list-item-title>
            <v-divider
                class="mt-2"
                v-if="
                    dataSpecificationObject.preferredName && dataSpecificationObject.preferredName.length > 0
                "></v-divider>
            <!-- preferredName -->
            <DescriptionElement
                v-if="dataSpecificationObject.preferredName && dataSpecificationObject.preferredName.length > 0"
                :descriptionObject="dataSpecificationObject.preferredName"
                :descriptionTitle="'PreferredName'"
                :small="true"></DescriptionElement>
            <v-divider
                class="mt-2"
                v-if="dataSpecificationObject.shortName && dataSpecificationObject.shortName.length > 0"></v-divider>
            <!-- shortName -->
            <DescriptionElement
                v-if="dataSpecificationObject.shortName && dataSpecificationObject.shortName.length > 0"
                :descriptionObject="dataSpecificationObject.shortName"
                :descriptionTitle="'ShortName'"
                :small="true"></DescriptionElement>
            <v-divider class="mt-2" v-if="dataSpecificationObject.unit"></v-divider>
            <!-- unit -->
            <v-list-item-title class="pt-2 pl-2" v-if="dataSpecificationObject.unit">
                <span class="text-caption">Unit: </span>
                <span class="text-primary">{{ dataSpecificationObject.unit }}</span>
            </v-list-item-title>
            <v-list-item v-if="dataSpecificationObject.unitId" class="pb-0">
                <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
                    <div v-for="(unitId, i) in dataSpecificationObject.unitId.keys" :key="i" class="text-caption">
                        <span class="font-weight-bold">{{ '(' + unitId.type + ') ' }}</span>
                        {{ unitId.value }}
                    </div>
                </v-tooltip>
                <template v-slot:title>
                    <span class="text-caption">{{ 'UnitId: ' }}</span>
                </template>
                <template v-slot:subtitle>
                    <v-list-item-subtitle v-for="(unitId, i) in dataSpecificationObject.unitId.keys" :key="i">
                        <div class="pt-1">
                            <v-chip label size="x-small" border class="mr-2">{{ unitId.type }}</v-chip>
                            <span>{{ unitId.value }}</span>
                        </div>
                    </v-list-item-subtitle>
                </template>
            </v-list-item>
            <v-divider
                class="mt-2"
                v-if="dataSpecificationObject.valueList && dataSpecificationObject.valueList.length > 0"></v-divider>
            <!-- valueList -->
            <!-- TODO: needs visual update -->
            <v-list-item-title
                class="pt-2 pl-2"
                v-if="dataSpecificationObject.valueList && dataSpecificationObject.valueList.length > 0">
                <div class="text-caption">ValueList:</div>
                <span v-for="(valueList, i) in dataSpecificationObject.valueList" :key="i" class="text-primary">{{
                    valueList
                }}</span>
            </v-list-item-title>
        </v-list-item>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import SemanticID from './SemanticID.vue';
    import DescriptionElement from './DescriptionElement.vue';

    export default defineComponent({
        name: 'DataSpecificationContent',
        components: {
            SemanticID,
            DescriptionElement,
        },
        props: ['dataSpecificationObject'],

        data() {
            return {};
        },

        mounted() {},

        watch: {},

        computed: {},

        methods: {},
    });
</script>
