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
          <span class="panel-label">TypeScript 类型定义</span>
          <div class="panel-actions">
            <button
              class="btn btn-primary"
              @click="generate"
            >
              生成
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
            v-if="!result && !error"
            class="empty-hint"
          >
            <p>输入 JSON 后点击“生成”</p>
          </div>
          <div
            v-else-if="error"
            class="output-area"
          >
            <div class="error-msg">
              {{ error }}
            </div>
          </div>
          <div
            v-else
            class="output-area ts-output"
            v-html="highlightedTs"
          />
        </div>
      </div>
    </template>
  </ResizableLayout>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { copyText } from '../utils.js'
import { generateTypescript } from '../lib/types.js'
import { downloadTextFile, pickTextFile, readClipboardText } from '../lib/io.js'
import ResizableLayout from './ResizableLayout.vue'
import LineNumberedOutput from './LineNumberedOutput.vue'

const input = ref('')
const result = ref('')
const error = ref('')
const showLineNumbers = ref(false)
const flash = inject('flashCopy')

const status = computed(() => {
  if (!input.value.trim()) return { ok: false, error: '' }
  try {
    return { ok: true, value: JSON.parse(input.value.trim()) }
  } catch (currentError) {
    return { ok: false, error: currentError.message }
  }
})

const highlightedTs = computed(() => {
  return result.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\b(export|interface|type|string|number|boolean|null|unknown)\b/g, '<span class="ts-keyword">$1</span>')
    .replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span class="ts-type">$1</span>')
    .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="ts-string">$1</span>')
})

function generate() {
  error.value = ''
  result.value = ''
  if (!input.value.trim()) {
    error.value = '请先输入 JSON'
    return
  }
  if (!status.value.ok) {
    error.value = '输入 JSON 格式有误：' + status.value.error
    return
  }

  try {
    result.value = generateTypescript(status.value.value)
  } catch (currentError) {
    error.value = '生成失败：' + currentError.message
  }
}

function clear() {
  input.value = ''
  result.value = ''
  error.value = ''
}

function copy() {
  copyText(result.value, flash)
}

function download() {
  downloadTextFile('types.generated.ts', result.value)
}

async function importJson() {
  try {
    input.value = await pickTextFile('.json,.txt')
    error.value = ''
  } catch (currentError) {
    error.value = currentError.message
  }
}

async function pasteJson() {
  try {
    input.value = await readClipboardText()
    error.value = ''
  } catch (currentError) {
    error.value = currentError.message
  }
}

function loadSample() {
  input.value = JSON.stringify([
    { id: 1, name: '张三', 'user-name': 'zhangsan', score: null },
    { id: 2, name: null, active: true },
  ], null, 2)
}
</script>
