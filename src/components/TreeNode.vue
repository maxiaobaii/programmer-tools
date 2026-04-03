<template>
  <!-- Recursive tree node component -->
  <div :class="depth === 0 ? 'tree-root' : 'tree-node'">
    <!-- Object or Array -->
    <template v-if="isObject || isArray">
      <div
        class="tree-row tree-line"
        :style="lineIndentStyle"
        @click="$emit('toggle', path)"
      >
        <span
          class="tree-toggle"
          :class="{ open: isExpanded }"
        >▶</span>
        <span
          v-if="label !== undefined"
          class="tree-key"
          style="flex-shrink:0"
        >{{ label }}</span>
        <span
          v-if="label !== undefined"
          class="tree-colon"
          style="flex-shrink:0"
        >:</span>
        <span style="color:var(--text-muted)">{{ isArray ? '[' : '{' }}</span>
        <span
          v-if="!isExpanded"
          class="tree-count"
        >
          {{ collectionSize }}
        </span>
        <span
          v-if="!isExpanded"
          style="color:var(--text-muted)"
        >{{ isArray ? ']' : '}' }}</span>
      </div>
      <template v-if="isExpanded">
        <TreeNode
          v-for="(val, key) in data"
          :key="key"
          :data="val"
          :label="key"
          :depth="depth + 1"
          :indent-size="indentSize"
          :path="path + '.' + key"
          :expanded-set="expandedSet"
          @toggle="$emit('toggle', $event)"
        />
        <div
          class="tree-line tree-closing-line"
          :style="lineIndentStyle"
        >
          <span style="color:var(--text-muted)">{{ isArray ? ']' : '}' }}</span>
        </div>
      </template>
    </template>

    <!-- Primitive -->
    <template v-else>
      <div
        class="tree-row tree-line"
        :style="lineIndentStyle"
        style="cursor:default"
      >
        <span style="width:14px;display:inline-block;flex-shrink:0" />
        <span
          v-if="label !== undefined"
          class="tree-key"
          style="flex-shrink:0"
        >{{ label }}</span>
        <span
          v-if="label !== undefined"
          class="tree-colon"
          style="flex-shrink:0"
        >:</span>
        <span
          :class="[valueClass, { 'wrapped-string-value': isWrappedString }]"
          :style="isWrappedString ? 'flex:1;min-width:0;display:block' : ''"
        >{{ displayValue }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = /** @type {{ data: any, label?: string | number, depth: number, indentSize: number, path: string, expandedSet: Set<string> }} */ (defineProps({
  data: { type: null, required: true },
  label: { type: [String, Number], default: undefined },
  depth: { type: Number, default: 0 },
  indentSize: { type: Number, default: 16 },
  path: { type: String, default: 'root' },
  expandedSet: { type: Set, required: true },
}))

defineEmits(['toggle'])

const WRAP_TRIGGER_LENGTH = 84

const isObject = computed(() => props.data !== null && typeof props.data === 'object' && !Array.isArray(props.data))
const isArray = computed(() => Array.isArray(props.data))
const isExpanded = computed(() => props.expandedSet.has(props.path))
const collectionSize = computed(() => {
  if (Array.isArray(props.data)) return `${props.data.length} 项`
  if (props.data && typeof props.data === 'object') return `${Object.keys(props.data).length} 键`
  return ''
})

const lineIndentStyle = computed(() => ({
  paddingLeft: `${props.depth * props.indentSize}px`,
}))

const valueClass = computed(() => {
  if (props.data === null) return 'json-null'
  if (typeof props.data === 'boolean') return 'json-bool'
  if (typeof props.data === 'number') return 'json-number'
  return 'json-string'
})

const displayValue = computed(() => {
  if (props.data === null) return 'null'
  if (typeof props.data === 'string') return JSON.stringify(props.data)
  return String(props.data)
})

const isWrappedString = computed(() => typeof props.data === 'string' && displayValue.value.length > WRAP_TRIGGER_LENGTH)
</script>
