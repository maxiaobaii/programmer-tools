function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function typeWeight(type) {
  return {
    changed: 0,
    added: 1,
    removed: 2,
    type_changed: 3,
  }[type] ?? 99
}

function compareValues(left, right, path, items) {
  const leftIsArray = Array.isArray(left)
  const rightIsArray = Array.isArray(right)
  const leftIsObject = isObject(left)
  const rightIsObject = isObject(right)

  if (leftIsArray && rightIsArray) {
    const length = Math.max(left.length, right.length)
    for (let index = 0; index < length; index += 1) {
      const nextPath = `${path}[${index}]`
      if (index >= left.length) {
        items.push({ type: 'added', path: nextPath, before: undefined, after: right[index] })
      } else if (index >= right.length) {
        items.push({ type: 'removed', path: nextPath, before: left[index], after: undefined })
      } else {
        compareValues(left[index], right[index], nextPath, items)
      }
    }
    return
  }

  if (leftIsObject && rightIsObject) {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort((a, b) => a.localeCompare(b))
    for (const key of keys) {
      const nextPath = `${path}.${key}`
      const hasLeft = Object.prototype.hasOwnProperty.call(left, key)
      const hasRight = Object.prototype.hasOwnProperty.call(right, key)
      if (!hasLeft && hasRight) {
        items.push({ type: 'added', path: nextPath, before: undefined, after: right[key] })
      } else if (hasLeft && !hasRight) {
        items.push({ type: 'removed', path: nextPath, before: left[key], after: undefined })
      } else {
        compareValues(left[key], right[key], nextPath, items)
      }
    }
    return
  }

  const leftKind = Array.isArray(left) ? 'array' : left === null ? 'null' : typeof left
  const rightKind = Array.isArray(right) ? 'array' : right === null ? 'null' : typeof right

  if (leftKind !== rightKind) {
    items.push({ type: 'type_changed', path, before: left, after: right })
    return
  }

  if (JSON.stringify(left) !== JSON.stringify(right)) {
    items.push({ type: 'changed', path, before: left, after: right })
  }
}

export function diffJsonValues(left, right, path = 'root') {
  const items = []
  compareValues(left, right, path, items)
  return items.sort((a, b) => typeWeight(a.type) - typeWeight(b.type) || a.path.localeCompare(b.path))
}

export function formatDiffValue(value) {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export function summarizeDiff(items) {
  const counts = {
    added: 0,
    removed: 0,
    changed: 0,
    type_changed: 0,
  }

  for (const item of items) {
    counts[item.type] += 1
  }

  return `新增 ${counts.added} 项，删除 ${counts.removed} 项，修改 ${counts.changed} 项，类型变更 ${counts.type_changed} 项`
}
