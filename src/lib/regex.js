/**
 * Regex parsing and matching utilities
 */

/**
 * All available regex flags
 */
export const REGEX_FLAGS = [
  { key: 'g', label: 'global', description: '全局匹配' },
  { key: 'i', label: 'ignoreCase', description: '忽略大小写' },
  { key: 'm', label: 'multiline', description: '多行模式' },
  { key: 's', label: 'dotAll', description: '. 匹配换行' },
  { key: 'u', label: 'unicode', description: 'Unicode 模式' },
]

/**
 * Parse regex input - supports both /pattern/flags and plain pattern
 * @param {string} input - The input string to parse
 * @returns {{ pattern: string, flags: string, error: string | null }}
 */
export function parseRegexInput(input) {
  if (!input || !input.trim()) {
    return { pattern: '', flags: '', error: null }
  }

  const trimmed = input.trim()
  
  // Check if it's in /pattern/flags format
  if (trimmed.startsWith('/')) {
    // Find the closing slash
    let slashIndex = -1
    let escaped = false
    
    for (let i = 1; i < trimmed.length; i++) {
      if (escaped) {
        escaped = false
        continue
      }
      if (trimmed[i] === '\\') {
        escaped = true
        continue
      }
      if (trimmed[i] === '/') {
        slashIndex = i
        break
      }
    }
    
    if (slashIndex === -1) {
      return { pattern: '', flags: '', error: '缺少闭合的 / 符号' }
    }
    
    const pattern = trimmed.slice(1, slashIndex)
    const flags = trimmed.slice(slashIndex + 1)
    
    // Validate flags
    const validFlags = 'gimsu'
    for (const f of flags) {
      if (!validFlags.includes(f)) {
        return { pattern, flags, error: `无效的标志位: ${f}` }
      }
      if (flags.indexOf(f) !== flags.lastIndexOf(f)) {
        return { pattern, flags, error: `重复的标志位: ${f}` }
      }
    }
    
    return { pattern, flags, error: null }
  }
  
  // Plain pattern, no flags
  return { pattern: trimmed, flags: '', error: null }
}

/**
 * Merge flags from input and checkbox selections
 * @param {string} inputFlags - Flags parsed from input
 * @param {string[]} selectedFlags - Flags from checkboxes
 * @returns {string}
 */
export function mergeFlags(inputFlags, selectedFlags) {
  const flagSet = new Set()
  
  // Add input flags
  for (const f of inputFlags) {
    flagSet.add(f)
  }
  
  // Add selected flags
  for (const f of selectedFlags) {
    flagSet.add(f)
  }
  
  return Array.from(flagSet).join('')
}

/**
 * Match result structure
 * @typedef {Object} MatchResult
 * @property {string} value - The matched string
 * @property {number} index - Start index
 * @property {number} endIndex - End index (exclusive)
 * @property {(string|undefined)[]} groups - Capture groups
 * @property {Object<string, string>} namedGroups - Named capture groups
 */

/**
 * Create a match result object from RegExp exec result
 * @param {RegExpExecArray} match
 * @returns {MatchResult}
 */
function createMatchResult(match) {
  const value = match[0]
  const index = match.index
  const endIndex = index + value.length
  
  // Extract groups (skip index 0 which is the full match)
  const groups = []
  for (let i = 1; i < match.length; i++) {
    groups.push(match[i])
  }
  
  // Extract named groups
  const namedGroups = /** @type {Object<string, string>} */ ({})
  if (match.groups) {
    for (const [key, val] of Object.entries(match.groups)) {
      namedGroups[key] = val
    }
  }
  
  return { value, index, endIndex, groups, namedGroups }
}

/**
 * Execute regex matching on text, line by line
 * @param {string} pattern - The regex pattern
 * @param {string} flags - The regex flags
 * @param {string} text - The text to match against
 * @returns {{ matches: MatchResult[], matchCount: number, error: string | null, lineResults: Array }}
 */
export function executeRegex(pattern, flags, text) {
  if (!pattern) {
    return { matches: [], matchCount: 0, error: null, lineResults: [] }
  }
  
  if (!text) {
    return { matches: [], matchCount: 0, error: null, lineResults: [] }
  }
  
  try {
    const allMatches = []
    const lineResults = []
    const lines = text.split('\n')
    const hasGlobal = flags.includes('g')
    
    let globalIndex = 0
    
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]
      const lineMatches = []
      
      // Create a new regex for each line to reset lastIndex
      const regex = new RegExp(pattern, flags)
      
      if (hasGlobal) {
        let match
        while ((match = regex.exec(line)) !== null) {
          const result = createMatchResult(match)
          // Adjust index to global position
          result.index += globalIndex
          result.endIndex += globalIndex
          lineMatches.push(result)
          allMatches.push(result)
          
          // Prevent infinite loop on zero-length matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++
          }
          
          // Safety limit per line
          if (lineMatches.length > 1000) {
            break
          }
        }
      } else {
        const match = regex.exec(line)
        if (match) {
          const result = createMatchResult(match)
          result.index += globalIndex
          result.endIndex += globalIndex
          lineMatches.push(result)
          allMatches.push(result)
        }
      }
      
      lineResults.push({
        line,
        lineIndex: lineIdx,
        matches: lineMatches
      })
      
      // Update global index (+1 for newline character)
      globalIndex += line.length + 1
    }
    
    return { 
      matches: allMatches, 
      matchCount: allMatches.length, 
      error: null,
      lineResults
    }
  } catch (e) {
    return { matches: [], matchCount: 0, error: e.message, lineResults: [] }
  }
}

/**
 * Format a match result for display
 * @param {MatchResult} match
 * @returns {string}
 */
export function formatMatchValue(match) {
  return match.value
}

/**
 * Get match position info
 * @param {MatchResult} match
 * @returns {string}
 */
export function formatMatchPosition(match) {
  return `${match.index}-${match.endIndex}`
}
