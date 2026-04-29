/**
 * 文本 Diff 工具
 * 基于 LCS（最长公共子序列）的行级 diff，支持行内字级高亮
 */

/**
 * 计算两行之间的字级差异
 * @param {string} oldLine 旧行
 * @param {string} newLine 新行
 * @returns {{ oldSegments: Array<{text: string, type: string}>, newSegments: Array<{text: string, type: string}> }}
 */
function diffChars (oldLine, newLine) {
  const oldChars = Array.from(oldLine)
  const newChars = Array.from(newLine)
  const m = oldChars.length
  const n = newChars.length

  // 构建 LCS 表
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldChars[i - 1] === newChars[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // 回溯收集匹配与差异
  const ops = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
      ops.push({ type: 'equal', oldChar: oldChars[i - 1], newChar: newChars[j - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', newChar: newChars[j - 1] })
      j--
    } else {
      ops.push({ type: 'del', oldChar: oldChars[i - 1] })
      i--
    }
  }
  ops.reverse()

  // 将 ops 转换为连续的 segment
  const oldSegments = []
  const newSegments = []
  let curOld = { text: '', type: 'equal' }
  let curNew = { text: '', type: 'equal' }

  for (const op of ops) {
    if (op.type === 'equal') {
      if (curOld.type !== 'equal') {
        oldSegments.push(curOld)
        curOld = { text: '', type: 'equal' }
      }
      if (curNew.type !== 'equal') {
        newSegments.push(curNew)
        curNew = { text: '', type: 'equal' }
      }
      curOld.text += op.oldChar
      curNew.text += op.newChar
    } else if (op.type === 'del') {
      if (curOld.type !== 'removed') {
        if (curOld.text) oldSegments.push(curOld)
        curOld = { text: '', type: 'removed' }
      }
      curOld.text += op.oldChar
    } else {
      if (curNew.type !== 'added') {
        if (curNew.text) newSegments.push(curNew)
        curNew = { text: '', type: 'added' }
      }
      curNew.text += op.newChar
    }
  }
  if (curOld.text) oldSegments.push(curOld)
  if (curNew.text) newSegments.push(curNew)

  return { oldSegments, newSegments }
}

/**
 * 对两段文本做行级 diff
 * @param {string} oldText 原始文本
 * @param {string} newText 修改后文本
 * @returns {{ lines: Array<{type: string, oldLineNo: number|null, newLineNo: number|null, oldText: string|null, newText: string|null, oldSegments?: Array, newSegments?: Array}>, stats: {added: number, removed: number, modified: number, unchanged: number} }}
 */
export function diffText (oldText, newText) {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const m = oldLines.length
  const n = newLines.length

  // 构建 LCS 表（基于行内容）
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // 回溯
  const result = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({
        type: 'unchanged',
        oldLineNo: i,
        newLineNo: j,
        oldText: oldLines[i - 1],
        newText: newLines[j - 1]
      })
      i--
      j--
    } else if (i > 0 && j > 0 && dp[i - 1][j - 1] >= dp[i - 1][j] && dp[i - 1][j - 1] >= dp[i][j - 1]) {
      // 修改行 — 做字级 diff
      const { oldSegments, newSegments } = diffChars(oldLines[i - 1], newLines[j - 1])
      result.push({
        type: 'modified',
        oldLineNo: i,
        newLineNo: j,
        oldText: oldLines[i - 1],
        newText: newLines[j - 1],
        oldSegments,
        newSegments
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({
        type: 'added',
        oldLineNo: null,
        newLineNo: j,
        oldText: null,
        newText: newLines[j - 1]
      })
      j--
    } else {
      result.push({
        type: 'removed',
        oldLineNo: i,
        newLineNo: null,
        oldText: oldLines[i - 1],
        newText: null
      })
      i--
    }
  }
  result.reverse()

  // 统计
  const stats = { added: 0, removed: 0, modified: 0, unchanged: 0 }
  for (const line of result) {
    stats[line.type]++
  }

  return { lines: result, stats }
}

/**
 * 生成 diff 摘要文本
 * @param {{ added: number, removed: number, modified: number, unchanged: number }} stats
 * @returns {string}
 */
export function summarizeDiffStats (stats) {
  const parts = []
  if (stats.added > 0) parts.push(`新增 ${stats.added} 行`)
  if (stats.removed > 0) parts.push(`删除 ${stats.removed} 行`)
  if (stats.modified > 0) parts.push(`修改 ${stats.modified} 行`)
  if (parts.length === 0) return '✅ 两段文本完全相同'
  return parts.join('，') + `，未变 ${stats.unchanged} 行`
}

/**
 * 生成纯文本 diff 输出（类似 unified diff 格式）
 * @param {Array} lines diffText 返回的 lines 数组
 * @returns {string}
 */
export function formatDiffAsText (lines) {
  const out = []
  for (const line of lines) {
    if (line.type === 'unchanged') {
      out.push(`  ${line.oldText}`)
    } else if (line.type === 'added') {
      out.push(`+ ${line.newText}`)
    } else if (line.type === 'removed') {
      out.push(`- ${line.oldText}`)
    } else if (line.type === 'modified') {
      out.push(`- ${line.oldText}`)
      out.push(`+ ${line.newText}`)
    }
  }
  return out.join('\n')
}
