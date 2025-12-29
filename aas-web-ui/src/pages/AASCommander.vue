<template>
    <v-container fluid class="pa-0">
        <div ref="panesContainerRef" class="panes-container">
            <!-- Left Pane -->
            <div
                ref="leftPaneRef"
                class="pane"
                :style="{
                    width: `calc(${leftWidth}% - 6px)`,
                    transition: isTransitioning ? 'width 0.3s ease' : 'none',
                }">
                <div class="pane-content">
                    <CommanderPane />
                </div>
            </div>

            <!-- Right Pane -->
            <div
                class="pane"
                :style="{
                    width: `calc(${rightWidth}% - 6px)`,
                    transition: isTransitioning ? 'width 0.3s ease' : 'none',
                }">
                <div class="pane-content">
                    <CommanderPane />
                </div>
            </div>

            <!-- Divider / Splitter (Absolutely positioned overlay) -->
            <div
                class="splitter"
                :class="{ 'splitter-active': isResizing, 'splitter-hover': isHovering }"
                :style="{
                    left: splitterLeft,
                    transition: isTransitioning ? 'left 0.3s ease' : 'none',
                }"
                @mousedown="startResize"
                @dblclick="resetSplit"
                @mouseenter="isHovering = true"
                @mouseleave="isHovering = false">
                <v-icon class="splitter-icon-left">mdi-pan-left</v-icon>
                <v-icon class="splitter-icon-right">mdi-pan-right</v-icon>
            </div>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

    // Refs
    const leftPaneRef = ref<HTMLElement | null>(null);
    const panesContainerRef = ref<HTMLElement | null>(null);

    // State
    const leftWidth = ref(50);
    const rightWidth = computed(() => 100 - leftWidth.value);
    const isResizing = ref(false);
    const isHovering = ref(false);
    const isTransitioning = ref(false);

    // Computed splitter position in pixels, attached to the right border of the left pane
    const splitterLeft = ref('50%');

    // Watch for changes in leftWidth and window resize
    watch(leftWidth, async () => {
        await nextTick();
        updateSplitterLeft();
    });

    onMounted(() => {
        updateSplitterLeft();
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', updateSplitterLeft);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', updateSplitterLeft);
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
    });

    // Constants
    const MIN_PANE_WIDTH = 20; // 20% minimum width
    const DEFAULT_WIDTH = 50;
    const FOCUS_LEFT_WIDTH = 70;
    const FOCUS_RIGHT_WIDTH = 30;

    // Resize state
    let startX = 0;
    let startLeftWidth = 0;

    /**
     * Start resizing when mouse is pressed on splitter
     */
    function startResize(event: MouseEvent): void {
        event.preventDefault();
        isResizing.value = true;
        isTransitioning.value = false;
        startX = event.clientX;
        startLeftWidth = leftWidth.value;

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    /**
     * Handle mouse move during resize
     */
    function handleResize(event: MouseEvent): void {
        if (!isResizing.value || !leftPaneRef.value) return;

        const containerWidth = leftPaneRef.value.parentElement?.clientWidth || 0;
        if (containerWidth === 0) return;

        const deltaX = event.clientX - startX;
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newLeftWidth = startLeftWidth + deltaPercent;

        // Apply constraints
        if (newLeftWidth >= MIN_PANE_WIDTH && newLeftWidth <= 100 - MIN_PANE_WIDTH) {
            leftWidth.value = newLeftWidth;
        }
    }

    /**
     * Stop resizing when mouse is released
     */
    function stopResize(): void {
        isResizing.value = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    /**
     * Reset split to default 50/50 (triggered by double-click)
     */
    function resetSplit(): void {
        isTransitioning.value = true;
        leftWidth.value = DEFAULT_WIDTH;
        setTimeout(() => {
            isTransitioning.value = false;
        }, 300);
    }

    /**
     * Focus left pane (70/30 split)
     */
    function focusLeft(): void {
        isTransitioning.value = true;
        leftWidth.value = FOCUS_LEFT_WIDTH;
        setTimeout(() => {
            isTransitioning.value = false;
        }, 300);
    }

    /**
     * Focus right pane (30/70 split)
     */
    function focusRight(): void {
        isTransitioning.value = true;
        leftWidth.value = FOCUS_RIGHT_WIDTH;
        setTimeout(() => {
            isTransitioning.value = false;
        }, 300);
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeyDown(event: KeyboardEvent): void {
        // Ctrl+Alt+← (focus left)
        if (event.ctrlKey && event.altKey && event.key === 'ArrowLeft') {
            event.preventDefault();
            focusLeft();
        }
        // Ctrl+Alt+→ (focus right)
        else if (event.ctrlKey && event.altKey && event.key === 'ArrowRight') {
            event.preventDefault();
            focusRight();
        }
        // Ctrl+Alt+0 (reset to center 50/50)
        else if (
            event.ctrlKey &&
            event.altKey &&
            (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === '0' || event.key === 'Numpad0')
        ) {
            event.preventDefault();
            resetSplit();
        }
    }

    function updateSplitterLeft(): void {
        if (leftPaneRef.value) {
            splitterLeft.value = leftPaneRef.value.offsetLeft + leftPaneRef.value.offsetWidth + 'px';
        }
    }
</script>

<style scoped>
    .panes-container {
        position: relative;
        display: flex;
        gap: 12px;
        width: 100%;
        height: calc(100vh - 105px);
        padding: 12px;
        box-sizing: border-box;
    }

    .pane {
        position: relative;
        overflow: hidden;
        height: 100%;
        flex-shrink: 0;
    }

    .pane-content {
        height: 100%;
        width: 100%;
    }

    .splitter {
        position: absolute;
        top: 0;
        width: 12px;
        height: 100%;
        cursor: col-resize;
        user-select: none;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition:
            opacity 0.2s ease,
            background-color 0.2s ease;
    }

    .splitter:hover,
    .splitter-hover,
    .splitter-active {
        opacity: 1;
    }

    .splitter:hover {
        background-color: rgba(var(--v-theme-primary), 0.08);
    }

    .splitter-active {
        background-color: rgba(var(--v-theme-primary), 0.12);
    }

    .splitter-icon-left,
    .splitter-icon-right {
        position: absolute;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        font-size: 18px;
    }

    .splitter-icon-left {
        top: -3px;
        left: -16.5px;
    }

    .splitter-icon-right {
        top: -3px;
        right: -16.5px;
    }

    .splitter-hover .splitter-icon-left,
    .splitter-hover .splitter-icon-right,
    .splitter-active .splitter-icon-left,
    .splitter-active .splitter-icon-right {
        opacity: 1;
    }
</style>
