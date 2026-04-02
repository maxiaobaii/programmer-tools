<template>
  <div style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
    <div class="convert-controls convert-controls-wrap">
      <span class="convert-label">输入格式：</span>
      <select
        v-model="inputFormat"
        class="format-select"
      >
        <option
          v-for="option in formatOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <span style="color:var(--text-muted);margin:0 8px;">→</span>
      <span class="convert-label">输出格式：</span>
      <select
        v-model="outputFormat"
        class="format-select"
      >
        <option
          v-for="option in formatOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <button
        class="btn btn-primary"
        @click="convert"
      >
        转换
      </button>
      <button
        class="btn btn-ghost"
        @click="importInput"
      >
        导入
      </button>
      <button
        class="btn btn-ghost"
        @click="pasteInput"
      >
        剪贴板
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
      <button
        class="btn btn-danger"
        @click="clear"
      >
        清空
      </button>
    </div>

    <ResizableLayout>
      <template #left>
        <div
          class="panel"
          style="height:100%"
        >
          <div class="panel-header">
            <span class="panel-label">输入 {{ currentInputLabel }}</span>
            <div class="panel-actions">
              <button
                class="btn btn-ghost"
                @click="loadSample"
              >
                示例
              </button>
            </div>
          </div>
          <div class="panel-body">
            <textarea
              v-model="input"
              class="json-editor"
              :placeholder="`在此粘贴 ${currentInputLabel} 内容...`"
              spellcheck="false"
            />
          </div>
        </div>
      </template>
      <template #right>
        <div
          class="panel"
          style="height:100%"
        >
          <div class="panel-header">
            <span class="panel-label">输出 {{ currentOutputLabel }}</span>
          </div>
          <div class="panel-body">
            <div
              v-if="!result && !error"
              class="empty-hint"
            >
              <p>点击“转换”按钮开始</p>
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
              class="output-area"
            >
              {{ result }}
            </div>
          </div>
        </div>
      </template>
    </ResizableLayout>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { copyText } from '../utils.js'
import { parseByFormat, stringifyByFormat, getFormatExtension } from '../lib/convert.js'
import { downloadTextFile, pickTextFile, readClipboardText } from '../lib/io.js'
import ResizableLayout from './ResizableLayout.vue'

const formatOptions = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'csv', label: 'CSV' },
  { value: 'toml', label: 'TOML' },
  { value: 'query', label: 'Query' },
]

const input = ref('')
const result = ref('')
const inputFormat = ref('json')
const outputFormat = ref('yaml')
const error = ref('')
const flash = inject('flashCopy')

const currentInputLabel = computed(() => formatOptions.find((item) => item.value === inputFormat.value)?.label || inputFormat.value.toUpperCase())
const currentOutputLabel = computed(() => formatOptions.find((item) => item.value === outputFormat.value)?.label || outputFormat.value.toUpperCase())

function convert() {
  error.value = ''
  result.value = ''

  if (!input.value.trim()) {
    error.value = '请先输入内容'
    return
  }

  try {
    const parsed = parseByFormat(input.value, inputFormat.value)
    result.value = stringifyByFormat(parsed, outputFormat.value)
  } catch (currentError) {
    error.value = '转换失败：' + currentError.message
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
  downloadTextFile(`converted.${getFormatExtension(outputFormat.value)}`, result.value)
}

async function importInput() {
  try {
    input.value = await pickTextFile(getAcceptByFormat(inputFormat.value))
    error.value = ''
  } catch (currentError) {
    error.value = currentError.message
  }
}

async function pasteInput() {
  try {
    input.value = await readClipboardText()
    error.value = ''
  } catch (currentError) {
    error.value = currentError.message
  }
}

function getAcceptByFormat(format) {
  return {
    json: '.json,.txt',
    yaml: '.yaml,.yml,.txt',
    xml: '.xml,.txt',
    csv: '.csv,.txt',
    toml: '.toml,.txt',
    query: '.txt',
  }[format] || '.txt'
}

function loadSample() {
  if (inputFormat.value === 'json') {
    input.value = JSON.stringify([
      { name: '张三', age: 25, city: '北京' },
      { name: '李四', age: 30, city: '上海' },
    ], null, 2)
  } else if (inputFormat.value === 'yaml') {
    input.value = 'name: 张三\nage: 25\naddress:\n  city: 北京'
  } else if (inputFormat.value === 'xml') {
    input.value = '<person>\n  <name>张三</name>\n  <age>25</age>\n</person>'
  } else if (inputFormat.value === 'csv') {
    input.value = 'name,age,city\n张三,25,北京\n李四,30,上海'
  } else if (inputFormat.value === 'toml') {
    input.value = 'title = "Example"\n[owner]\nname = "Tom"'
  } else {
    input.value = 'name=张三&tag=vip&tag=new'
  }
}
</script>
