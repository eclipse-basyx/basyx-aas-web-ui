<template>
  <v-container class="pa-0" fluid>
    <!-- Horizontal Flexbox for the three main components (SubmodelTree, PropertyView, ComponentVisualization) -->
    <div style="display: flex">
      <!-- SubmodelTree Component -->
      <div class="pa-0 window" style="width: 35%">
        <SubmodelTree />
      </div>
      <!-- Divider -->
      <div style="position: relative; height: calc(100vh - 106px); z-index: 1">
        <v-icon style="position: absolute; top: -3px; left: -16.5px">mdi-pan-left</v-icon>
        <v-divider style="position: absolute; height: calc(100vh - 106px); z-index: 1" vertical />
        <v-icon style="position: absolute; top: -3px; right: -16.5px">mdi-pan-right</v-icon>
      </div>
      <!-- SM/SME view and visualization Component -->
      <div class="pa-0 window" style="width: 65%">
        <SubmodelElementViewAndVisualization />
      </div>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted } from 'vue'
  import { useTheme } from 'vuetify'

  const theme = useTheme()
  const resizeBarCleanups: Array<() => void> = []

  // Computed Properties
  const primaryColor = computed(() => theme.current.value.colors.primary)

  onMounted(() => {
    // get the HTML Elements of all Columns (Windows)
    const windows = document.querySelectorAll('.window')
    // Add Resize Bars to all Dividers between Windows
    for (let i = 0; i < windows.length; i++) {
      if (i != windows.length - 1) resizableWindow(windows[i])
    }
  })

  onBeforeUnmount(() => {
    // remove all event listeners registered for resize behavior
    for (const cleanup of resizeBarCleanups) cleanup()
    resizeBarCleanups.length = 0
  })

  // creates a div element (Resize Bar) on each Divider between Windows to allow the user to resize the windows
  function resizableWindow (window: any): void {
    window.style.position = 'relative'
    const div = createDiv() // create div element (Resize Bar) on each Divider between Windows
    window.append(div) // append the div to the Window
    setListeners(div) // create event listeners for Resize Bars
  }

  // creates Event Listeners for the Resize Bars to allow the user to resize the windows
  function setListeners (div: HTMLDivElement): void {
    let pageX: number, curCol: any, nxtCol: any, curColWidth: number, nxtColWidth: number

    // highlight Resize Bar when mouse is over it
    const onMouseOver = (e: Event) => {
      const target = e.target as HTMLElement
      if (target) target.style.borderRight = '2px solid ' + primaryColor.value
    }

    // remove highlight from Resize Bar when mouse leaves it
    const onMouseOut = function (e: any) {
      if (e.target) e.target.style.borderRight = ''
    }

    // Eventlistener to select the Resize Bar on Mouse down
    const onMouseDown = function (e: any) {
      curCol = e.target.parentElement // the current element that will be scaled
      nxtCol = curCol.nextElementSibling // selects the divider
      if (nxtCol) nxtCol = nxtCol.nextElementSibling // the next element that will be scaled too
      pageX = Number.parseInt(e.pageX) // the current x position of the mouse
      curColWidth = Number.parseInt(curCol.offsetWidth) // the current width of the current element
      if (nxtCol) nxtColWidth = Number.parseInt(nxtCol.offsetWidth) // the current width of the next element
    }
    // Eventlistener to scale the current and next Window when the mouse is moved
    const onMouseMove = function (e: any) {
      if (!curCol) return // if no element is selected return
      let screenWidth = document.documentElement.clientWidth // the width of the screen (Window) excluding the scrollbar
      const navigationDrawer: any = document.querySelectorAll('.leftMenu')[0] // the width of the navigation drawer
      const isDrawerOpen: boolean = navigationDrawer.style.transform == 'translateX(0px)' // checks if the navigation drawer is open
      screenWidth = screenWidth - (isDrawerOpen ? navigationDrawer.clientWidth : 0) // if the navigation drawer is open subtract the width of the navigation drawer from the screen width
      const diffX = Number.parseInt(e.pageX) - pageX // amount the header was dragged (minus - left, plus - right)
      const minimalColWith = 200
      if (curColWidth + diffX >= minimalColWith && nxtColWidth - diffX >= minimalColWith) {
        if (curCol)
          curCol.style.width = 100 - ((screenWidth - (curColWidth + diffX)) / screenWidth) * 100 + '%' // scale the current Column (Window)
        if (nxtCol)
          nxtCol.style.width = 100 - ((screenWidth - (nxtColWidth - diffX)) / screenWidth) * 100 + '%' // scale the next Column (Window) if it exists
      }
    }
    // Eventlistener to clear the local Variables mouse up
    const onMouseUp = function () {
      curCol = null
      nxtCol = null
      pageX = 0
      nxtColWidth = 0
      curColWidth = 0
    }

    div.addEventListener('mouseover', onMouseOver)
    div.addEventListener('mouseout', onMouseOut)
    div.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    resizeBarCleanups.push(() => {
      div.removeEventListener('mouseover', onMouseOver)
      div.removeEventListener('mouseout', onMouseOut)
      div.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    })
  }

  // creates the div element (Resize Bar) on each Divider between Windows
  function createDiv (): HTMLDivElement {
    const div = document.createElement('div')
    div.style.top = '0'
    div.style.right = '-1px'
    div.style.width = '6px'
    div.style.position = 'absolute'
    div.style.cursor = 'col-resize'
    div.style.userSelect = 'none'
    div.style.height = 'calc(100vh - 105px)'
    div.style.zIndex = '3'
    return div
  }

</script>

<script lang="ts">
  // Page shortcuts - available when this page is active
  export function shortcuts ({
    navigationStore,
  }: {
    navigationStore: { dispatchTriggerAASListReload: () => void }
  }) {
    return [
      {
        id: 'aas-viewer-refresh',
        title: 'Refresh AAS List',
        description: 'Reload the AAS list',
        prependIcon: 'mdi-refresh',
        category: 'AAS Viewer Shortcuts',
        keys: 'cmd+shift+r',
        handler: (event: KeyboardEvent) => {
          event.preventDefault()
          event.stopPropagation()
          navigationStore.dispatchTriggerAASListReload()
        },
      },
    ]
  }
</script>
