<template>
  <div class="sql-workbench">
    <div class="sql-shell">
      <header class="sql-topbar">
        <RouterLink
          to="/"
          class="tool-page-back"
        >返回首页</RouterLink>

        <div class="sql-mode-row">
          <span class="sql-mode-label">方言</span>
          <div
            class="sql-mode-switch"
            role="tablist"
            aria-label="SQL 方言切换"
          >
            <button
              class="sql-mode-btn"
              :class="{ active: dialect === 'mysql' }"
              @click="dialect = 'mysql'"
            >MySQL</button>
            <button
              class="sql-mode-btn"
              :class="{ active: dialect === 'postgresql' }"
              @click="dialect = 'postgresql'"
            >PostgreSQL</button>
            <button
              class="sql-mode-btn"
              :class="{ active: dialect === 'oracle' }"
              @click="dialect = 'oracle'"
            >Oracle</button>
          </div>
        </div>
      </header>

      <div class="sql-card">
        <div class="sql-tabs">
          <button
            class="sql-tab"
            :class="{ active: activeTab === 'format' }"
            @click="activeTab = 'format'"
          >美化</button>
          <button
            class="sql-tab"
            :class="{ active: activeTab === 'compress' }"
            @click="activeTab = 'compress'"
          >压缩</button>
        </div>

        <section
          v-if="activeTab === 'format'"
          class="sql-panel"
        >
          <div class="sql-form-grid">
            <label class="sql-field-label">输入 SQL</label>
            <div class="sql-field-content">
              <textarea
                v-model="formatInput"
                class="sql-textarea"
                rows="8"
                placeholder="输入需要美化的 SQL 语句，如: SELECT * FROM users WHERE id > 10 ORDER BY name"
              />
            </div>

            <label class="sql-field-label">选项</label>
            <div class="sql-field-content sql-options-grid">
              <label class="sql-field-sublabel">
                缩进
                <select
                  v-model="indentSize"
                  class="sql-select"
                >
                  <option :value="2">2 空格</option>
                  <option :value="4">4 空格</option>
                  <option :value="1">Tab (1)</option>
                </select>
              </label>
              <label class="sql-checkbox-item">
                <input v-model="uppercaseKeywords" type="checkbox">
                关键字大写
              </label>
              <label class="sql-checkbox-item">
                <input v-model="autoCopy" type="checkbox">
                格式化后自动复制
              </label>
            </div>

            <label class="sql-field-label">操作</label>
            <div class="sql-field-content sql-action-row">
              <button
                class="btn btn-primary"
                @click="doFormat"
              >
                美化
              </button>
              <button
                class="btn btn-ghost"
                @click="clearFormat"
              >
                清空
              </button>
              <button
                class="btn btn-ghost"
                @click="pasteToFormat"
              >
                从剪贴板粘贴
              </button>
              <button
                class="btn btn-ghost"
                @click="loadExample"
              >
                加载示例
              </button>
            </div>
          </div>

          <p
            v-if="formatError"
            class="sql-error"
          >
            {{ formatError }}
          </p>

          <div
            v-if="formatResult !== null"
            class="sql-result-card"
          >
            <div class="sql-result-header">
              <span class="sql-result-title">格式化结果</span>
              <div class="sql-result-actions">
                <button
                  class="btn btn-ghost"
                  @click="copyResult(formatResult)"
                >
                  复制
                </button>
                <button
                  class="btn btn-ghost"
                  @click="downloadResult('formatted.sql', formatResult)"
                >
                  下载
                </button>
                <button
                  class="btn btn-ghost"
                  @click="sendToCompress(formatResult)"
                >
                  发送到压缩
                </button>
              </div>
            </div>
            <textarea
              class="sql-textarea sql-result-output"
              readonly
              :value="formatResult"
              rows="8"
            />
            <div
              v-if="formatStats"
              class="sql-stats"
            >
              <span>输入: {{ formatStats.inputBytes }} 字节 / {{ formatStats.inputLines }} 行</span>
              <span>输出: {{ formatStats.outputBytes }} 字节 / {{ formatStats.outputLines }} 行</span>
            </div>
          </div>
        </section>

        <section
          v-else-if="activeTab === 'compress'"
          class="sql-panel"
        >
          <div class="sql-form-grid">
            <label class="sql-field-label">输入 SQL</label>
            <div class="sql-field-content">
              <textarea
                v-model="compressInput"
                class="sql-textarea"
                rows="8"
                placeholder="输入需要压缩的 SQL 语句（支持多行格式）"
              />
            </div>

            <label class="sql-field-label">选项</label>
            <div class="sql-field-content sql-options-grid">
              <label class="sql-checkbox-item">
                <input v-model="uppercaseKeywords" type="checkbox">
                关键字大写
              </label>
              <label class="sql-checkbox-item">
                <input v-model="autoCopy" type="checkbox">
                压缩后自动复制
              </label>
            </div>

            <label class="sql-field-label">操作</label>
            <div class="sql-field-content sql-action-row">
              <button
                class="btn btn-primary"
                @click="doCompress"
              >
                压缩
              </button>
              <button
                class="btn btn-ghost"
                @click="clearCompress"
              >
                清空
              </button>
              <button
                class="btn btn-ghost"
                @click="pasteToCompress"
              >
                从剪贴板粘贴
              </button>
            </div>
          </div>

          <p
            v-if="compressError"
            class="sql-error"
          >
            {{ compressError }}
          </p>

          <div
            v-if="compressResult !== null"
            class="sql-result-card"
          >
            <div class="sql-result-header">
              <span class="sql-result-title">压缩结果</span>
              <div class="sql-result-actions">
                <button
                  class="btn btn-ghost"
                  @click="copyResult(compressResult)"
                >
                  复制
                </button>
                <button
                  class="btn btn-ghost"
                  @click="downloadResult('compressed.sql', compressResult)"
                >
                  下载
                </button>
                <button
                  class="btn btn-ghost"
                  @click="sendToFormat(compressResult)"
                >
                  发送到美化
                </button>
              </div>
            </div>
            <textarea
              class="sql-textarea sql-result-output"
              readonly
              :value="compressResult"
              rows="4"
            />
            <div
              v-if="compressStats"
              class="sql-stats"
            >
              <span>输入: {{ compressStats.inputBytes }} 字节 / {{ compressStats.inputLines }} 行</span>
              <span>输出: {{ compressStats.outputBytes }} 字节 / {{ compressStats.outputLines }} 行</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { copyText } from '../utils.js'
import { readClipboardText, downloadTextFile } from '../lib/io.js'
import { formatSql, compressSql, computeStats } from '../lib/sql.js'

const flashCopy = inject('flashCopy', null)

const activeTab = ref('format')
const dialect = ref('mysql')
const indentSize = ref(2)
const uppercaseKeywords = ref(true)
const autoCopy = ref(true)

const formatInput = ref('')
const formatResult = ref(null)
const formatError = ref('')
const formatStats = ref(null)

const compressInput = ref('')
const compressResult = ref(null)
const compressError = ref('')
const compressStats = ref(null)

const exampleSql = `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND u.created_at >= '2024-01-01' AND o.total > 100 GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY total_spent DESC LIMIT 20`

function doFormat () {
  formatError.value = ''
  formatResult.value = null
  formatStats.value = null

  const input = formatInput.value
  if (!input.trim()) {
    formatError.value = '请输入需要美化的 SQL 语句'
    return
  }

  const result = formatSql(input, {
    dialect: dialect.value,
    indentSize: indentSize.value,
    uppercaseKeywords: uppercaseKeywords.value,
  })

  if (!result.ok) {
    formatError.value = '格式化失败: ' + (result.error || '未知错误')
    return
  }

  formatResult.value = result.value
  formatStats.value = computeStats(input, result.value)

  if (autoCopy.value) {
    copyResult(result.value)
  }
}

function doCompress () {
  compressError.value = ''
  compressResult.value = null
  compressStats.value = null

  const input = compressInput.value
  if (!input.trim()) {
    compressError.value = '请输入需要压缩的 SQL 语句'
    return
  }

  const result = compressSql(input, {
    dialect: dialect.value,
    uppercaseKeywords: uppercaseKeywords.value,
  })

  if (!result.ok) {
    compressError.value = '压缩失败: ' + (result.error || '未知错误')
    return
  }

  compressResult.value = result.value
  compressStats.value = computeStats(input, result.value)

  if (autoCopy.value) {
    copyResult(result.value)
  }
}

function clearFormat () {
  formatInput.value = ''
  formatResult.value = null
  formatError.value = ''
  formatStats.value = null
}

function clearCompress () {
  compressInput.value = ''
  compressResult.value = null
  compressError.value = ''
  compressStats.value = null
}

function loadExample () {
  formatInput.value = exampleSql
}

async function pasteToFormat () {
  try {
    formatInput.value = await readClipboardText()
  } catch {
    formatError.value = '无法读取剪贴板内容'
  }
}

async function pasteToCompress () {
  try {
    compressInput.value = await readClipboardText()
  } catch {
    compressError.value = '无法读取剪贴板内容'
  }
}

function copyResult (text) {
  copyText(text, flashCopy)
}

function downloadResult (filename, content) {
  downloadTextFile(filename, content)
}

function sendToFormat (text) {
  formatInput.value = text
  activeTab.value = 'format'
  doFormat()
}

function sendToCompress (text) {
  compressInput.value = text
  activeTab.value = 'compress'
  doCompress()
}
</script>
