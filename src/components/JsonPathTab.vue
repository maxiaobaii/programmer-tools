<template>
  <div style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
    <!-- Query bar -->
    <div class="query-bar">
      <span style="font-size:12px;color:var(--text-secondary);white-space:nowrap;">JSONPath 表达式：</span>
      <input
        v-model="query"
        class="query-input"
        placeholder="例如：$.store.book[*].author 或 $..price"
        @keyup.enter="runQuery"
      />
      <button
        class="btn btn-primary"
        @click="runQuery"
      >
        查询
      </button>
      <button
        class="btn btn-ghost"
        :disabled="!result"
        @click="copyResult"
      >
        复制
      </button>
    </div>

    <!-- Split panels -->
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
              v-else-if="parseStatus.ok"
              class="status-valid"
            >✓ 合法 JSON</span>
            <span
              v-else
              class="status-invalid"
            >✗ {{ parseStatus.error }}</span>
          </div>
        </div>
      </template>
      <template #right>
        <div
          class="panel"
          style="height:100%"
        >
          <div class="panel-header">
            <span class="panel-label">查询结果</span>
            <div class="panel-actions">
              <label class="inline-label">
                <input
                  v-model="showLineNumbers"
                  type="checkbox"
                  style="margin-right:4px;"
                />行号
              </label>
            </div>
          </div>
          <div class="panel-body">
            <div
              v-if="!hasQueried"
              class="empty-hint"
            >
              <p>输入表达式后按回车或点击查询</p>
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
              :html="highlightedResult"
              :show-line-numbers="showLineNumbers"
            />
          </div>
          <div class="status-bar">
            <span
              v-if="resultCount !== null"
              style="color:var(--green)"
            >找到 {{ resultCount }} 条结果</span>
          </div>
        </div>
      </template>
    </ResizableLayout>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { tryParseJson, highlightJson, copyText } from '../utils.js'
import { JSONPath } from 'jsonpath-plus'
import ResizableLayout from './ResizableLayout.vue'
import LineNumberedOutput from './LineNumberedOutput.vue'

const input = ref('')
const query = ref('$.*')
const result = ref('')
const error = ref('')
const hasQueried = ref(false)
const resultCount = ref(null)
const showLineNumbers = ref(false)
const flash = inject('flashCopy')

const parseStatus = computed(() => tryParseJson(input.value.trim()))
const highlightedResult = computed(() => highlightJson(result.value))

function runQuery() {
  error.value = ''
  result.value = ''
  hasQueried.value = true
  resultCount.value = null

  if (!input.value.trim()) { error.value = '请先输入 JSON'; return }
  if (!parseStatus.value.ok) { error.value = '输入 JSON 格式有误：' + parseStatus.value.error; return }
  if (!query.value.trim()) { error.value = '请输入 JSONPath 表达式'; return }

  try {
    const res = JSONPath({ path: query.value, json: parseStatus.value.value })
    resultCount.value = res.length
    result.value = JSON.stringify(res, null, 2)
  } catch (e) {
    error.value = 'JSONPath 错误：' + e.message
  }
}

function clear() { input.value = ''; result.value = ''; error.value = ''; hasQueried.value = false; resultCount.value = null }
function copyResult() { copyText(result.value, flash) }

function loadSample() {
  input.value = JSON.stringify({
    store: {
      book: [
        { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
        { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
        { category: "fiction", author: "Herman Melville", title: "Moby Dick", price: 8.99 },
      ],
      bicycle: { color: "red", price: 19.95 }
    }
  }, null, 2)
  query.value = '$.store.book[*].author'
}
</script>
