<template>
  <div class="sql-workbench">
    <div class="sql-shell">
      <header class="sql-topbar">
        <RouterLink
          to="/"
          class="tool-page-back"
        >返回首页</RouterLink>
      </header>

      <div class="sql-card">
        <div class="tdiff-inputs">
          <div class="tdiff-input-col">
            <label class="tdiff-label">文本 A（原始）</label>
            <textarea
              v-model="inputA"
              class="sql-textarea"
              rows="16"
              placeholder="粘贴原始文本..."
              spellcheck="false"
            />
          </div>
          <div class="tdiff-input-col">
            <label class="tdiff-label">文本 B（修改后）</label>
            <textarea
              v-model="inputB"
              class="sql-textarea"
              rows="16"
              placeholder="粘贴修改后的文本..."
              spellcheck="false"
            />
          </div>
        </div>

        <div class="tdiff-actions">
          <button
            class="btn btn-primary"
            @click="doDiff"
          >对比</button>
          <button
            class="btn btn-ghost"
            @click="swap"
          >交换</button>
          <button
            class="btn btn-ghost"
            @click="clear"
          >清空</button>
          <button
            class="btn btn-ghost"
            @click="loadExample"
          >加载示例</button>
        </div>

        <!-- 结果区域 -->
        <div
          v-if="result"
          class="tdiff-result"
        >
          <div class="sql-result-header">
            <span class="tdiff-summary">{{ summarizeDiffStats(result.stats) }}</span>
            <div class="sql-result-actions">
              <button
                class="btn btn-ghost"
                @click="copyDiff"
              >复制</button>
              <button
                class="btn btn-ghost"
                @click="downloadDiff"
              >下载</button>
            </div>
          </div>

          <!-- 并排视图 -->
          <div class="tdiff-view">
            <div class="tdiff-side tdiff-side-left">
              <div class="tdiff-side-header">文本 A</div>
              <div class="tdiff-lines">
                <div
                  v-for="(line, idx) in leftLines"
                  :key="idx"
                  class="tdiff-line"
                  :class="'tdiff-line-' + line.type"
                >
                  <span class="tdiff-line-no">{{ line.lineNo ?? '' }}</span>
                  <span class="tdiff-line-content">
                    <template v-if="line.segments">
                      <span
                        v-for="(seg, si) in line.segments"
                        :key="si"
                        :class="seg.type === 'removed' ? 'tdiff-char-removed' : ''"
                      >{{ seg.text }}</span>
                    </template>
                    <template v-else>{{ line.text }}</template>
                  </span>
                </div>
              </div>
            </div>

            <div class="tdiff-side tdiff-side-right">
              <div class="tdiff-side-header">文本 B</div>
              <div class="tdiff-lines">
                <div
                  v-for="(line, idx) in rightLines"
                  :key="idx"
                  class="tdiff-line"
                  :class="'tdiff-line-' + line.type"
                >
                  <span class="tdiff-line-no">{{ line.lineNo ?? '' }}</span>
                  <span class="tdiff-line-content">
                    <template v-if="line.segments">
                      <span
                        v-for="(seg, si) in line.segments"
                        :key="si"
                        :class="seg.type === 'added' ? 'tdiff-char-added' : ''"
                      >{{ seg.text }}</span>
                    </template>
                    <template v-else>{{ line.text }}</template>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../utils.js'
import { downloadTextFile } from '../lib/io.js'
import { diffText, summarizeDiffStats, formatDiffAsText } from '../lib/text-diff.js'
import { inject } from 'vue'

const flashCopy = inject('flashCopy', null)

const inputA = ref('')
const inputB = ref('')
const result = ref(null)

const exampleA = `Hello World
This is a test
foo bar baz
unchanged line
goodbye`

const exampleB = `Hello World
This is a modified test
foo baz
unchanged line
welcome
new line added`

function doDiff () {
  if (!inputA.value && !inputB.value) return
  result.value = diffText(inputA.value, inputB.value)
}

function swap () {
  const tmp = inputA.value
  inputA.value = inputB.value
  inputB.value = tmp
  if (result.value) doDiff()
}

function clear () {
  inputA.value = ''
  inputB.value = ''
  result.value = null
}

function loadExample () {
  inputA.value = exampleA
  inputB.value = exampleB
  doDiff()
}

// 构建左侧视图行
const leftLines = computed(() => {
  if (!result.value) return []
  return result.value.lines.map(line => {
    if (line.type === 'unchanged') {
      return { type: 'equal', lineNo: line.oldLineNo, text: line.oldText }
    }
    if (line.type === 'removed') {
      return { type: 'removed', lineNo: line.oldLineNo, text: line.oldText }
    }
    if (line.type === 'modified') {
      return { type: 'modified', lineNo: line.oldLineNo, text: line.oldText, segments: line.oldSegments }
    }
    // added — 左侧占位
    return { type: 'spacer', lineNo: null, text: '' }
  })
})

// 构建右侧视图行
const rightLines = computed(() => {
  if (!result.value) return []
  return result.value.lines.map(line => {
    if (line.type === 'unchanged') {
      return { type: 'equal', lineNo: line.newLineNo, text: line.newText }
    }
    if (line.type === 'added') {
      return { type: 'added', lineNo: line.newLineNo, text: line.newText }
    }
    if (line.type === 'modified') {
      return { type: 'modified', lineNo: line.newLineNo, text: line.newText, segments: line.newSegments }
    }
    // removed — 右侧占位
    return { type: 'spacer', lineNo: null, text: '' }
  })
})

function copyDiff () {
  if (!result.value) return
  copyText(formatDiffAsText(result.value.lines), flashCopy)
}

function downloadDiff () {
  if (!result.value) return
  downloadTextFile('diff-result.txt', formatDiffAsText(result.value.lines))
}
</script>
