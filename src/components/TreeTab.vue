<template>
  <ResizableLayout>
    <template #left>
      <div
        class="panel"
        style="height:100%"
      >
        <div class="panel-header">
          <span class="panel-label">输入 JSON</span>
          <div class="panel-actions">
            <button
              class="btn btn-ghost"
              @click="loadSample"
            >
              示例
            </button>
            <button
              class="btn btn-danger"
              @click="clear"
            >
              清空
            </button>
          </div>
        </div>
        <div class="panel-body">
          <textarea
            v-model="input"
            class="json-editor"
            placeholder="在此粘贴 JSON..."
            spellcheck="false"
          />
        </div>
        <div class="status-bar">
          <span
            v-if="!input"
            class="status-empty"
          >等待输入...</span>
          <span
            v-else-if="status.ok"
            class="status-valid"
          >✓ 合法 JSON</span>
          <span
            v-else
            class="status-invalid"
          >✗ {{ status.error }}</span>
        </div>
      </div>
    </template>
    <template #right>
      <div
        class="panel"
        style="height:100%"
      >
        <div class="panel-header">
          <span class="panel-label">树状视图</span>
          <div class="panel-actions">
            <button
              class="btn btn-ghost"
              @click="expandAll"
            >
              全部展开
            </button>
            <button
              class="btn btn-ghost"
              @click="collapseAll"
            >
              全部折叠
            </button>
          </div>
        </div>
        <div class="panel-body">
          <div
            v-if="!input"
            class="empty-hint"
          >
            <p>输入 JSON 以查看树结构</p>
          </div>
          <div
            v-else-if="!status.ok"
            class="output-area"
          >
            <div class="error-msg">
              {{ status.error }}
            </div>
          </div>
          <div
            v-else
            class="tree-view"
          >
            <TreeNode
              :data="status.value"
              :depth="0"
              :expanded-set="expandedSet"
              @toggle="toggleNode"
            />
          </div>
        </div>
      </div>
    </template>
  </ResizableLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { tryParseJson } from '../utils.js'
import TreeNode from './TreeNode.vue'
import ResizableLayout from './ResizableLayout.vue'

const input = ref('')
const expandedSet = ref(new Set(['root']))
const status = computed(() => tryParseJson(input.value.trim()))

function clear() { input.value = '' }
function loadSample() {
  input.value = JSON.stringify({
    name: "张三", age: 25,
    address: { city: "北京", district: "朝阳区", zip: "100020" },
    hobbies: ["编程", "读书", "跑步"],
    active: true, score: null,
    meta: { created: "2024-01-01", tags: ["vip", "new"] }
  })
}

function expandAll() {
  const s = new Set()
  function walk(obj, path) {
    s.add(path)
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(k => walk(obj[k], path + '.' + k))
    }
  }
  if (status.value.ok) walk(status.value.value, 'root')
  expandedSet.value = s
}

function collapseAll() { expandedSet.value = new Set() }

function toggleNode(path) {
  const s = new Set(expandedSet.value)
  if (s.has(path)) s.delete(path)
  else s.add(path)
  expandedSet.value = s
}
</script>
