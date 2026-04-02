export async function readClipboardText() {
  if (!globalThis.navigator?.clipboard?.readText) {
    throw new Error('剪贴板读取不可用，请检查浏览器权限')
  }

  try {
    return await globalThis.navigator.clipboard.readText()
  } catch (error) {
    throw new Error(`读取剪贴板失败：${error.message}`)
  }
}

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function pickTextFile(accept = '.json,.txt') {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('未选择文件'))
        return
      }

      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    }
    input.click()
  })
}
