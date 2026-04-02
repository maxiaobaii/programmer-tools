import jsYaml from 'js-yaml'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import toml from 'toml'

function splitCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

function escapeCsvCell(value) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return []
  if (lines.length === 1 && !lines[0].includes(',')) return [lines[0]]

  const header = splitCsvLine(lines[0])
  if (header.length === 1 && lines.every((line) => !line.includes(','))) {
    return lines
  }

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    return Object.fromEntries(header.map((key, index) => [key, cells[index] ?? '']))
  })
}

function stringifyCsv(value) {
  if (!Array.isArray(value)) {
    if (value && typeof value === 'object') return stringifyCsv([value])
    throw new Error('CSV 输出仅支持对象、对象数组或标量数组')
  }

  if (value.length === 0) return ''

  if (value.every((item) => item == null || typeof item !== 'object' || Array.isArray(item))) {
    return value.map((item) => escapeCsvCell(item)).join('\n')
  }

  if (!value.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
    throw new Error('CSV 输出不支持混合数组结构')
  }

  const headers = [...new Set(value.flatMap((item) => Object.keys(item)))]
  const rows = [headers.map(escapeCsvCell).join(',')]
  for (const item of value) {
    rows.push(headers.map((header) => escapeCsvCell(item[header])).join(','))
  }
  return rows.join('\n')
}

function parseQuery(text) {
  const params = new URLSearchParams(text)
  const result = {}
  for (const [key, rawValue] of params.entries()) {
    if (key in result) {
      result[key] = Array.isArray(result[key]) ? [...result[key], rawValue] : [result[key], rawValue]
    } else {
      result[key] = rawValue
    }
  }
  return result
}

function stringifyQuery(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Query 输出仅支持对象')
  }

  const params = new URLSearchParams()
  for (const [key, rawValue] of Object.entries(value)) {
    if (Array.isArray(rawValue)) {
      rawValue.forEach((item) => params.append(key, item == null ? '' : String(item)))
    } else if (rawValue != null && typeof rawValue === 'object') {
      throw new Error('Query 输出不支持嵌套对象')
    } else {
      params.append(key, rawValue == null ? '' : String(rawValue))
    }
  }
  return params.toString()
}

function stringifyTomlValue(value) {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null) return JSON.stringify('null')
  if (Array.isArray(value)) return `[${value.map((item) => stringifyTomlValue(item)).join(', ')}]`
  throw new Error('TOML 数组中不支持复杂对象')
}

function stringifyTomlObject(value, path = []) {
  const scalarLines = []
  const tableLines = []

  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      const tablePath = [...path, key]
      tableLines.push(`${path.length ? '\n' : ''}[${tablePath.join('.')}]`)
      tableLines.push(stringifyTomlObject(child, tablePath))
    } else {
      scalarLines.push(`${key} = ${stringifyTomlValue(child)}`)
    }
  }

  return [...scalarLines, ...tableLines].filter(Boolean).join('\n')
}

export function parseByFormat(text, format) {
  if (!text.trim()) return ''

  if (format === 'json') return JSON.parse(text)
  if (format === 'yaml') return jsYaml.load(text)
  if (format === 'xml') {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    return parser.parse(text)
  }
  if (format === 'csv') return parseCsv(text)
  if (format === 'toml') return toml.parse(text)
  if (format === 'query') return parseQuery(text)

  throw new Error(`暂不支持 ${format} 格式解析`)
}

export function stringifyByFormat(value, format) {
  if (format === 'json') return JSON.stringify(value, null, 2)
  if (format === 'yaml') return jsYaml.dump(value, { indent: 2 })
  if (format === 'xml') {
    const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true })
    return builder.build(value)
  }
  if (format === 'csv') return stringifyCsv(value)
  if (format === 'toml') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('TOML 输出仅支持对象')
    }
    return stringifyTomlObject(value)
  }
  if (format === 'query') return stringifyQuery(value)

  throw new Error(`暂不支持 ${format} 格式输出`)
}

export function getFormatExtension(format) {
  return {
    json: 'json',
    yaml: 'yaml',
    xml: 'xml',
    csv: 'csv',
    toml: 'toml',
    query: 'txt',
  }[format] || 'txt'
}
