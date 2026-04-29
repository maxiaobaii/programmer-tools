/**
 * URL 编解码工具函数
 * 支持 encodeURI / encodeURIComponent 两种模式
 */

// ===================== 编码 =====================

/**
 * 使用 encodeURI 对完整 URL 进行编码
 * 保留 scheme、host、路径分隔符、查询符号等 URL 结构字符
 * @param {string} input 原始文本
 * @returns {string} 编码后的 URL
 */
export function encodeUrl (input) {
  return encodeURI(input)
}

/**
 * 使用 encodeURIComponent 对 URL 片段进行编码
 * 编码所有非保留字符（A-Z a-z 0-9 - _ . ! ~ * ' ( ) 除外）
 * @param {string} input 原始文本
 * @returns {string} 编码后的片段
 */
export function encodeUrlComponent (input) {
  return encodeURIComponent(input)
}

/**
 * 对查询参数对象进行编码，生成 key=value 对
 * @param {string} input 原始文本（每行一个 key=value 或 key: value）
 * @returns {string} 编码后的查询字符串
 */
export function encodeQueryParams (input) {
  const lines = input.split('\n').filter(line => line.trim())
  const pairs = []

  for (const line of lines) {
    const separatorIndex = findSeparator(line)
    if (separatorIndex === -1) {
      // 没有分隔符，整个作为 key，value 为空
      pairs.push(encodeURIComponent(trimStart(line)) + '=')
    } else {
      const key = line.slice(0, separatorIndex)
      const value = line.slice(separatorIndex + 1)
      pairs.push(encodeURIComponent(trimStart(key)) + '=' + encodeURIComponent(trimStart(value)))
    }
  }

  return pairs.join('&')
}

// ===================== 解码 =====================

/**
 * 使用 decodeURI 对完整 URL 进行解码
 * @param {string} input 编码后的 URL
 * @returns {string} 解码后的文本
 * @throws {URIError} 当输入包含无效的编码序列时
 */
export function decodeUrl (input) {
  return decodeURI(input)
}

/**
 * 使用 decodeURIComponent 对 URL 片段进行解码
 * @param {string} input 编码后的片段
 * @returns {string} 解码后的文本
 * @throws {URIError} 当输入包含无效的编码序列时
 */
export function decodeUrlComponent (input) {
  return decodeURIComponent(input)
}

/**
 * 解码查询字符串为格式化的 key=value 对
 * @param {string} input 编码后的查询字符串（如 a=1&b=2）
 * @returns {string} 格式化后的文本（每行一个 key=value）
 * @throws {URIError} 当输入包含无效的编码序列时
 */
export function decodeQueryParams (input) {
  const trimmed = input.trim()
  if (!trimmed) return ''

  // 移除开头的 ?
  const clean = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed

  const pairs = clean.split('&')
  const lines = []

  for (const pair of pairs) {
    if (!pair) continue
    const eqIndex = pair.indexOf('=')
    if (eqIndex === -1) {
      // 没有 =，整个作为 key
      lines.push(decodeURIComponent(pair) + '=')
    } else {
      const key = pair.slice(0, eqIndex)
      const value = pair.slice(eqIndex + 1)
      lines.push(decodeURIComponent(key) + '=' + decodeURIComponent(value))
    }
  }

  return lines.join('\n')
}

// ===================== 验证 =====================

/**
 * 验证是否为合法的编码后 URL
 * @param {string} input 待验证文本
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateEncodedUrl (input) {
  if (!input || !input.trim()) {
    return { valid: false, error: '输入不能为空' }
  }
  try {
    encodeURI(decodeURI(input))
    return { valid: true, error: null }
  } catch (e) {
    return { valid: false, error: e.message || '包含无效的编码序列' }
  }
}

/**
 * 验证是否为合法的编码后 URL 片段
 * @param {string} input 待验证文本
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateEncodedComponent (input) {
  if (!input || !input.trim()) {
    return { valid: false, error: '输入不能为空' }
  }
  try {
    encodeURIComponent(decodeURIComponent(input))
    return { valid: true, error: null }
  } catch (e) {
    return { valid: false, error: e.message || '包含无效的编码序列' }
  }
}

// ===================== 统计 =====================

/**
 * 计算编解码前后的字节统计
 * @param {string} input 输入文本
 * @param {string} output 输出文本
 * @returns {{ inputBytes: number, outputBytes: number, ratio: string }}
 */
export function computeStats (input, output) {
  const encoder = new TextEncoder()
  const inputBytes = encoder.encode(input).byteLength
  const outputBytes = encoder.encode(output).byteLength
  const ratio = inputBytes === 0
    ? '0'
    : (outputBytes / inputBytes).toFixed(2)
  return { inputBytes, outputBytes, ratio }
}

// ===================== 内部工具 =====================

/**
 * 查找 key=value 行中的分隔符位置（= 或 :）
 * @param {string} line
 * @returns {number} 分隔符索引，-1 表示未找到
 */
function findSeparator (line) {
  const eqIndex = line.indexOf('=')
  const colonIndex = line.indexOf(':')
  if (eqIndex === -1 && colonIndex === -1) return -1
  if (eqIndex === -1) return colonIndex
  if (colonIndex === -1) return eqIndex
  return Math.min(eqIndex, colonIndex)
}

/**
 * 去除字符串开头的空白字符
 * @param {string} str
 * @returns {string}
 */
function trimStart (str) {
  return str.replace(/^\s+/, '')
}
