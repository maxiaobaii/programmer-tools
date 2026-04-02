function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function createPrimitive(kind) {
  return { kind }
}

function createObject(properties = {}) {
  return { kind: 'object', properties }
}

function createArray(element = createPrimitive('unknown')) {
  return { kind: 'array', element }
}

function normalizeUnionMembers(members) {
  const flattened = []
  for (const member of members) {
    if (!member) continue
    if (member.kind === 'union') flattened.push(...member.members)
    else flattened.push(member)
  }

  const deduped = []
  const seen = new Set()
  for (const member of flattened) {
    const key = stableKey(member)
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(member)
    }
  }

  deduped.sort((a, b) => typeOrder(a) - typeOrder(b) || stableKey(a).localeCompare(stableKey(b)))
  if (deduped.length === 1) return deduped[0]
  return { kind: 'union', members: deduped }
}

function typeOrder(shape) {
  const order = {
    null: 0,
    string: 1,
    number: 2,
    boolean: 3,
    unknown: 4,
    object: 5,
    array: 6,
    union: 7,
  }
  return order[shape.kind] ?? 99
}

function stableKey(shape) {
  if (!shape) return 'unknown'
  if (shape.kind === 'object') {
    const props = Object.entries(shape.properties)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value.optional ? '?' : ''}${stableKey(value.shape)}`)
      .join(',')
    return `object{${props}}`
  }
  if (shape.kind === 'array') return `array<${stableKey(shape.element)}>`
  if (shape.kind === 'union') return `union<${shape.members.map(stableKey).join('|')}>`
  return shape.kind
}

function inferShape(value) {
  if (value === null) return createPrimitive('null')
  if (Array.isArray(value)) {
    if (value.length === 0) return createArray(createPrimitive('unknown'))
    let element = inferShape(value[0])
    for (let index = 1; index < value.length; index += 1) {
      element = mergeValueTypes(element, inferShape(value[index]))
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
  return createPrimitive(typeof value)
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
        shape: mergeValueTypes(leftProp.shape, rightProp.shape),
      }
    } else if (leftProp) {
      properties[key] = {
        optional: true,
        shape: leftProp.shape,
      }
    } else {
      properties[key] = {
        optional: true,
        shape: rightProp.shape,
      }
    }
  }

  return createObject(properties)
}

export function mergeValueTypes(left, right) {
  if (!left) return right
  if (!right) return left
  if (stableKey(left) === stableKey(right)) return left

  if (left.kind === 'object' && right.kind === 'object') {
    return mergeObjectShapes(left, right)
  }

  if (left.kind === 'array' && right.kind === 'array') {
    return createArray(mergeValueTypes(left.element, right.element))
  }

  return normalizeUnionMembers([left, right])
}

function isValidIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)
}

function quoteKey(name) {
  return `'${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function formatPropertyName(name) {
  return isValidIdentifier(name) ? name : quoteKey(name)
}

function pascalCase(input) {
  return String(input)
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') || 'Item'
}

function ensureTypeName(baseName, ctx) {
  let candidate = pascalCase(baseName)
  if (!candidate) candidate = 'Anonymous'
  let suffix = 1
  while (ctx.usedNames.has(candidate)) {
    suffix += 1
    candidate = `${pascalCase(baseName)}${suffix}`
  }
  ctx.usedNames.add(candidate)
  return candidate
}

function wrapUnionIfNeeded(source) {
  return source.includes(' | ') ? `(${source})` : source
}

function renderObject(shape, nameHint, ctx) {
  const signature = stableKey(shape)
  if (ctx.signatureToName.has(signature)) return ctx.signatureToName.get(signature)

  const typeName = ensureTypeName(nameHint, ctx)
  ctx.signatureToName.set(signature, typeName)

  const lines = [`export interface ${typeName} {`]
  const entries = Object.entries(shape.properties).sort(([a], [b]) => a.localeCompare(b))
  for (const [key, prop] of entries) {
    const propType = renderShape(prop.shape, `${typeName}${pascalCase(key)}`, ctx)
    lines.push(`  ${formatPropertyName(key)}${prop.optional ? '?' : ''}: ${propType}`)
  }
  lines.push('}')

  ctx.declarations.push(lines.join('\n'))
  return typeName
}

function renderUnion(shape, nameHint, ctx) {
  return shape.members
    .map((member) => renderShape(member, nameHint, ctx))
    .sort((a, b) => a.localeCompare(b))
    .join(' | ')
}

function renderShape(shape, nameHint, ctx) {
  if (shape.kind === 'string' || shape.kind === 'number' || shape.kind === 'boolean' || shape.kind === 'null' || shape.kind === 'unknown') {
    return shape.kind
  }

  if (shape.kind === 'array') {
    const elementType = renderShape(shape.element, `${nameHint}Item`, ctx)
    return `${wrapUnionIfNeeded(elementType)}[]`
  }

  if (shape.kind === 'object') {
    return renderObject(shape, nameHint, ctx)
  }

  if (shape.kind === 'union') {
    return renderUnion(shape, nameHint, ctx)
  }

  return 'unknown'
}

export function toTypeSource(shape, ctx) {
  return renderShape(shape, 'Root', ctx)
}

export function generateTypescript(jsonValue, rootName = 'Root') {
  const shape = inferShape(jsonValue)
  const ctx = {
    usedNames: new Set(),
    declarations: [],
    signatureToName: new Map(),
  }
  const rootType = renderShape(shape, rootName, ctx)
  const parts = [...ctx.declarations]
  parts.push(`export type ${pascalCase(rootName)} = ${rootType}`)
  return parts.join('\n\n')
}
