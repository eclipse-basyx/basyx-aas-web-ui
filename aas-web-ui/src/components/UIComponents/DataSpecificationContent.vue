<template>
    <v-container fluid class="pa-0">
        <v-list-item v-if="dataSpecificationObject && Object.keys(dataSpecificationObject).length > 0" class="pb-0">
            <!-- Title -->
            <template #title>
                <div class="text-subtitle-2 mt-2">{{ 'Data Specification Content:' }}</div>
            </template>
            <!-- Content List -->
            <!-- DataType -->
            <v-list-item-title v-if="dataSpecificationObject.dataType" class="py-3 pl-2">
                <span class="text-caption">DataType: </span>
                <span class="text-primary">{{ dataSpecificationObject.dataType }}</span>
            </v-list-item-title>
            <v-divider
                v-if="
                    dataSpecificationObject.definition &&
                    Array.isArray(dataSpecificationObject.definition) &&
                    dataSpecificationObject.definition.length > 0
                " />
            <!-- Definition -->
            <LangStringsPanel
                :lang-strings-array="dataSpecificationObject.definition"
                :title="'Definition'"
                :background-color="'elevatedCard'" />
            <v-divider v-if="dataSpecificationObject.levelTypes && dataSpecificationObject.levelTypes.length > 0" />
            <!-- LevelTypes -->
            <!-- TODO: DataSpecification levelTypes needs visual update -->
            <v-list-item-title
                v-if="dataSpecificationObject.levelTypes && dataSpecificationObject.levelTypes.length > 0"
                class="pt-2 pl-2">
                <div class="text-caption">LevelTypes:</div>
                <span v-for="(levelType, i) in dataSpecificationObject.levelTypes" :key="i" class="text-primary">{{
                    levelType
                }}</span>
            </v-list-item-title>
            <v-divider
                v-if="
                    dataSpecificationObject.preferredName &&
                    Array.isArray(dataSpecificationObject.preferredName) &&
                    dataSpecificationObject.preferredName.length > 0
                " />
            <!-- PreferredName -->
            <LangStringsPanel
                :lang-strings-array="dataSpecificationObject.preferredName"
                :title="'Preferred Name'"
                :background-color="backgroundColor" />
            <v-divider
                v-if="
                    dataSpecificationObject.shortName &&
                    Array.isArray(dataSpecificationObject.shortName) &&
                    dataSpecificationObject.shortName.length > 0
                " />
            <!-- ShortName -->
            <LangStringsPanel
                :lang-strings-array="dataSpecificationObject.shortName"
                :title="'Short Name'"
                :background-color="backgroundColor" />
            <v-divider v-if="dataSpecificationObject.unit" />
            <!-- Unit -->
            <v-list-item-title v-if="dataSpecificationObject.unit" class="py-2 pl-2">
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
                <template #title>
                    <span class="text-caption">{{ 'Unit Id: ' }}</span>
                </template>
                <template #subtitle>
                    <v-list-item-subtitle v-for="(unitId, i) in dataSpecificationObject.unitId.keys" :key="i">
                        <div class="pt-1">
                            <v-chip label size="x-small" border class="mr-2">{{ unitId.type }}</v-chip>
                            <span>{{ unitId.value }}</span>
                        </div>
                    </v-list-item-subtitle>
                </template>
            </v-list-item>
            <v-divider v-if="dataSpecificationObject.valueList && dataSpecificationObject.valueList.length > 0" />
            <!-- ValueList -->
            <!-- TODO: DataSpecification valueList needs visual update -->
            <v-list-item-title
                v-if="dataSpecificationObject.valueList && dataSpecificationObject.valueList.length > 0"
                class="py-2 pl-2">
                <div class="text-caption">ValueList:</div>
                <span v-for="(valueList, i) in dataSpecificationObject.valueList" :key="i" class="text-primary">{{
                    valueList
                }}</span>
            </v-list-item-title>
        </v-list-item>
    </v-container>
</template>

<script lang="ts" setup>
    // Props
    defineProps({
        dataSpecificationObject: {
            type: Object as any,
            default: {} as any,
        },
        backgroundColor: {
            type: String,
            default: '',
        },
    });
</script>
