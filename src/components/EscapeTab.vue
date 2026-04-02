<template>
  <ResizableLayout>
    <template #left>
      <div
        class="panel"
        style="height:100%"
      >
        <div class="panel-header">
          <span class="panel-label">输入文本</span>
          <div class="panel-actions">
            <button
              class="btn btn-danger"
              @click="clearAll"
            >
              清空
            </button>
          </div>
        </div>
        <div class="panel-body">
          <textarea
            v-model="input"
            class="json-editor"
            placeholder="输入 JSON 字符串或已转义的内容..."
            spellcheck="false"
          />
        </div>
        <div class="status-bar">
          <span>{{ input.length }} 字符</span>
        </div>
      </div>
    </template>
    <template #right>
      <div
        class="panel"
        style="height:100%"
      >
        <div class="panel-header">
          <span class="panel-label">操作 & 结果</span>
          <div class="panel-actions">
            <label class="inline-label">
              <input
                v-model="showLineNumbers"
                type="checkbox"
                style="margin-right:4px;"
              />行号
            </label>
            <button
              class="btn btn-primary"
              @click="escape"
            >
              转义
            </button>
            <button
              class="btn btn-ghost"
              @click="unescape"
            >
              反转义
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
            v-if="!result && !input"
            class="empty-hint"
          >
            <p>输入内容后点击“转义”或“反转义”</p>
          </div>
          <div
            v-else-if="error"
            class="output-area"
          >
            <div class="error-msg">
              {{ error }}
            </div>
          </div>
          <LineNumberedOutput
            v-else
            :text="result"
            :show-line-numbers="showLineNumbers"
          />
        </div>
        <div class="status-bar">
          <span v-if="result">{{ result.length }} 字符</span>
        </div>
      </div>
    </template>
  </ResizableLayout>
</template>

<script setup>
import { ref, inject } from 'vue'
import { copyText } from '../utils.js'
import ResizableLayout from './ResizableLayout.vue'
import LineNumberedOutput from './LineNumberedOutput.vue'

const input = ref('')
const result = ref('')
const error = ref('')
const showLineNumbers = ref(false)
const flash = inject('flashCopy')

function escape() {
  error.value = ''
  try {
    result.value = JSON.stringify(input.value)
  } catch (e) {
    error.value = e.message
  }
}

function unescape() {
  error.value = ''
  try {
    const parsed = JSON.parse(input.value)
    if (typeof parsed === 'string') {
      result.value = parsed
    } else {
      result.value = JSON.stringify(parsed, null, 2)
    }
  } catch (e) {
    try {
      result.value = input.value
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    } catch {
      error.value = e.message
    }
  }
}

function clearAll() { input.value = ''; result.value = ''; error.value = '' }
function copy() { copyText(result.value, flash) }
</script>
