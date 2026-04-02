// JSON syntax highlight: returns HTML string
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlightTokens(str, patterns) {
  let text = str
  const placeholders = []

  patterns.forEach(({ regex, className }) => {
    text = text.replace(regex, (match) => {
      const placeholder = `§§${placeholders.length}§§`
      placeholders.push(`<span class="${className}">${escapeHtml(match)}</span>`)
      return placeholder
    })
  })

  text = escapeHtml(text)
  placeholders.forEach((html, index) => {
    text = text.replaceAll(`§§${index}§§`, html)
  })

  return text
}

export function highlightJson(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number'
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string'
        } else if (/true|false/.test(match)) {
          cls = 'json-bool'
        } else if (/null/.test(match)) {
          cls = 'json-null'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
}

export function highlightJava(str) {
  if (!str) return ''

  return highlightTokens(str, [
    { regex: /"(?:[^"\\]|\\.)*"/g, className: 'ts-string' },
    { regex: /@[A-Za-z_][A-Za-z0-9_]*/g, className: 'ts-string' },
    { regex: /\b(import|public|private|class|static|void|return|new)\b/g, className: 'ts-keyword' },
    { regex: /\b(String|Integer|Long|Double|Boolean|Object|List|Data)\b/g, className: 'ts-type' },
  ])
}

export function tryParseJson(str) {
  try {
    return { ok: true, value: JSON.parse(str) }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export function formatJson(str, indent = 2) {
  const r = tryParseJson(str)
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, value: JSON.stringify(r.value, null, indent) }
}

export function compressJson(str) {
  const r = tryParseJson(str)
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, value: JSON.stringify(r.value) }
}

function fallbackCopyText(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function showCopyError(message) {
  if (typeof globalThis.alert === 'function') {
    globalThis.alert(message)
  }
}

export async function copyText(text, flash) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      fallbackCopyText(text)
    }
    flash && flash()
    return true
  } catch {
    try {
      fallbackCopyText(text)
      flash && flash()
      return true
    } catch {
      showCopyError('复制失败：请检查浏览器剪贴板权限')
      return false
    }
  }
}
