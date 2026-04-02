function getValueKind(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function pushError(errors, path, rule, message) {
  errors.push({ path, rule, message })
}

function matchesType(value, expectedType) {
  if (expectedType === 'array') return Array.isArray(value)
  if (expectedType === 'null') return value === null
  if (expectedType === 'integer') return Number.isInteger(value)
  if (expectedType === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value)
  return typeof value === expectedType
}

function valueInEnum(value, enumValues) {
  return enumValues.some((item) => JSON.stringify(item) === JSON.stringify(value))
}

function walkSchema(value, schema, path, errors) {
  if (!schema || typeof schema !== 'object') return

  const allowedTypes = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
  if (allowedTypes.length > 0 && !allowedTypes.some((type) => matchesType(value, type))) {
    pushError(errors, path, 'type', `期望类型为 ${allowedTypes.join(' | ')}，实际为 ${getValueKind(value)}`)
    return
  }

  if (schema.enum && !valueInEnum(value, schema.enum)) {
    pushError(errors, path, 'enum', '值不在允许的枚举范围内')
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      pushError(errors, path, 'minLength', `长度不能小于 ${schema.minLength}`)
    }
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      pushError(errors, path, 'maxLength', `长度不能大于 ${schema.maxLength}`)
    }
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      pushError(errors, path, 'minimum', `值不能小于 ${schema.minimum}`)
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      pushError(errors, path, 'maximum', `值不能大于 ${schema.maximum}`)
    }
  }

  if (Array.isArray(value)) {
    if (schema.items) {
      value.forEach((item, index) => {
        walkSchema(item, schema.items, `${path}[${index}]`, errors)
      })
    }
    return
  }

  if (value !== null && typeof value === 'object') {
    const properties = schema.properties || {}

    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in value)) {
          pushError(errors, `${path}.${key}`, 'required', `缺少必填字段 ${key}`)
        }
      }
    }

    for (const [key, childSchema] of Object.entries(properties)) {
      if (key in value) {
        walkSchema(value[key], childSchema, `${path}.${key}`, errors)
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          pushError(errors, `${path}.${key}`, 'additionalProperties', `不允许出现额外字段 ${key}`)
        }
      }
    }
  }
}

export function validateJsonSchema(value, schema, path = 'root') {
  const errors = []
  walkSchema(value, schema, path, errors)
  return { ok: errors.length === 0, errors }
}

export function isJsonType(value, type) {
  return matchesType(value, type)
}
