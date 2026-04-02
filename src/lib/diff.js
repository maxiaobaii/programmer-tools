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

/**
 * Given the formatted JSON texts for both sides and a list of diff items,
 * return per-line annotated arrays for each side, padded with placeholder
 * lines so that corresponding changed lines align horizontally.
 *
 * Each element: { text: string, type: 'added'|'removed'|'changed'|'type_changed'|'placeholder'|null }
 *
 * Strategy:
 * 1. Annotate each line in A/B with its diff type (removed only on A, added only on B, etc.)
 * 2. Walk both annotated arrays simultaneously and insert blank placeholder lines
 *    on the side that is "missing" a counterpart, so that paired lines align.
 */
export function buildAnnotatedSides(textA, textB, items) {
  // leaf key → first/most-specific diff item for that key
  const keyItemMap = {}
  for (const item of items) {
    const segments = item.path.split(/[.\[]/).map((s) => s.replace(/\]$/, ''))
    const leaf = segments[segments.length - 1]
    if (!leaf) continue
    if (!keyItemMap[leaf] || typeWeight(keyItemMap[leaf].type) > typeWeight(item.type)) {
      keyItemMap[leaf] = item
    }
  }

  // Escape a string for use inside a RegExp
  function escapeRE(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function annotate(text, side) {
    return text.split('\n').map((line) => {
      for (const [key, item] of Object.entries(keyItemMap)) {
        if (item.type === 'removed' && side === 'B') continue
        if (item.type === 'added' && side === 'A') continue
        const pattern = new RegExp(`"${escapeRE(key)}"\\s*:`)
        if (pattern.test(line)) {
          return { text: line, type: item.type }
        }
      }
      return { text: line, type: null }
    })
  }

  const rawA = annotate(textA, 'A')
  const rawB = annotate(textB, 'B')

  // Align: walk both arrays, inserting placeholder lines so that
  // "removed" lines on A and "added" lines on B stay in sync.
  const alignedA = []
  const alignedB = []
  let ia = 0
  let ib = 0

  while (ia < rawA.length || ib < rawB.length) {
    const a = rawA[ia]
    const b = rawB[ib]

    if (!a) {
      // A exhausted — pad A with placeholder
      alignedA.push({ text: '', type: 'placeholder' })
      alignedB.push(b)
      ib += 1
    } else if (!b) {
      // B exhausted — pad B with placeholder
      alignedA.push(a)
      alignedB.push({ text: '', type: 'placeholder' })
      ia += 1
    } else if (a.type === 'removed' && b.type !== 'added') {
      // A has a removed line but B has nothing to pair with here → pad B
      alignedA.push(a)
      alignedB.push({ text: '', type: 'placeholder' })
      ia += 1
    } else if (b.type === 'added' && a.type !== 'removed') {
      // B has an added line but A has nothing to pair with here → pad A
      alignedA.push({ text: '', type: 'placeholder' })
      alignedB.push(b)
      ib += 1
    } else {
      // Normal paired line (or both are added/removed at the same position)
      alignedA.push(a)
      alignedB.push(b)
      ia += 1
      ib += 1
    }
  }

  return {
    linesA: alignedA,
    linesB: alignedB,
  }
}
