/**
 * Base64 encode / decode utilities with Unicode and URL-safe support
 */

/**
 * Encode a UTF-8 string to standard Base64
 * @param {string} text
 * @returns {string}
 */
export function encodeBase64(text) {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  return uint8ArrayToBase64(bytes)
}

/**
 * Decode a standard Base64 string to UTF-8 text
 * @param {string} base64
 * @returns {string}
 */
export function decodeBase64(base64) {
  const bytes = base64ToUint8Array(base64)
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(bytes)
}

/**
 * Encode a UTF-8 string to URL-safe Base64 (RFC 4648 §5)
 * Replaces + -> - and / -> _, removes padding =
 * @param {string} text
 * @returns {string}
 */
export function encodeBase64Url(text) {
  return encodeBase64(text)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Decode a URL-safe Base64 string to UTF-8 text
 * Restores standard Base64 characters before decoding
 * @param {string} base64url
 * @returns {string}
 */
export function decodeBase64Url(base64url) {
  let base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  // Restore padding
  const padLen = base64.length % 4
  if (padLen === 2) base64 += '=='
  else if (padLen === 3) base64 += '='

  return decodeBase64(base64)
}

/**
 * Add line breaks every 76 characters (MIME standard)
 * @param {string} base64
 * @returns {string}
 */
export function addLineBreaks(base64) {
  return base64.replace(/(.{76})/g, '$1\n')
}

/**
 * Remove all whitespace from a Base64 string
 * @param {string} base64
 * @returns {string}
 */
export function stripWhitespace(base64) {
  return base64.replace(/\s+/g, '')
}

/**
 * Validate whether a string is valid Base64
 * @param {string} text
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateBase64(text) {
  if (!text || !text.trim()) {
    return { valid: false, error: '输入内容不能为空' }
  }

  const cleaned = stripWhitespace(text)

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    return { valid: false, error: '包含非法的 Base64 字符' }
  }

  if (cleaned.length % 4 !== 0) {
    return { valid: false, error: 'Base64 长度必须是 4 的倍数' }
  }

  return { valid: true, error: null }
}

/**
 * Validate whether a string is valid URL-safe Base64
 * @param {string} text
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateBase64Url(text) {
  if (!text || !text.trim()) {
    return { valid: false, error: '输入内容不能为空' }
  }

  const cleaned = stripWhitespace(text)

  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(cleaned)) {
    return { valid: false, error: '包含非法的 URL-safe Base64 字符' }
  }

  return { valid: true, error: null }
}

/**
 * Compute input/output statistics
 * @param {string} input
 * @param {string} output
 * @returns {{ inputBytes: number, outputBytes: number, ratio: string }}
 */
export function computeStats(input, output) {
  const encoder = new TextEncoder()
  const inputBytes = input ? encoder.encode(input).length : 0
  const outputBytes = output ? encoder.encode(output).length : 0
  const ratio = inputBytes > 0 ? (outputBytes / inputBytes).toFixed(2) : '0.00'

  return { inputBytes, outputBytes, ratio }
}

/**
 * Convert a Uint8Array to a Base64 string
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function uint8ArrayToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert a Base64 string to a Uint8Array
 * @param {string} base64
 * @returns {Uint8Array}
 */
function base64ToUint8Array(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
