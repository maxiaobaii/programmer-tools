const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
  'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto',
  'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package',
  'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized',
  'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'record', 'sealed', 'permits',
])

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function pascalCase(input) {
  const value = String(input ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()

  const result = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')

  const safeResult = result || 'Item'
  return /^[0-9]/.test(safeResult) ? `Type${safeResult}` : safeResult
}

function camelCase(input) {
  const pascal = pascalCase(input)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

function sanitizeFieldName(name) {
  const base = camelCase(name)
  const safeBase = base || 'value'
  const safeName = /^[0-9]/.test(safeBase) ? `value${pascalCase(safeBase)}` : safeBase
  return JAVA_KEYWORDS.has(safeName) ? `${safeName}Field` : safeName
}

function createPrimitive(kind) {
  return { kind }
}

function createObject(properties = {}) {
  return { kind: 'object', properties }
}

function createArray(element = createPrimitive('Object')) {
  return { kind: 'array', element }
}

function inferNumberKind(value) {
  if (!Number.isFinite(value)) return 'double'
  if (!Number.isInteger(value)) return 'double'
  if (value >= -2147483648 && value <= 2147483647) return 'integer'
  return 'long'
}

function inferShape(value) {
  if (value === null || value === undefined) return createPrimitive('null')
  if (Array.isArray(value)) {
    if (!value.length) return createArray(createPrimitive('Object'))
    let element = inferShape(value[0])
    for (let index = 1; index < value.length; index += 1) {
      element = mergeShapes(element, inferShape(value[index]))
    }
    return createArray(element)
  }
  if (isPlainObject(value)) {
    const properties = {}
    for (const [key, child] of Object.entries(value)) {
      properties[key] = { shape: inferShape(child), optional: false }
    }
    return createObject(properties)
  }
  if (typeof value === 'number') return createPrimitive(inferNumberKind(value))
  if (typeof value === 'string') return createPrimitive('string')
  if (typeof value === 'boolean') return createPrimitive('boolean')
  return createPrimitive('Object')
}

function mergeObjectShapes(left, right) {
  const keys = new Set([...Object.keys(left.properties), ...Object.keys(right.properties)])
  const properties = {}

  for (const key of keys) {
    const leftProp = left.properties[key]
    const rightProp = right.properties[key]

    if (leftProp && rightProp) {
      properties[key] = {
        optional: leftProp.optional || rightProp.optional,
        shape: mergeShapes(leftProp.shape, rightProp.shape),
      }
      continue
    }

    if (leftProp) {
      properties[key] = { shape: leftProp.shape, optional: true }
      continue
    }

    properties[key] = { shape: rightProp.shape, optional: true }
  }

  return createObject(properties)
}

function mergeShapes(left, right) {
  if (!left) return right
  if (!right) return left
  if (left.kind === right.kind) {
    if (left.kind === 'object') return mergeObjectShapes(left, right)
    if (left.kind === 'array') return createArray(mergeShapes(left.element, right.element))
    return left
  }

  if (left.kind === 'null') return right
  if (right.kind === 'null') return left

  const numericKinds = new Set(['integer', 'long', 'double'])
  if (numericKinds.has(left.kind) && numericKinds.has(right.kind)) {
    if (left.kind === 'double' || right.kind === 'double') return createPrimitive('double')
    if (left.kind === 'long' || right.kind === 'long') return createPrimitive('long')
    return createPrimitive('integer')
  }

  if (left.kind === 'array' && right.kind === 'array') {
    return createArray(mergeShapes(left.element, right.element))
  }

  return createPrimitive('object')
}

function indent(level) {
  return '  '.repeat(level)
}

function uniqueClassName(baseName, ctx) {
  let candidate = pascalCase(baseName)
  let suffix = 2
  while (ctx.usedClassNames.has(candidate)) {
    candidate = `${pascalCase(baseName)}${suffix}`
    suffix += 1
  }
  ctx.usedClassNames.add(candidate)
  return candidate
}

function resolveFieldMeta(originalName) {
  const fieldName = sanitizeFieldName(originalName)
  return {
    originalName,
    fieldName,
    accessorName: pascalCase(fieldName),
    needsJsonProperty: fieldName !== originalName,
  }
}

function renderJavaType(shape, className, propertyName, ctx) {
  switch (shape.kind) {
    case 'string':
      return 'String'
    case 'boolean':
      return 'Boolean'
    case 'integer':
      return 'Integer'
    case 'long':
      return 'Long'
    case 'double':
      return 'Double'
    case 'array': {
      ctx.imports.add('java.util.List')
      const elementType = renderJavaType(shape.element, className, `${propertyName}Item`, ctx)
      return `List<${elementType}>`
    }
    case 'Object':
      return 'Object'
    case 'object': {
      const nestedClassName = uniqueClassName(`${className}${pascalCase(propertyName)}`, ctx)
      ctx.classQueue.push({ shape, className: nestedClassName })
      return nestedClassName
    }
    case 'null':
    default:
      return 'Object'
  }
}

function renderField(meta, type, level, ctx) {
  const lines = []
  if (meta.needsJsonProperty) {
    ctx.imports.add('com.fasterxml.jackson.annotation.JsonProperty')
    lines.push(`${indent(level)}@JsonProperty("${meta.originalName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`)
  }
  lines.push(`${indent(level)}private ${type} ${meta.fieldName};`)
  return lines
}

function renderAccessors(meta, type, level) {
  return [
    `${indent(level)}public ${type} get${meta.accessorName}() {`,
    `${indent(level + 1)}return ${meta.fieldName};`,
    `${indent(level)}}`,
    '',
    `${indent(level)}public void set${meta.accessorName}(${type} ${meta.fieldName}) {`,
    `${indent(level + 1)}this.${meta.fieldName} = ${meta.fieldName};`,
    `${indent(level)}}`,
  ]
}

function renderClass(shape, className, ctx) {
  const bodyIndentLevel = 1
  const lines = []
  const accessors = []

  if (ctx.style === 'lombok') {
    ctx.imports.add('lombok.Data')
    lines.push('@Data')
  }
  lines.push(`public class ${className} {`)

  const entries = Object.entries(shape.properties).sort(([a], [b]) => a.localeCompare(b))
  for (const [key, prop] of entries) {
    const meta = resolveFieldMeta(key)
    const type = renderJavaType(prop.shape, className, key, ctx)
    lines.push(...renderField(meta, type, bodyIndentLevel, ctx), '')
    if (ctx.style === 'pojo') {
      accessors.push(...renderAccessors(meta, type, bodyIndentLevel), '')
    }
  }

  while (lines.at(-1) === '') lines.pop()
  if (accessors.length) {
    while (accessors.at(-1) === '') accessors.pop()
    lines.push('')
    lines.push(...accessors)
  }

  while (lines.at(-1) === '') lines.pop()
  lines.push('}')
  return lines
}

export function generateJavaTypes(jsonValue, options = {}) {
  const style = options.style === 'lombok' ? 'lombok' : 'pojo'
  const rootName = pascalCase(options.rootName || 'Root')
  const shape = inferShape(jsonValue)
  const ctx = {
    style,
    imports: new Set(),
    usedClassNames: new Set(),
    classQueue: [],
  }

  let rootComment = ''
  let rootShape = shape
  let className = rootName

  if (shape.kind === 'array') {
    ctx.imports.add('java.util.List')
    rootShape = shape.element
    className = `${rootName}Item`
    rootComment = `// Root type: List<${className}>`
  }

  if (rootShape.kind !== 'object') {
    throw new Error('仅支持对象或对象数组作为 Java 类型根节点')
  }

  ctx.usedClassNames.add(className)
  ctx.classQueue.push({ shape: rootShape, className })

  const classBlocks = []
  while (ctx.classQueue.length) {
    const item = ctx.classQueue.shift()
    classBlocks.push(renderClass(item.shape, item.className, ctx))
  }

  const importLines = [...ctx.imports].sort().map((item) => `import ${item};`)
  const parts = [...importLines, ...(importLines.length ? [''] : [])]
  if (rootComment) parts.push(rootComment, '')
  parts.push(...classBlocks.flatMap((block, index) => index === 0 ? block : ['', ...block]))
  return parts.join('\n')
}
