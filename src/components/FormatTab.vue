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
              class="btn btn-ghost"
              @click="importJson"
            >
              导入
            </button>
            <button
              class="btn btn-ghost"
              @click="pasteJson"
            >
              剪贴板
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
            :key="editorState.revision"
            v-model="editorState.value"
            class="json-editor"
            placeholder="在此粘贴 JSON，例如：{&quot;name&quot;:&quot;张三&quot;,&quot;age&quot;:25}"
            spellcheck="false"
          />
        </div>
        <div class="status-bar">
          <span
            v-if="!editorState.value"
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
          <span v-if="editorState.value">{{ editorState.value.length }} 字符</span>
        </div>
      </div>
    </template>
    <template #right>
      <div
        class="panel"
        style="height:100%"
      >
        <div class="panel-header">
          <span class="panel-label">格式化输出</span>
          <div class="panel-actions">
            <label class="inline-label">
              缩进
              <select
                v-model="indent"
                class="format-select"
              >
                <option :value="2">2</option>
                <option :value="4">4</option>
                <option :value="'\t'">Tab</option>
              </select>
            </label>
            <button
              class="btn btn-ghost"
              :disabled="!result"
              @click="expandAll"
            >
              全部展开
            </button>
            <button
              class="btn btn-ghost"
              :disabled="!result"
              @click="collapseAll"
            >
              全部折叠
            </button>
            <button
              class="btn btn-ghost"
              :disabled="!result"
              @click="download"
            >
              下载
            </button>
            <button
              class="btn btn-ghost"
              :disabled="!result"
              @click="copy"
            >
              复制
            </button>
          </div>
        </div>
        <div class="panel-body">
          <div
            v-if="!editorState.value"
            class="empty-hint"
          >
            <p>输入 JSON 后自动格式化</p>
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
            class="tree-view format-tree-view"
          >
            <TreeNode
              :data="status.value"
              :depth="0"
              :expanded-set="expandedSet"
              @toggle="toggleNode"
            />
          </div>
        </div>
        <div class="status-bar">
          <span v-if="result">{{ result.length }} 字符</span>
        </div>
      </div>
    </template>
  </ResizableLayout>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { tryParseJson, copyText } from '../utils.js'
import { downloadTextFile, pickTextFile, readClipboardText } from '../lib/io.js'
import { createEditorResetState, resetEditorWithValue } from '../lib/editorState.js'
import ResizableLayout from './ResizableLayout.vue'
import TreeNode from './TreeNode.vue'

const editorState = ref(createEditorResetState(''))
const indent = ref(2)
const flash = inject('flashCopy')
const expandedSet = ref(new Set(['root']))

const status = computed(() => tryParseJson(editorState.value.value.trim()))
const result = computed(() => {
  if (!editorState.value.value.trim() || !status.value.ok) return ''
  return JSON.stringify(status.value.value, null, indent.value)
})

watch(status, (next) => {
  expandedSet.value = next.ok ? createExpandedPaths(next.value) : new Set(['root'])
}, { immediate: true })

function createExpandedPaths(value) {
  const paths = new Set()

  function walk(node, path) {
    if (!node || typeof node !== 'object') return
    paths.add(path)
    Object.entries(node).forEach(([key, child]) => {
      walk(child, `${path}.${key}`)
    })
  }

  walk(value, 'root')
  return paths
}

function clear() {
  editorState.value = resetEditorWithValue(editorState.value, '')
}

function copy() {
  copyText(result.value, flash)
}

function download() {
  downloadTextFile('formatted.json', result.value)
}

function expandAll() {
  if (!status.value.ok) return
  expandedSet.value = createExpandedPaths(status.value.value)
}

function collapseAll() {
  expandedSet.value = new Set()
}

function toggleNode(path) {
  const next = new Set(expandedSet.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expandedSet.value = next
}

async function importJson() {
  try {
    editorState.value = resetEditorWithValue(editorState.value, await pickTextFile('.json,.txt'))
  } catch {
    // ignore
  }
}

async function pasteJson() {
  try {
    editorState.value = resetEditorWithValue(editorState.value, await readClipboardText())
  } catch (error) {
    if (typeof globalThis.alert === 'function') {
      globalThis.alert(error.message)
    }
  }
}

function loadSample() {
  editorState.value = resetEditorWithValue(editorState.value, JSON.stringify({
    name: '张三', age: 25, email: 'zhangsan@example.com',
    address: { city: '北京', district: '朝阳区' },
    hobbies: ['编程', '读书', '跑步'],
    active: true, score: null,
  }))
}
</script>
