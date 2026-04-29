<template>
  <div class="base64-workbench">
    <div class="base64-shell">
      <header class="base64-topbar">
        <RouterLink
          to="/"
          class="tool-page-back"
        >返回首页</RouterLink>

        <div class="base64-mode-row">
          <span class="base64-mode-label">编码模式</span>
          <span
            class="base64-help-trigger"
            tabindex="0"
          >
            <span class="base64-help-icon">?</span>
            <span class="base64-help-tip">
              <strong>标准 Base64</strong> 使用 <code>+</code>、<code>/</code> 作为第 62、63 位字符，并用 <code>=</code> 填充尾部，适合一般数据编码。<br><br>
              <strong>URL-safe Base64</strong>（RFC 4648 §5）将 <code>+</code> 替换为 <code>-</code>、<code>/</code> 替换为 <code>_</code>，并去除尾部 <code>=</code> 填充，可直接用于 URL 参数、文件名等场景，无需额外转义。
            </span>
          </span>
          <div
            class="base64-mode-switch"
            role="tablist"
            aria-label="编码模式切换"
          >
            <button
              class="base64-mode-btn"
              :class="{ active: mode === 'standard' }"
              @click="mode = 'standard'"
            >标准 Base64</button>
            <button
              class="base64-mode-btn"
              :class="{ active: mode === 'urlsafe' }"
              @click="mode = 'urlsafe'"
            >URL-safe Base64</button>
          </div>
        </div>
      </header>

      <div class="base64-card">
        <div class="base64-tabs">
          <button
            class="base64-tab"
            :class="{ active: activeTab === 'encode' }"
            @click="activeTab = 'encode'"
          >编码</button>
          <button
            class="base64-tab"
            :class="{ active: activeTab === 'decode' }"
            @click="activeTab = 'decode'"
          >解码</button>
        </div>

        <section
          v-if="activeTab === 'encode'"
          class="base64-panel"
        >
          <h2 class="base64-panel-title">
            {{ mode === 'standard' ? '标准 Base64 编码' : 'URL-safe Base64 编码' }}
          </h2>
          <p class="base64-panel-desc">将明文文本编码为 Base64 字符串</p>

          <div class="base64-form-grid">
            <label class="base64-field-label">输入文本</label>
            <div class="base64-field-content">
              <textarea
                v-model="encodeInput"
                class="base64-textarea"
                placeholder="请输入需要编码的文本..."
                spellcheck="false"
              />
            </div>

            <label class="base64-field-label">选项</label>
            <div class="base64-field-content">
              <label
                v-if="mode === 'standard'"
                class="base64-checkbox-item"
              >
                <input
                  v-model="addLineBreaks"
                  type="checkbox"
                >
                每 76 字符自动换行（MIME 标准）
              </label>
              <label class="base64-checkbox-item">
                <input
                  v-model="autoCopy"
                  type="checkbox"
                >
                编码后自动复制结果
              </label>
            </div>
          </div>

          <div class="base64-action-row">
            <button
              class="btn btn-primary"
              :disabled="!encodeInput"
              @click="doEncode"
            >编码</button>
            <button
              class="btn btn-ghost"
              @click="clearEncode"
            >清空</button>
          </div>

          <p
            v-if="encodeError"
            class="base64-error"
          >{{ encodeError }}</p>

          <div
            v-if="encodeResult !== null"
            class="base64-result-card"
          >
            <div class="base64-result-head">
              <span class="base64-result-label">编码结果</span>
              <div class="base64-result-actions">
                <button
                  class="btn btn-primary"
                  @click="copyResult(encodeResult)"
                >复制</button>
                <button
                  class="btn btn-ghost"
                  @click="downloadResult('base64-encoded.txt', encodeResult)"
                >下载</button>
                <button
                  class="btn btn-ghost"
                  @click="fillToDecode(encodeResult)"
                >发送到解码</button>
              </div>
            </div>
            <textarea
              class="base64-output"
              :value="encodeResult"
              readonly
              spellcheck="false"
            />
            <div
              v-if="encodeStats"
              class="base64-stats"
            >
              <span>输入：{{ encodeStats.inputBytes }} 字节</span>
              <span>输出：{{ encodeStats.outputBytes }} 字节</span>
              <span>膨胀率：{{ encodeStats.ratio }}x</span>
            </div>
          </div>
        </section>

        <section
          v-else
          class="base64-panel"
        >
          <h2 class="base64-panel-title">
            {{ mode === 'standard' ? '标准 Base64 解码' : 'URL-safe Base64 解码' }}
          </h2>
          <p class="base64-panel-desc">将 Base64 字符串解码为明文文本</p>

          <div class="base64-form-grid">
            <label class="base64-field-label">输入 Base64</label>
            <div class="base64-field-content">
              <textarea
                v-model="decodeInput"
                class="base64-textarea"
                placeholder="请输入 Base64 字符串..."
                spellcheck="false"
              />
            </div>

            <label class="base64-field-label">选项</label>
            <div class="base64-field-content">
              <label class="base64-checkbox-item">
                <input
                  v-model="stripWs"
                  type="checkbox"
                >
                自动去除空白字符
              </label>
              <label class="base64-checkbox-item">
                <input
                  v-model="autoCopy"
                  type="checkbox"
                >
                解码后自动复制结果
              </label>
            </div>
          </div>

          <div class="base64-action-row">
            <button
              class="btn btn-primary"
              :disabled="!decodeInput"
              @click="doDecode"
            >解码</button>
            <button
              class="btn btn-ghost"
              @click="clearDecode"
            >清空</button>
            <button
              class="btn btn-ghost"
              @click="pasteFromClipboard"
            >粘贴</button>
          </div>

          <p
            v-if="decodeError"
            class="base64-error"
          >{{ decodeError }}</p>

          <div
            v-if="decodeResult !== null"
            class="base64-result-card"
          >
            <div class="base64-result-head">
              <span class="base64-result-label">解码结果</span>
              <div class="base64-result-actions">
                <button
                  class="btn btn-primary"
                  @click="copyResult(decodeResult)"
                >复制</button>
                <button
                  class="btn btn-ghost"
                  @click="downloadResult('base64-decoded.txt', decodeResult)"
                >下载</button>
                <button
                  class="btn btn-ghost"
                  @click="fillToEncode(decodeResult)"
                >发送到编码</button>
              </div>
            </div>
            <textarea
              class="base64-output"
              :value="decodeResult"
              readonly
              spellcheck="false"
            />
            <div
              v-if="decodeStats"
              class="base64-stats"
            >
              <span>输入：{{ decodeStats.outputBytes }} 字节</span>
              <span>输出：{{ decodeStats.inputBytes }} 字节</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { copyText } from '../utils.js'
import {
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
  addLineBreaks as addLineBreaksFn,
  stripWhitespace,
  computeStats,
} from '../lib/base64.js'
import { readClipboardText } from '../lib/io.js'

const flash = inject('flashCopy')

const activeTab = ref('encode')
const mode = ref('standard')
const autoCopy = ref(false)

// Encode state
const encodeInput = ref('')
const encodeResult = ref(null)
const encodeError = ref('')
const encodeStats = ref(null)
const addLineBreaks = ref(false)

// Decode state
const decodeInput = ref('')
const decodeResult = ref(null)
const decodeError = ref('')
const decodeStats = ref(null)
const stripWs = ref(true)

function doEncode() {
  encodeError.value = ''
  encodeResult.value = null
  encodeStats.value = null

  try {
    let result
    if (mode.value === 'urlsafe') {
      result = encodeBase64Url(encodeInput.value)
    } else {
      result = encodeBase64(encodeInput.value)
      if (addLineBreaks.value) {
        result = addLineBreaksFn(result)
      }
    }

    encodeResult.value = result
    encodeStats.value = computeStats(encodeInput.value, result)

    if (autoCopy.value) {
      copyResult(result)
    }
  } catch (error) {
    encodeError.value = `编码失败：${error.message}`
  }
}

function doDecode() {
  decodeError.value = ''
  decodeResult.value = null
  decodeStats.value = null

  try {
    let input = decodeInput.value
    if (stripWs.value) {
      input = stripWhitespace(input)
    }

    let result
    if (mode.value === 'urlsafe') {
      result = decodeBase64Url(input)
    } else {
      result = decodeBase64(input)
    }

    decodeResult.value = result
    decodeStats.value = computeStats(result, input)

    if (autoCopy.value) {
      copyResult(result)
    }
  } catch (error) {
    decodeError.value = `解码失败：${error.message}`
  }
}

function clearEncode() {
  encodeInput.value = ''
  encodeResult.value = null
  encodeError.value = ''
  encodeStats.value = null
}

function clearDecode() {
  decodeInput.value = ''
  decodeResult.value = null
  decodeError.value = ''
  decodeStats.value = null
}

function copyResult(text) {
  copyText(text, flash)
}

function downloadResult(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function fillToDecode(text) {
  activeTab.value = 'decode'
  decodeInput.value = text
  decodeResult.value = null
  decodeError.value = ''
  decodeStats.value = null
}

function fillToEncode(text) {
  activeTab.value = 'encode'
  encodeInput.value = text
  encodeResult.value = null
  encodeError.value = ''
  encodeStats.value = null
}

async function pasteFromClipboard() {
  try {
    const text = await readClipboardText()
    decodeInput.value = text
  } catch {
    // clipboard not available
  }
}
</script>
