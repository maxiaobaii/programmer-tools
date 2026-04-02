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
          <span v-if="input">{{ input.length }} 字符</span>
        </div>
      </div>
    </template>
    <template #right>
      <div
        class="panel"
        style="height:100%"
      >
        <div class="panel-header">
          <span class="panel-label">压缩输出</span>
          <div class="panel-actions">
            <label class="inline-label">
              <input
                v-model="showLineNumbers"
                type="checkbox"
                style="margin-right:4px;"
              />行号
            </label>
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
            v-if="!input"
            class="empty-hint"
          >
            <p>输入 JSON 后自动压缩</p>
          </div>
          <div
            v-else-if="!status.ok"
            class="output-area"
          >
            <div class="error-msg">
              {{ status.error }}
            </div>
          </div>
          <LineNumberedOutput
            v-else
            :text="result"
            :show-line-numbers="showLineNumbers"
            extra-class=""
          />
        </div>
        <div class="status-bar">
          <span v-if="result">{{ result.length }} 字符</span>
          <span
            v-if="input && result"
            style="color:var(--green)"
          >压缩率 {{ ratio }}%</span>
        </div>
      </div>
    </template>
  </ResizableLayout>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { tryParseJson, copyText } from '../utils.js'
import ResizableLayout from './ResizableLayout.vue'
import LineNumberedOutput from './LineNumberedOutput.vue'

const input = ref('')
const showLineNumbers = ref(false)
const flash = inject('flashCopy')
const status = computed(() => tryParseJson(input.value.trim()))
const result = computed(() => {
  if (!input.value.trim() || !status.value.ok) return ''
  return JSON.stringify(status.value.value)
})
const ratio = computed(() => {
  if (!input.value || !result.value) return 0
  return Math.round((1 - result.value.length / input.value.length) * 100)
})
function clear() { input.value = '' }
function copy() { copyText(result.value, flash) }
function loadSample() {
  input.value = `{\n  "name": "张三",\n  "age": 25,\n  "city": "北京"\n}`
}
</script>
