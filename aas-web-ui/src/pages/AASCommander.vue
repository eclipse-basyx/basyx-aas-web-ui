<template>
    <v-container fluid class="pa-0">
        <div ref="panesContainerRef" class="panes-container">
            <!-- Left Pane -->
            <div
                class="pane"
                :style="{
                    width: `calc(${leftWidth}% - 6px)`,
                    transition: isTransitioning ? 'width 0.3s ease' : 'none',
                }">
                <div class="pane-content">
                    <CommanderPane side="left" />
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
                    <CommanderPane side="right" />
                </div>
            </div>

            <!-- Divider / Splitter -->
            <div
                ref="splitterRef"
                class="splitter"
                :class="{ 'splitter-active': isResizing, 'splitter-hover': isHovering }"
                :style="{
                    left: splitterLeft,
                    transition: isTransitioning ? 'left 0.3s ease' : 'none',
                }"
                role="separator"
                aria-orientation="vertical"
                :aria-valuenow="Math.round(leftWidth)"
                :aria-valuemin="MIN_PANE_WIDTH"
                :aria-valuemax="100 - MIN_PANE_WIDTH"
                tabindex="0"
                @pointerdown="startResize"
                @pointerup="stopResize"
                @pointercancel="stopResize"
                @lostpointercapture="stopResize"
                @dblclick="resetSplit"
                @mouseenter="isHovering = true"
                @mouseleave="isHovering = false"
                @keydown="onSplitterKeyDown">
                <v-icon class="splitter-icon-left">mdi-pan-left</v-icon>
                <v-icon class="splitter-icon-right">mdi-pan-right</v-icon>
            </div>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import { useShortcutManager } from '@/composables/useShortcutManager';

    const shortcuts = useShortcutManager();

    // Refs
    const panesContainerRef = ref<HTMLElement | null>(null);
    const splitterRef = ref<HTMLElement | null>(null);

    // State
    const leftWidth = ref(50);
    const rightWidth = computed(() => 100 - leftWidth.value);
    const isResizing = ref(false);
    const isHovering = ref(false);
    const isTransitioning = ref(false);

    // Splitter position in px
    const splitterLeft = ref('50%');

    // Constants
    const MIN_PANE_WIDTH = 20; // in percent
    const DEFAULT_WIDTH = 50;
    const FOCUS_LEFT_WIDTH = 70;
    const FOCUS_RIGHT_WIDTH = 30;

    // Keep in sync with CSS
    const PADDING_PX = 12;

    // Must match pane width calc(... - 6px)
    const HALF_GAP_COMP_PX = 6;

    // Resize state
    let startX = 0;
    let startLeftWidth = 0;
    let activePointerId: number | null = null;

    // rAF throttle
    let rafId: number | null = null;

    // Resize observer
    let resizeObserver: ResizeObserver | null = null;

    // Unregister function for commander scoped shortcuts
    let unregisterCommanderShortcuts: (() => void) | null = null;

    onMounted(() => {
        updateSplitterLeftFromModel();

        // Keep resizing responsive even if pointer leaves splitter/container
        window.addEventListener('pointermove', handleResize);
        window.addEventListener('pointerup', stopResize);
        window.addEventListener('pointercancel', stopResize);

        // If window loses focus mid-drag, stop resizing
        window.addEventListener('blur', () => stopResize());

        if (panesContainerRef.value) {
            resizeObserver = new ResizeObserver(() => scheduleSplitterUpdate());
            resizeObserver.observe(panesContainerRef.value);
        }

        // register commander shortcuts and set scope
        unregisterCommanderShortcuts = shortcuts.register(
            'commander',
            commanderShortcuts /*, { allowInInputs: false } */
        );
        shortcuts.setScope('commander');
    });

    onBeforeUnmount(() => {
        window.removeEventListener('pointermove', handleResize);
        window.removeEventListener('pointerup', stopResize);
        window.removeEventListener('pointercancel', stopResize);

        resizeObserver?.disconnect();
        resizeObserver = null;

        if (rafId !== null) cancelAnimationFrame(rafId);

        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        unregisterCommanderShortcuts?.();
        unregisterCommanderShortcuts = null;

        shortcuts.setScope('global');
    });

    function clampLeftWidth(v: number): number {
        return Math.min(100 - MIN_PANE_WIDTH, Math.max(MIN_PANE_WIDTH, v));
    }

    function scheduleSplitterUpdate(): void {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            updateSplitterLeftFromModel();
        });
    }

    /**
     * Position splitter at the right edge of the left pane,
     * but computed from model to avoid layout lag.
     *
     * IMPORTANT: panes use width: calc(X% - 6px). MUST include the -6px,
     * otherwise the splitter appears too far to the right.
     */
    function updateSplitterLeftFromModel(): void {
        const container = panesContainerRef.value;
        if (!container) return;

        const containerWidth = container.clientWidth; // includes padding
        const innerWidth = containerWidth - 2 * PADDING_PX; // content box excluding padding
        if (innerWidth <= 0) return;

        // Percent part
        const leftPercentPx = (leftWidth.value / 100) * innerWidth;

        // Apply the same "- 6px" used in CSS for the left pane width
        const leftPanePx = leftPercentPx - HALF_GAP_COMP_PX;

        // Splitter at right edge of left pane:
        const leftEdge = PADDING_PX + leftPanePx;

        splitterLeft.value = `${leftEdge}px`;
    }

    function withTransition(fn: () => void): void {
        isTransitioning.value = true;
        fn();
        scheduleSplitterUpdate();

        window.setTimeout(() => {
            isTransitioning.value = false;
            scheduleSplitterUpdate();
        }, 300);
    }

    /**
     * Pointer-based resizing
     */
    function startResize(event: PointerEvent): void {
        event.preventDefault();

        isResizing.value = true;
        isTransitioning.value = false;

        activePointerId = event.pointerId;
        startX = event.clientX;
        startLeftWidth = leftWidth.value;

        splitterRef.value?.setPointerCapture(event.pointerId);

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    function handleResize(event: PointerEvent): void {
        if (!isResizing.value) return;
        if (activePointerId !== null && event.pointerId !== activePointerId) return;

        const container = panesContainerRef.value;
        if (!container) return;

        const innerWidth = container.clientWidth - 2 * PADDING_PX;
        if (innerWidth <= 0) return;

        const deltaX = event.clientX - startX;
        const deltaPercent = (deltaX / innerWidth) * 100;

        leftWidth.value = clampLeftWidth(startLeftWidth + deltaPercent);
        scheduleSplitterUpdate();
    }

    function stopResize(event?: PointerEvent): void {
        if (!isResizing.value) return;

        // Ignore events that don't match the active pointer
        if (event && activePointerId !== null && event.pointerId !== activePointerId) return;

        isResizing.value = false;

        // Release capture if possible
        if (activePointerId !== null) {
            try {
                splitterRef.value?.releasePointerCapture(activePointerId);
            } catch {
                // Ignore
            }
        }

        activePointerId = null;

        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        scheduleSplitterUpdate();
    }

    function resetSplit(): void {
        withTransition(() => {
            leftWidth.value = DEFAULT_WIDTH;
        });
    }

    function focusLeft(): void {
        withTransition(() => {
            leftWidth.value = FOCUS_LEFT_WIDTH;
        });
    }

    function focusRight(): void {
        withTransition(() => {
            leftWidth.value = FOCUS_RIGHT_WIDTH;
        });
    }

    /**
     * Commander keyboard shortcuts
     */
    function commanderShortcuts(event: KeyboardEvent): boolean {
        // your existing logic
        if (!(event.ctrlKey && event.altKey)) return false;

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            focusLeft();
            return true;
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            focusRight();
            return true;
        } else if (['ArrowUp', 'ArrowDown', '0', 'Numpad0'].includes(event.key)) {
            event.preventDefault();
            resetSplit();
            return true;
        }
        return false;
    }

    /**
     * Splitter keyboard (accessibility)
     */
    function onSplitterKeyDown(event: KeyboardEvent): void {
        const step = event.shiftKey ? 10 : 2;

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            withTransition(() => {
                leftWidth.value = clampLeftWidth(leftWidth.value - step);
            });
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            withTransition(() => {
                leftWidth.value = clampLeftWidth(leftWidth.value + step);
            });
        } else if (event.key === 'Home') {
            event.preventDefault();
            resetSplit();
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
        outline: none;
        transition:
            opacity 0.2s ease,
            background-color 0.2s ease;
    }

    .splitter:focus-visible {
        opacity: 1;
        box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.35);
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
