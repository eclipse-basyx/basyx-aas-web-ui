<template>
    <v-container fluid class="pa-0">
        <!-- Horizontal Flexbox for the three main components (AASTreeview, PropertyView, ComponentVisualization) -->
        <div style="display: flex">
            <!-- AASTreeview Component -->
            <div class="pa-0 window" style="width: 35%">
                <AASTreeview />
            </div>
            <!-- Divider between AASTreeview and PropertyView -->
            <div style="position: relative; height: calc(100vh - 106px); z-index: 1">
                <v-icon style="position: absolute; top: -3px; left: -16.5px">mdi-pan-left</v-icon>
                <v-divider vertical style="position: absolute; height: calc(100vh - 106px); z-index: 1"></v-divider>
                <v-icon style="position: absolute; top: -3px; right: -16.5px">mdi-pan-right</v-icon>
            </div>
            <!-- SubmodelElementView Component -->
            <div class="pa-0 window" style="width: 30%">
                <SubmodelElementView />
            </div>
            <!-- Divider between PropertyView and ComponentVisualization -->
            <div style="position: relative; height: calc(100vh - 106px); z-index: 1">
                <v-icon style="position: absolute; top: -3px; left: -16.5px">mdi-pan-left</v-icon>
                <v-divider vertical style="position: absolute; height: calc(100vh - 106px); z-index: 1"></v-divider>
                <v-icon style="position: absolute; top: -3px; right: -16.5px">mdi-pan-right</v-icon>
            </div>
            <!-- ComponentVisualization Component -->
            <div class="pa-0 window" style="width: 35%">
                <ComponentVisualization />
            </div>
        </div>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import AASTreeview from './AASTreeview.vue';
    import SubmodelElementView from './SubmodelElementView.vue';
    import ComponentVisualization from './ComponentVisualization.vue';

    export default defineComponent({
        name: 'MainWindow',
        components: {
            AASTreeview,
            SubmodelElementView,
            ComponentVisualization,
        },

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        mounted() {
            // get the HTML Elements of all Columns (Windows) in the MainWindow
            let windows = document.getElementsByClassName('window');
            // Add Resize Bars to all Dividers between Windows
            for (let i = 0; i < windows.length; i++) {
                if (i != windows.length - 1) this.resizableWindow(windows[i]);
            }
        },

        beforeUnmount() {
            // remove all Event Listeners from the Resize Bars
            let divs = document.getElementsByClassName('resizeBar');
            for (let i = 0; i < divs.length; i++) {
                divs[i].removeEventListener('mouseover', function (e: any) {});
                divs[i].removeEventListener('mouseout', function (e: any) {});
                divs[i].removeEventListener('mousedown', function (e: any) {});
                document.removeEventListener('mousemove', function (e: any) {});
                document.removeEventListener('mouseup', function (e: any) {});
            }
            // clear the current AAS and Node
            this.aasStore.dispatchSelectedAAS({});
            this.aasStore.dispatchNode({});
        },

        computed: {
            // returns the primary color of the current theme
            primaryColor() {
                return this.$vuetify.theme.themes.light.colors.primary;
            },
        },

        methods: {
            // creates a div element (Resize Bar) on each Divider between Windows to allow the user to resize the windows
            resizableWindow(window: any) {
                window.style.position = 'relative';
                let div = this.createDiv(); // create div element (Resize Bar) on each Divider between Windows
                window.appendChild(div); // append the div to the Window
                this.setListeners(div); // create event listeners for Resize Bars
            },

            // creates Event Listeners for the Resize Bars to allow the user to resize the windows
            setListeners(div: HTMLDivElement) {
                let pageX: number, curCol: any, nxtCol: any, curColWidth: number, nxtColWidth: number;

                // highlight Resize Bar when mouse is over it
                div.addEventListener('mouseover', (e: Event) => {
                    let target = e.target as HTMLElement;
                    if (target) target.style.borderRight = '2px solid ' + this.primaryColor;
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
                            curCol.style.width =
                                100 - ((screenWidth - (curColWidth + diffX)) / screenWidth) * 100 + '%'; // scale the current Column (Window)
                        if (nxtCol)
                            nxtCol.style.width =
                                100 - ((screenWidth - (nxtColWidth - diffX)) / screenWidth) * 100 + '%'; // scale the next Column (Window) if it exists
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
            },

            // creates the div element (Resize Bar) on each Divider between Windows
            createDiv() {
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
            },
        },
    });
</script>
