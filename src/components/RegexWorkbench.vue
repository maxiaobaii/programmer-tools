<template>
  <div class="regex-workbench">
    <div class="regex-shell">
      <header class="regex-topbar">
        <RouterLink
          to="/"
          class="tool-page-back"
        >返回首页</RouterLink>
        <div class="regex-input-area">
          <div class="regex-input-row">
            <input
              v-model="regexInput"
              class="regex-input"
              placeholder="输入正则表达式，如 /\\d+/gi 或纯文本 \\d+"
              spellcheck="false"
            >
          </div>
          <div class="regex-flags-row">
            <span class="regex-flags-label">标志位：</span>
            <label
              v-for="flag in REGEX_FLAGS"
              :key="flag.key"
              class="regex-flag-item"
              :title="flag.description"
            >
              <input
                v-model="selectedFlags"
                type="checkbox"
                :value="flag.key"
              >
              <span class="regex-flag-key">{{ flag.key }}</span>
              <span class="regex-flag-desc">{{ flag.description }}</span>
            </label>
          </div>
          <div v-if="parsedPattern" class="regex-parsed-info">
            <span class="regex-parsed-label">解析结果：</span>
            <code class="regex-parsed-pattern">{{ parsedPattern }}</code>
            <span v-if="mergedFlags" class="regex-parsed-flags">/ {{ mergedFlags }}</span>
          </div>
          <div v-if="parseError" class="regex-parse-error">
            {{ parseError }}
          </div>
        </div>
      </header>

      <div class="regex-panels">
        <div class="regex-panel regex-panel-left">
          <div class="panel-header">
            <span class="panel-label">测试字符串</span>
            <span class="regex-line-count">{{ lineCount }} 行</span>
          </div>
          <div class="panel-body">
            <textarea
              v-model="testText"
              class="regex-editor"
              placeholder="输入需要测试的字符串..."
              spellcheck="false"
            />
          </div>
        </div>

        <div class="regex-panel regex-panel-right">
          <div class="panel-header">
            <span class="panel-label">匹配结果</span>
            <span v-if="matchCount > 0" class="regex-match-count">{{ matchCount }} 个匹配</span>
          </div>
          <div class="panel-body regex-result-body">
            <div v-if="matchError" class="regex-error-msg">
              <p>正则表达式错误</p>
              <pre>{{ matchError }}</pre>
            </div>
            <div v-else-if="!regexInput.trim()" class="regex-empty-state">
              请输入正则表达式
            </div>
            <div v-else-if="matchCount === 0" class="regex-empty-state">
              无匹配结果
            </div>
            <div v-else class="regex-line-results">
              <template
                v-for="lineResult in lineResults"
                :key="lineResult.lineIndex"
              >
                <div
                  v-if="lineResult.matches.length > 0"
                  class="regex-line-group"
                >
                  <div class="regex-line-header">
                    <span class="regex-line-number">第 {{ lineResult.lineIndex + 1 }} 行</span>
                    <span class="regex-line-match-count">{{ lineResult.matches.length }} 个匹配</span>
                  </div>
                  <div class="regex-line-matches">
                    <div
                      v-for="(match, idx) in lineResult.matches"
                      :key="idx"
                      class="regex-match-card"
                    >
                      <div class="regex-match-header">
                        <span class="regex-match-index">匹配 {{ idx + 1 }}</span>
                        <span class="regex-match-position">位置: {{ match.index }}-{{ match.endIndex }}</span>
                      </div>
                      <div class="regex-match-value">
                        <pre>{{ match.value || '(空字符串)' }}</pre>
                        <button
                          class="btn btn-primary regex-copy-btn"
                          @click="copyValue(match.value)"
                        >复制</button>
                      </div>
                      <div v-if="match.groups.length > 0" class="regex-match-groups">
                        <div class="regex-match-group-label">捕获分组：</div>
                        <div
                          v-for="(group, gIdx) in match.groups"
                          :key="gIdx"
                          class="regex-group-item"
                        >
                          <span class="regex-group-index">${{ gIdx + 1 }}</span>
                          <pre class="regex-group-value">{{ group ?? '(undefined)' }}</pre>
                          <button
                            v-if="group"
                            class="btn btn-ghost regex-copy-btn-small"
                            @click="copyValue(group)"
                          >复制</button>
                        </div>
                      </div>
                      <div v-if="Object.keys(match.namedGroups).length > 0" class="regex-match-named-groups">
                        <div class="regex-match-group-label">命名分组：</div>
                        <div
                          v-for="(value, name) in match.namedGroups"
                          :key="name"
                          class="regex-group-item"
                        >
                          <span class="regex-group-name">{{ name }}</span>
                          <pre class="regex-group-value">{{ value ?? '(undefined)' }}</pre>
                          <button
                            v-if="value"
                            class="btn btn-ghost regex-copy-btn-small"
                            @click="copyValue(value)"
                          >复制</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { copyText } from '../utils.js'
import {
  REGEX_FLAGS,
  parseRegexInput,
  mergeFlags,
  executeRegex,
} from '../lib/regex.js'

const flash = inject('flashCopy')

const regexInput = ref('')
const selectedFlags = ref(['g'])
const testText = ref('')

const parsedInput = computed(() => parseRegexInput(regexInput.value))

const parseError = computed(() => parsedInput.value.error)

const parsedPattern = computed(() => parsedInput.value.pattern || '')

const mergedFlags = computed(() => {
  return mergeFlags(parsedInput.value.flags, selectedFlags.value)
})

const regexResult = computed(() => {
  if (parseError.value || !parsedPattern.value) {
    return { matches: [], matchCount: 0, error: null, lineResults: [] }
  }
  return executeRegex(parsedPattern.value, mergedFlags.value, testText.value)
})

const matches = computed(() => regexResult.value.matches)
const matchCount = computed(() => regexResult.value.matchCount)
const matchError = computed(() => regexResult.value.error)
const lineResults = computed(() => regexResult.value.lineResults)

const lineCount = computed(() => {
  if (!testText.value) return 0
  return testText.value.split('\n').length
})

function copyValue(value) {
  copyText(value, flash)
}
</script>
