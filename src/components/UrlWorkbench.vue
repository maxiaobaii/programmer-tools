<template>
  <div class="url-workbench">
    <div class="url-shell">
      <header class="url-topbar">
        <RouterLink
          to="/"
          class="tool-page-back"
        >返回首页</RouterLink>

        <div class="url-mode-row">
          <span class="url-mode-label">编码模式</span>
          <span
            class="url-help-trigger"
            tabindex="0"
          >
            <span class="url-help-icon">?</span>
            <span class="url-help-tip">
              <strong>URI 编码</strong>（encodeURI）保留 URL 结构字符（<code>:</code>、<code>/</code>、<code>?</code>、<code>#</code>、<code>[</code>、<code>]</code>、<code>@</code>、<code>!</code>、<code>$</code>、<code>&amp;</code>、<code>'</code>、<code>(</code>、<code>)</code>、<code>*</code>、<code>+</code>、<code>,</code>、<code>;</code>、<code>=</code>），适合编码完整 URL。<br><br>
              <strong>Component 编码</strong>（encodeURIComponent）仅保留字母、数字和 <code>- _ . ! ~ * ' ( )</code>，适合编码查询参数值、路径片段等。<br><br>
              <strong>Query 编码</strong> 按行解析 <code>key=value</code>（支持 <code>=</code> 和 <code>:</code> 分隔），对 key 和 value 分别进行 Component 编码，生成标准查询字符串。
            </span>
          </span>
          <div
            class="url-mode-switch"
            role="tablist"
            aria-label="编码模式切换"
          >
            <button
              class="url-mode-btn"
              :class="{ active: mode === 'uri' }"
              @click="mode = 'uri'"
            >URI</button>
            <button
              class="url-mode-btn"
              :class="{ active: mode === 'component' }"
              @click="mode = 'component'"
            >Component</button>
            <button
              class="url-mode-btn"
              :class="{ active: mode === 'query' }"
              @click="mode = 'query'"
            >Query</button>
          </div>
        </div>
      </header>

      <div class="url-card">
        <div class="url-tabs">
          <button
            class="url-tab"
            :class="{ active: activeTab === 'encode' }"
            @click="activeTab = 'encode'"
          >编码</button>
          <button
            class="url-tab"
            :class="{ active: activeTab === 'decode' }"
            @click="activeTab = 'decode'"
          >解码</button>
        </div>

        <section
          v-if="activeTab === 'encode'"
          class="url-panel"
        >
          <div class="url-form-grid">
            <label class="url-field-label">输入文本</label>
            <div class="url-field-content">
              <textarea
                v-model="encodeInput"
                class="url-textarea"
                rows="6"
                :placeholder="encodePlaceholder"
              />
            </div>

            <label class="url-field-label">选项</label>
            <div class="url-field-content">
              <label class="url-checkbox-item">
                <input v-model="autoCopy" type="checkbox">
                编码后自动复制结果
              </label>
            </div>

            <label class="url-field-label">操作</label>
            <div class="url-field-content url-action-row">
              <button
                class="btn btn-primary"
                @click="doEncode"
              >
                编码
              </button>
              <button
                class="btn btn-ghost"
                @click="clearEncode"
              >
                清空
              </button>
              <button
                class="btn btn-ghost"
                @click="pasteToEncode"
              >
                从剪贴板粘贴
              </button>
            </div>
          </div>

          <p
            v-if="encodeError"
            class="url-error"
          >
            {{ encodeError }}
          </p>

          <div
            v-if="encodeResult !== null"
            class="url-result-card"
          >
            <div class="url-result-header">
              <span class="url-result-title">编码结果</span>
              <div class="url-result-actions">
                <button
                  class="btn btn-ghost"
                  @click="copyResult(encodeResult)"
                >
                  复制
                </button>
                <button
                  class="btn btn-ghost"
                  @click="downloadResult('url-encoded.txt', encodeResult)"
                >
                  下载
                </button>
                <button
                  class="btn btn-ghost"
                  @click="sendToDecode(encodeResult)"
                >
                  发送到解码
                </button>
              </div>
            </div>
            <textarea
              class="url-textarea url-result-output"
              readonly
              :value="encodeResult"
              rows="4"
            />
            <div
              v-if="encodeStats"
              class="url-stats"
            >
              <span>输入: {{ encodeStats.inputBytes }} 字节</span>
              <span>输出: {{ encodeStats.outputBytes }} 字节</span>
              <span>比率: {{ encodeStats.ratio }}x</span>
            </div>
          </div>
        </section>

        <section
          v-else
          class="url-panel"
        >
          <div class="url-form-grid">
            <label class="url-field-label">输入文本</label>
            <div class="url-field-content">
              <textarea
                v-model="decodeInput"
                class="url-textarea"
                rows="6"
                :placeholder="decodePlaceholder"
              />
            </div>

            <label class="url-field-label">选项</label>
            <div class="url-field-content">
              <label class="url-checkbox-item">
                <input v-model="autoCopy" type="checkbox">
                解码后自动复制结果
              </label>
            </div>

            <label class="url-field-label">操作</label>
            <div class="url-field-content url-action-row">
              <button
                class="btn btn-primary"
                @click="doDecode"
              >
                解码
              </button>
              <button
                class="btn btn-ghost"
                @click="clearDecode"
              >
                清空
              </button>
              <button
                class="btn btn-ghost"
                @click="pasteToDecode"
              >
                从剪贴板粘贴
              </button>
            </div>
          </div>

          <p
            v-if="decodeError"
            class="url-error"
          >
            {{ decodeError }}
          </p>

          <div
            v-if="decodeResult !== null"
            class="url-result-card"
          >
            <div class="url-result-header">
              <span class="url-result-title">解码结果</span>
              <div class="url-result-actions">
                <button
                  class="btn btn-ghost"
                  @click="copyResult(decodeResult)"
                >
                  复制
                </button>
                <button
                  class="btn btn-ghost"
                  @click="downloadResult('url-decoded.txt', decodeResult)"
                >
                  下载
                </button>
                <button
                  class="btn btn-ghost"
                  @click="sendToEncode(decodeResult)"
                >
                  发送到编码
                </button>
              </div>
            </div>
            <textarea
              class="url-textarea url-result-output"
              readonly
              :value="decodeResult"
              rows="4"
            />
            <div
              v-if="decodeStats"
              class="url-stats"
            >
              <span>输入: {{ decodeStats.inputBytes }} 字节</span>
              <span>输出: {{ decodeStats.outputBytes }} 字节</span>
              <span>比率: {{ decodeStats.ratio }}x</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { copyText } from '../utils.js'
import { readClipboardText, downloadTextFile } from '../lib/io.js'
import {
  encodeUrl,
  encodeUrlComponent,
  encodeQueryParams,
  decodeUrl,
  decodeUrlComponent,
  decodeQueryParams,
  computeStats
} from '../lib/url.js'

const flashCopy = inject('flashCopy', null)

const activeTab = ref('encode')
const mode = ref('uri')
const autoCopy = ref(true)

const encodeInput = ref('')
const encodeResult = ref(null)
const encodeError = ref('')
const encodeStats = ref(null)

const decodeInput = ref('')
const decodeResult = ref(null)
const decodeError = ref('')
const decodeStats = ref(null)

const modeLabels = {
  uri: 'URI',
  component: 'Component',
  query: 'Query'
}

const encodePlaceholder = computed(() => {
  if (mode.value === 'uri') {
    return '输入完整的 URL，如: https://example.com/path?name=你好&city=北京'
  }
  if (mode.value === 'component') {
    return '输入需要编码的文本，如: 你好世界 / name=value&key=hello'
  }
  return '每行输入一个 key=value，如:\nname=你好\ncity=北京\nmessage=Hello World'
})

const decodePlaceholder = computed(() => {
  if (mode.value === 'uri') {
    return '输入编码后的 URL，如: https://example.com/path?name=%E4%BD%A0%E5%A5%BD'
  }
  if (mode.value === 'component') {
    return '输入编码后的文本，如: %E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C'
  }
  return '输入编码后的查询字符串，如: name=%E4%BD%A0%E5%A5%BD&city=%E5%8C%97%E4%BA%AC'
})

function doEncode () {
  encodeError.value = ''
  encodeResult.value = null
  encodeStats.value = null

  const input = encodeInput.value
  if (!input.trim()) {
    encodeError.value = '请输入需要编码的文本'
    return
  }

  try {
    let result
    if (mode.value === 'uri') {
      result = encodeUrl(input)
    } else if (mode.value === 'component') {
      result = encodeUrlComponent(input)
    } else {
      result = encodeQueryParams(input)
    }

    encodeResult.value = result
    encodeStats.value = computeStats(input, result)

    if (autoCopy.value) {
      copyResult(result)
    }
  } catch (e) {
    encodeError.value = '编码失败: ' + (e.message || '未知错误')
  }
}

function doDecode () {
  decodeError.value = ''
  decodeResult.value = null
  decodeStats.value = null

  const input = decodeInput.value
  if (!input.trim()) {
    decodeError.value = '请输入需要解码的文本'
    return
  }

  try {
    let result
    if (mode.value === 'uri') {
      result = decodeUrl(input)
    } else if (mode.value === 'component') {
      result = decodeUrlComponent(input)
    } else {
      result = decodeQueryParams(input)
    }

    decodeResult.value = result
    decodeStats.value = computeStats(input, result)

    if (autoCopy.value) {
      copyResult(result)
    }
  } catch (e) {
    decodeError.value = '解码失败: 输入包含无效的编码序列'
  }
}

function clearEncode () {
  encodeInput.value = ''
  encodeResult.value = null
  encodeError.value = ''
  encodeStats.value = null
}

function clearDecode () {
  decodeInput.value = ''
  decodeResult.value = null
  decodeError.value = ''
  decodeStats.value = null
}

async function pasteToEncode () {
  try {
    encodeInput.value = await readClipboardText()
  } catch {
    encodeError.value = '无法读取剪贴板内容'
  }
}

async function pasteToDecode () {
  try {
    decodeInput.value = await readClipboardText()
  } catch {
    decodeError.value = '无法读取剪贴板内容'
  }
}

function copyResult (text) {
  copyText(text, flashCopy)
}

function downloadResult (filename, content) {
  downloadTextFile(filename, content)
}

function sendToDecode (text) {
  decodeInput.value = text
  activeTab.value = 'decode'
  doDecode()
}

function sendToEncode (text) {
  encodeInput.value = text
  activeTab.value = 'encode'
  doEncode()
}
</script>
