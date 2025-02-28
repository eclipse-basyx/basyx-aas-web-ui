<template>
    <v-container fluid class="pa-0">
        <!-- Horizontal Flexbox for the two main components (SubmodelList, SubmodelVisualization) -->
        <div style="display: flex">
            <!-- SubmodelList Component -->
            <div class="pa-0 window" style="width: 350px; min-width: 350px">
                <SubmodelList />
            </div>
            <!-- Divider between SubmodelList and SubmodelVisualization -->
            <div style="position: relative; height: calc(100vh - 106px); z-index: 1">
                <v-divider vertical style="position: absolute; height: calc(100vh - 106px); z-index: 1"></v-divider>
            </div>
            <!-- SubmodelVisualization Component -->
            <div class="pa-0 window" style="flex-grow: 1">
                <ComponentVisualization />
            </div>
        </div>
    </v-container>
</template>
