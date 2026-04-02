<template>
  <div
    ref="container"
    class="resizable-layout"
    :class="{ stacked: shouldStackPanels }"
    @mousemove="onMouseMove"
    @mouseup="stopDrag"
    @mouseleave="stopDrag"
  >
    <div
      class="resizable-panel"
      :class="{ 'resizable-panel-stacked': shouldStackPanels }"
      :style="leftPanelStyle"
    >
      <slot name="left" />
    </div>

    <div
      v-if="!shouldStackPanels"
      class="resizable-splitter"
      :class="{ dragging: isDragging }"
      @mousedown.prevent="startDrag"
    >
      <div class="splitter-handle" />
    </div>

    <div
      class="resizable-panel"
      :class="{ 'resizable-panel-stacked': shouldStackPanels }"
      :style="rightPanelStyle"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useViewport } from '../composables/useViewport.js'

const props = defineProps({
  defaultLeft: { type: Number, default: 50 },
})

const container = ref(null)
const leftWidth = ref(props.defaultLeft)
const isDragging = ref(false)
const { shouldStackPanels } = useViewport()

const leftPanelStyle = computed(() => {
  if (shouldStackPanels.value) {
    return { width: '100%', height: '50%' }
  }
  return { width: `${leftWidth.value}%` }
})

const rightPanelStyle = computed(() => {
  if (shouldStackPanels.value) {
    return { width: '100%', height: '50%' }
  }
  return { width: `${100 - leftWidth.value}%` }
})

function startDrag() {
  if (shouldStackPanels.value) return
  isDragging.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function stopDrag() {
  if (!isDragging.value) return
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function onMouseMove(event) {
  if (!isDragging.value || shouldStackPanels.value || !container.value) return
  const rect = container.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const pct = (x / rect.width) * 100
  leftWidth.value = Math.min(80, Math.max(20, pct))
}
</script>

<style scoped>
.resizable-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

.resizable-layout.stacked {
  flex-direction: column;
}

.resizable-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.resizable-panel-stacked {
  flex: 1;
}

.resizable-splitter {
  width: 5px;
  flex-shrink: 0;
  background: var(--border);
  cursor: col-resize;
  position: relative;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resizable-splitter:hover,
.resizable-splitter.dragging {
  background: var(--accent);
}

.splitter-handle {
  width: 3px;
  height: 32px;
  border-radius: 2px;
  background: currentColor;
  opacity: 0.4;
  pointer-events: none;
}

.resizable-splitter:hover .splitter-handle,
.resizable-splitter.dragging .splitter-handle {
  opacity: 0.8;
}
</style>
