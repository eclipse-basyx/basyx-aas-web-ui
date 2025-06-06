<template>
    <v-container fluid class="pa-0">
        <!-- Horizontal Flexbox for the two main components (SubmodelTree, Details & Visualization Tabs) -->
        <div style="display: flex">
            <!-- SubmodelTree Component -->
            <div class="pa-0 window" style="width: 35%">
                <SubmodelTree />
            </div>
            <!-- Divider between SubmodelTree and Details & Visualization Tabs -->
            <div style="position: relative; height: calc(100vh - 106px); z-index: 1">
                <v-icon style="position: absolute; top: -3px; left: -16.5px">mdi-pan-left</v-icon>
                <v-divider vertical style="position: absolute; height: calc(100vh - 106px); z-index: 1"></v-divider>
                <v-icon style="position: absolute; top: -3px; right: -16.5px">mdi-pan-right</v-icon>
            </div>
            <!-- Details & Visualization Tabs -->
            <div class="pa-0 window" style="width: 65%">


                <v-card>
                    <v-tabs v-model="activeTab" bg-color="primary" dark>
                        <v-tab value="details">Element Details</v-tab>
                        <v-tab value="visual">Visualization</v-tab>
                    </v-tabs>

                    <v-card-text>
                        <v-tabs-window v-model="activeTab">
                            <v-tabs-window-item value="details">
                                <SubmodelElementView />
                            </v-tabs-window-item>

                            <v-tabs-window-item value="visual">
                                <ComponentVisualization />
                            </v-tabs-window-item>
                        </v-tabs-window>
                    </v-card-text>
                </v-card>
            </div>
        </div>
    </v-container>
</template>

<script lang="ts" setup>

import { ref, computed, onBeforeUnmount, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useNavigationStore } from '@/store/NavigationStore';
import SubmodelTree from '@/components/SubmodelTree.vue';
import SubmodelElementView from '@/components/SubmodelElementView.vue';
import ComponentVisualization from '@/components/ComponentVisualization.vue';


    const navigationStore = useNavigationStore();
    const easyMode = computed(() => navigationStore.getEasyViewState);
    
const theme = useTheme();
const activeTab = ref<number>(0); // 0 = details, 1 = visualization


    const primaryColor = computed(() => theme.current.value.colors.primary);

    onMounted(() => {
        // get the HTML Elements of all Columns (Windows)
        let windows = document.getElementsByClassName('window');
        // Add Resize Bars to all Dividers between Windows
        for (let i = 0; i < windows.length; i++) {
            if (i != windows.length - 1) resizableWindow(windows[i]);
        }
    });

    onBeforeUnmount(() => {
        // remove all Event Listeners from the Resize Bars
        let divs = document.getElementsByClassName('resizeBar');
        for (let i = 0; i < divs.length; i++) {
            divs[i].removeEventListener('mouseover', function () {});
            divs[i].removeEventListener('mouseout', function () {});
            divs[i].removeEventListener('mousedown', function () {});
            document.removeEventListener('mousemove', function () {});
            document.removeEventListener('mouseup', function () {});
        }
    });

    // creates a div element (Resize Bar) on each Divider between Windows to allow the user to resize the windows
    function resizableWindow(window: any) {
        window.style.position = 'relative';
        let div = createDiv(); // create div element (Resize Bar) on each Divider between Windows
        window.appendChild(div); // append the div to the Window
        setListeners(div); // create event listeners for Resize Bars
    }

    // creates Event Listeners for the Resize Bars to allow the user to resize the windows
    function setListeners(div: HTMLDivElement) {
        let pageX: number, curCol: any, nxtCol: any, curColWidth: number, nxtColWidth: number;

        // highlight Resize Bar when mouse is over it
        div.addEventListener('mouseover', (e: Event) => {
            let target = e.target as HTMLElement;
            if (target) target.style.borderRight = '2px solid ' + primaryColor.value;
        });

        // remove highlight from Resize Bar when mouse leaves it
        div.addEventListener('mouseout', function (e: any) {
            if (e.target) e.target.style.borderRight = '';
        });

        // Eventlistener to select the Resize Bar on Mouse down
        div.addEventListener('mousedown', function (e: any) {
            curCol = e.target.parentElement; // the current element that will be scaled
            nxtCol = curCol.nextElementSibling; // selects the divider
            if (nxtCol) nxtCol = nxtCol.nextElementSibling; // the next element that will be scaled too
            pageX = parseInt(e.pageX); // the current x position of the mouse
            curColWidth = parseInt(curCol.offsetWidth); // the current width of the current element
            if (nxtCol) nxtColWidth = parseInt(nxtCol.offsetWidth); // the current width of the next element
        });
        // Eventlistener to scale the current and next Window when the mouse is moved
        document.addEventListener('mousemove', function (e: any) {
            if (!curCol) return; // if no element is selected return
            let screenWidth = document.documentElement.clientWidth; // the width of the screen (Window) excluding the scrollbar
            let navigationDrawer: any = document.getElementsByClassName('leftMenu')[0]; // the width of the navigation drawer
            let isDrawerOpen: boolean = navigationDrawer.style.transform == 'translateX(0px)'; // checks if the navigation drawer is open
            screenWidth = screenWidth - (isDrawerOpen ? navigationDrawer.clientWidth : 0); // if the navigation drawer is open subtract the width of the navigation drawer from the screen width
            let diffX = parseInt(e.pageX) - pageX; // amount the header was dragged (minus - left, plus - right)
            let minimalColWith = 200;
            if (curColWidth + diffX >= minimalColWith && nxtColWidth - diffX >= minimalColWith) {
                if (curCol)
                    curCol.style.width = 100 - ((screenWidth - (curColWidth + diffX)) / screenWidth) * 100 + '%'; // scale the current Column (Window)
                if (nxtCol)
                    nxtCol.style.width = 100 - ((screenWidth - (nxtColWidth - diffX)) / screenWidth) * 100 + '%'; // scale the next Column (Window) if it exists
            }
        });
        // Eventlistener to clear the local Variables mouse up
        document.addEventListener('mouseup', function () {
            curCol = null;
            nxtCol = null;
            pageX = 0;
            nxtColWidth = 0;
            curColWidth = 0;
        });
    }

    // creates the div element (Resize Bar) on each Divider between Windows
    function createDiv() {
        let div = document.createElement('div');
        div.style.top = '0';
        div.style.right = '-1px';
        div.style.width = '6px';
        div.style.position = 'absolute';
        div.style.cursor = 'col-resize';
        div.style.userSelect = 'none';
        div.style.height = 'calc(100vh - 105px)';
        div.style.zIndex = '3';
        return div;
    }
</script>
