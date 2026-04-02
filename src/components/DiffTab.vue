<template>
  <div style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
    <div class="convert-controls">
      <button
        class="btn btn-primary"
        @click="runDiff"
      >
        对比
      </button>
      <button
        class="btn btn-ghost"
        @click="importLeft"
      >
        导入 A
      </button>
      <button
        class="btn btn-ghost"
        @click="importRight"
      >
        导入 B
      </button>
      <button
        class="btn btn-ghost"
        :disabled="!diffText"
        @click="download"
      >
        下载
      </button>
      <button
        class="btn btn-ghost"
        :disabled="!diffText"
        @click="copy"
      >
        复制
      </button>
      <button
        class="btn btn-danger"
        @click="clear"
      >
        清空
      </button>
      <span
        v-if="summary"
        class="diff-summary"
      >{{ summary }}</span>
    </div>

    <div
      class="diff-layout"
      style="flex:1;overflow:hidden;"
    >
      <div class="diff-side">
        <div class="panel-header">
          <span class="panel-label">JSON A（原始）</span>
          <div class="panel-actions">
            <button
              class="btn btn-ghost"
              @click="loadSampleA"
            >
              示例
            </button>
          </div>
        </div>
        <textarea
          v-model="inputA"
          class="diff-editor"
          placeholder="粘贴原始 JSON..."
          spellcheck="false"
        />
      </div>

      <div class="diff-side">
        <div class="panel-header">
          <span class="panel-label">JSON B（修改后）</span>
          <div class="panel-actions">
            <button
              class="btn btn-ghost"
              @click="loadSampleB"
            >
              示例
            </button>
          </div>
        </div>
        <textarea
          v-model="inputB"
          class="diff-editor"
          placeholder="粘贴修改后的 JSON..."
          spellcheck="false"
        />
      </div>
    </div>

    <div class="diff-result-panel">
      <div class="panel-header">
        <span class="panel-label">差异结果</span>
      </div>
      <div class="diff-result-area">
        <div
          v-if="!hasRun"
          class="diff-placeholder"
        >
          点击“对比”查看语义差异
        </div>
        <div
          v-else-if="error"
          class="error-msg"
        >
          {{ error }}
        </div>
        <div
          v-else-if="!diffItems.length"
          class="diff-empty"
        >
          ✓ 两个 JSON 内容完全相同（语义等价）
        </div>
        <div
          v-else
          class="diff-list diff-list-compact"
        >
          <div
            v-for="item in diffItems"
            :key="`${item.type}-${item.path}`"
            class="diff-card diff-card-compact"
          >
            <div class="diff-card-head diff-card-head-compact">
              <span
                class="badge"
                :class="badgeClass(item.type)"
              >{{ badgeLabel(item.type) }}</span>
              <code class="diff-path">{{ item.path }}</code>
            </div>
            <div class="diff-card-body diff-card-body-compact">
              <div
                v-if="item.type !== 'added'"
                class="diff-chip diff-chip-before"
              >
                <span class="diff-chip-label">旧</span>
                <code>{{ formatDiffValue(item.before) }}</code>
              </div>
              <div
                v-if="item.type !== 'removed'"
                class="diff-chip diff-chip-after"
              >
                <span class="diff-chip-label">新</span>
                <code>{{ formatDiffValue(item.after) }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref } from 'vue'
import { tryParseJson, copyText } from '../utils.js'
import { diffJsonValues, formatDiffValue, summarizeDiff } from '../lib/diff.js'
import { downloadTextFile, pickTextFile } from '../lib/io.js'

const inputA = ref('')
const inputB = ref('')
const diffItems = ref([])
const diffText = ref('')
const error = ref('')
const hasRun = ref(false)
const summary = ref('')
const flash = inject('flashCopy')

function buildDiffText(items) {
  return items.map((item) => {
    const lines = [`[${item.type}] ${item.path}`]
    if (item.type !== 'added') lines.push(`- before: ${formatDiffValue(item.before)}`)
    if (item.type !== 'removed') lines.push(`+ after: ${formatDiffValue(item.after)}`)
    return lines.join('\n')
  }).join('\n\n')
}

function runDiff() {
  error.value = ''
  diffItems.value = []
  diffText.value = ''
  summary.value = ''
  hasRun.value = true

  if (!inputA.value.trim() || !inputB.value.trim()) {
    error.value = '请在两侧都输入 JSON'
    return
  }

  const left = tryParseJson(inputA.value.trim())
  const right = tryParseJson(inputB.value.trim())

  if (!left.ok) {
    error.value = 'JSON A 格式错误：' + left.error
    return
  }
  if (!right.ok) {
    error.value = 'JSON B 格式错误：' + right.error
    return
  }

  const items = diffJsonValues(left.value, right.value)
  diffItems.value = items
  summary.value = summarizeDiff(items)
  diffText.value = buildDiffText(items)
}

function clear() {
  inputA.value = ''
  inputB.value = ''
  diffItems.value = []
  diffText.value = ''
  error.value = ''
  hasRun.value = false
  summary.value = ''
}

function copy() {
  copyText(diffText.value, flash)
}

function download() {
  downloadTextFile('diff-summary.txt', diffText.value)
}

async function importLeft() {
  try {
    inputA.value = await pickTextFile('.json,.txt')
    error.value = ''
  } catch (currentError) {
    error.value = currentError.message
  }
}

async function importRight() {
  try {
    inputB.value = await pickTextFile('.json,.txt')
    error.value = ''
  } catch (currentError) {
    error.value = currentError.message
  }
}

function badgeLabel(type) {
  return {
    added: '新增',
    removed: '删除',
    changed: '修改',
    type_changed: '类型变化',
  }[type] || type
}

function badgeClass(type) {
  return {
    added: 'badge-success',
    removed: 'badge-error',
    changed: 'badge-warning',
    type_changed: 'badge-info',
  }[type] || 'badge-info'
}

function loadSampleA() {
  inputA.value = JSON.stringify({
    name: '张三',
    age: 25,
    city: '北京',
    profile: { vip: true },
  }, null, 2)
}

function loadSampleB() {
  inputB.value = JSON.stringify({
    name: '张三',
    age: 26,
    city: '上海',
    email: 'zhangsan@example.com',
    profile: { vip: 'yes' },
  }, null, 2)
}
</script>
