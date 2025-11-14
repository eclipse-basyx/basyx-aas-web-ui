<template>
    <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-btn icon="mdi-filter" v-bind="Object.assign({}, props, tooltipProps)" variant="plain"></v-btn>
        </template>
        <v-card>
            <v-list>
                <v-list-item>
                    <v-checkbox v-model="filter" label="Filter"></v-checkbox>
                    <v-checkbox v-model="filter2" label="Filter 2"></v-checkbox>
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>
</template>
