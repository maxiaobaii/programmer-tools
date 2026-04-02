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
            v-else-if="jsonStatus.ok"
            class="status-valid"
          >✓ JSON 语法通过</span>
          <span
            v-else
            class="status-invalid"
          >✗ {{ jsonStatus.error }}</span>
        </div>
      </div>
    </template>
    <template #right>
      <div class="stack-layout">
        <div class="panel sub-panel">
          <div class="panel-header">
            <span class="panel-label">Schema</span>
            <div class="panel-actions">
              <button
                class="btn btn-ghost"
                @click="loadSchemaSample"
              >
                示例 Schema
              </button>
              <button
                class="btn btn-ghost"
                @click="importSchema"
              >
                导入
              </button>
              <button
                class="btn btn-ghost"
                @click="clearSchema"
              >
                清空 Schema
              </button>
            </div>
          </div>
          <div class="panel-body">
            <textarea
              v-model="schemaInput"
              class="json-editor"
              placeholder="可选：在此输入 JSON Schema 子集..."
              spellcheck="false"
            />
          </div>
          <div class="status-bar">
            <span
              v-if="!schemaInput"
              class="status-empty"
            >未提供 Schema，仅执行语法校验</span>
            <span
              v-else-if="schemaStatus.ok"
              class="status-valid"
            >✓ Schema 语法通过</span>
            <span
              v-else
              class="status-invalid"
            >✗ {{ schemaStatus.error }}</span>
          </div>
        </div>

        <div class="panel sub-panel">
          <div class="panel-header">
            <span class="panel-label">校验结果</span>
          </div>
          <div class="panel-body">
            <div
              v-if="!input"
              class="empty-hint"
            >
              <p>输入 JSON 后查看语法和结构校验结果</p>
            </div>
            <div
              v-else
              class="output-area validate-result-area"
            >
              <div
                class="result-summary"
                :class="validationState.ok ? 'result-summary-success' : 'result-summary-error'"
              >
                {{ validationState.message }}
              </div>

              <div
                v-if="jsonStatus.ok"
                class="meta-grid"
              >
                <div>根类型：{{ rootType }}</div>
                <div v-if="rootType === 'object'">
                  键数：{{ Object.keys(jsonStatus.value).length }}
                </div>
                <div v-if="rootType === 'array'">
                  元素数：{{ jsonStatus.value.length }}
                </div>
                <div>字符数：{{ input.length }}</div>
              </div>

              <div
                v-if="validationState.errors.length"
                class="result-list"
              >
                <div
                  v-for="item in validationState.errors"
                  :key="`${item.path}-${item.rule}`"
                  class="result-item"
                >
                  <div class="result-item-head">
                    <span class="badge badge-error">{{ item.rule }}</span>
                    <code>{{ item.path }}</code>
                  </div>
                  <div class="result-item-text">
                    {{ item.message }}
                  </div>
                </div>
              </div>

              <div
                v-else-if="jsonStatus.ok && schemaInput && schemaStatus.ok"
                class="result-note"
              >
                当前 JSON 符合给定 Schema 子集规则。
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ResizableLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { tryParseJson } from '../utils.js'
import { validateJsonSchema } from '../lib/schema.js'
import { pickTextFile, readClipboardText } from '../lib/io.js'
import ResizableLayout from './ResizableLayout.vue'

const input = ref('')
const schemaInput = ref('')
const ioError = ref('')

const jsonStatus = computed(() => tryParseJson(input.value.trim()))
const schemaStatus = computed(() => {
  if (!schemaInput.value.trim()) return { ok: true, value: null }
  return tryParseJson(schemaInput.value.trim())
})

const rootType = computed(() => {
  if (!jsonStatus.value.ok) return ''
  return Array.isArray(jsonStatus.value.value) ? 'array' : typeof jsonStatus.value.value
})

const validationState = computed(() => {
  if (!input.value.trim()) {
    return { ok: false, message: '等待输入 JSON', errors: [] }
  }

  if (!jsonStatus.value.ok) {
    return {
      ok: false,
      message: 'JSON 语法不合法',
      errors: [{ path: 'root', rule: 'syntax', message: jsonStatus.value.error || ioError.value }],
    }
  }

  if (ioError.value) {
    return {
      ok: false,
      message: '读取失败',
      errors: [{ path: 'root', rule: 'io', message: ioError.value }],
    }
  }

  if (!schemaInput.value.trim()) {
    return { ok: true, message: 'JSON 语法合法，未提供 Schema', errors: [] }
  }

  if (!schemaStatus.value.ok) {
    return {
      ok: false,
      message: 'Schema 语法不合法',
      errors: [{ path: 'schema', rule: 'schema_syntax', message: schemaStatus.value.error }],
    }
  }

  const result = validateJsonSchema(jsonStatus.value.value, schemaStatus.value.value)
  return {
    ok: result.ok,
    message: result.ok ? 'JSON 语法通过，结构校验通过' : 'JSON 语法通过，但结构校验未通过',
    errors: result.errors,
  }
})

function clearAll() {
  input.value = ''
  schemaInput.value = ''
  ioError.value = ''
}

function clearSchema() {
  schemaInput.value = ''
}

async function importJson() {
  try {
    input.value = await pickTextFile('.json,.txt')
    ioError.value = ''
  } catch (error) {
    ioError.value = error.message
  }
}

async function importSchema() {
  try {
    schemaInput.value = await pickTextFile('.json,.txt')
    ioError.value = ''
  } catch (error) {
    ioError.value = error.message
  }
}

async function pasteJson() {
  try {
    input.value = await readClipboardText()
    ioError.value = ''
  } catch (error) {
    ioError.value = error.message
  }
}

function loadSample() {
  input.value = JSON.stringify({
    name: '张三',
    age: 25,
    tags: ['vip', 'new'],
    address: { city: '北京' },
  }, null, 2)
}

function loadSchemaSample() {
  schemaInput.value = JSON.stringify({
    type: 'object',
    required: ['name', 'age'],
    properties: {
      name: { type: 'string', minLength: 2 },
      age: { type: 'number', minimum: 0 },
      tags: { type: 'array', items: { type: 'string' } },
      address: {
        type: 'object',
        properties: {
          city: { type: 'string' },
        },
        required: ['city'],
      },
    },
    additionalProperties: false,
  }, null, 2)
}
</script>
