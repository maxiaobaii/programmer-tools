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
          <span class="panel-label">Java 类型定义</span>
          <div class="panel-actions">
            <label class="inline-label">
              风格
              <select
                v-model="style"
                class="format-select"
              >
                <option value="pojo">标准 POJO</option>
                <option value="lombok">Lombok @Data</option>
              </select>
            </label>
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
            class="output-area ts-output java-output"
            v-html="highlightedJava"
          />
        </div>
      </div>
    </template>
  </ResizableLayout>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { copyText, highlightJava } from '../utils.js'
import { generateJavaTypes } from '../lib/java.js'
import { downloadTextFile, pickTextFile, readClipboardText } from '../lib/io.js'
import ResizableLayout from './ResizableLayout.vue'

const input = ref('')
const result = ref('')
const style = ref('pojo')
const error = ref('')
const flash = inject('flashCopy')

const status = computed(() => {
  if (!input.value.trim()) return { ok: false, error: '' }
  try {
    return { ok: true, value: JSON.parse(input.value.trim()) }
  } catch (currentError) {
    return { ok: false, error: currentError.message }
  }
})

const highlightedJava = computed(() => highlightJava(result.value))

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
    result.value = generateJavaTypes(status.value.value, { style: style.value, rootName: 'Root' })
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
  downloadTextFile('Root.java', result.value)
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
  input.value = JSON.stringify({
    id: 1,
    name: '张三',
    'user-name': 'zhangsan',
    active: true,
    score: 99.5,
    tags: ['vip', 'new'],
    profile: {
      city: '北京',
      level: 3,
    },
  }, null, 2)
}
</script>
