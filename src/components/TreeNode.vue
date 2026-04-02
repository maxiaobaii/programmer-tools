<template>
  <!-- Recursive tree node component -->
  <div :class="depth === 0 ? 'tree-root' : 'tree-node'">
    <!-- Object or Array -->
    <template v-if="isObject || isArray">
      <div
        class="tree-row"
        @click="$emit('toggle', path)"
      >
        <span
          class="tree-toggle"
          :class="{ open: isExpanded }"
        >▶</span>
        <span
          v-if="label !== undefined"
          class="tree-key"
        >{{ label }}</span>
        <span
          v-if="label !== undefined"
          class="tree-colon"
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
          :path="path + '.' + key"
          :expanded-set="expandedSet"
          @toggle="$emit('toggle', $event)"
        />
        <div
          style="padding-left:0"
          :style="{ paddingLeft: (depth > 0 ? 16 : 0) + 'px' }"
        >
          <span style="color:var(--text-muted)">{{ isArray ? ']' : '}' }}</span>
        </div>
      </template>
    </template>

    <!-- Primitive -->
    <template v-else>
      <div
        class="tree-row"
        style="cursor:default"
      >
        <span style="width:14px;display:inline-block" />
        <span
          v-if="label !== undefined"
          class="tree-key"
        >{{ label }}</span>
        <span
          v-if="label !== undefined"
          class="tree-colon"
        >:</span>
        <span :class="valueClass">{{ displayValue }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = /** @type {{ data: any, label?: string | number, depth: number, path: string, expandedSet: Set<string> }} */ (defineProps({
  data: { type: null, required: true },
  label: { type: [String, Number], default: undefined },
  depth: { type: Number, default: 0 },
  path: { type: String, default: 'root' },
  expandedSet: { type: Set, required: true },
}))

defineEmits(['toggle'])

const isObject = computed(() => props.data !== null && typeof props.data === 'object' && !Array.isArray(props.data))
const isArray = computed(() => Array.isArray(props.data))
const isExpanded = computed(() => props.expandedSet.has(props.path))
const collectionSize = computed(() => {
  if (Array.isArray(props.data)) return `${props.data.length} 项`
  if (props.data && typeof props.data === 'object') return `${Object.keys(props.data).length} 键`
  return ''
})

const valueClass = computed(() => {
  if (props.data === null) return 'json-null'
  if (typeof props.data === 'boolean') return 'json-bool'
  if (typeof props.data === 'number') return 'json-number'
  return 'json-string'
})

const displayValue = computed(() => {
  if (props.data === null) return 'null'
  if (typeof props.data === 'string') return `"${props.data}"`
  return String(props.data)
})
</script>
