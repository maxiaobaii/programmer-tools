/**
 * SQL 格式化工具函数
 * 支持 Oracle / MySQL / PostgreSQL 方言
 */

// ===================== 方言关键字 =====================

/** 通用 SQL 关键字（所有方言共享） */
const COMMON_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
  'BETWEEN', 'LIKE', 'EXISTS', 'ANY', 'ALL', 'AS', 'ON', 'JOIN',
  'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'NATURAL',
  'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
  'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE',
  'FUNCTION', 'IF', 'ELSE', 'THEN', 'END', 'CASE', 'WHEN', 'BEGIN',
  'DECLARE', 'RETURN', 'RETURNS', 'FOR', 'WHILE', 'LOOP', 'EXIT',
  'UNION', 'ALL', 'INTERSECT', 'EXCEPT', 'MINUS', 'DISTINCT',
  'TOP', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'FIRST', 'LAST',
  'WITH', 'RECURSIVE', 'CTE', 'MATERIALIZED', 'LATERAL',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK',
  'DEFAULT', 'NOT', 'NULL', 'AUTO_INCREMENT', 'SERIAL', 'IDENTITY',
  'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'TRANSACTION',
  'TRUNCATE', 'RENAME', 'COMMENT', 'EXPLAIN', 'ANALYZE', 'VACUUM',
  'COPY', 'MOVE', 'LISTEN', 'NOTIFY', 'LOCK', 'UNLOCK',
  'DUAL',
])

/** 方言特定关键字 */
const DIALECT_KEYWORDS = {
  oracle: new Set([
    'ROWNUM', 'SYSDATE', 'SYSTIMESTAMP', 'LEVEL', 'CONNECT', 'PRIOR',
    'START', 'WITH', 'NOCYCLE', 'NOCACHE', 'SEQUENCE', 'TRIGGER',
    'PACKAGE', 'BODY', 'TYPE', 'RECORD', 'TABLE', 'VARRAY', 'NESTED',
    'BULK', 'COLLECT', 'FORALL', 'SAVE', 'EXCEPTIONS', 'PIPE',
    'ROW', 'ROWID', 'ROWNUM', 'ORA_ROWSCN', 'VERSIONS',
    'PIVOT', 'UNPIVOT', 'MODEL', 'DIMENSION', 'MEASURES',
    'RULES', 'UPSERT', 'MERGE', 'WHEN', 'MATCHED', 'THEN',
    'MULTISET', 'EXISTS', 'MEMBER', 'SUBMULTISET', 'OF',
    'XMLTABLE', 'XMLAGG', 'XMLPARSE', 'XMLSERIALIZE', 'XMLQUERY',
    'JSON_TABLE', 'JSON_VALUE', 'JSON_QUERY', 'JSON_EXISTS',
    'APPROX_COUNT', 'APPROX_COUNT_DISTINCT', 'APPROX_PERCENTILE',
    'LISTAGG', 'WITHIN', 'GROUP', 'OVER', 'PARTITION',
    'KEEP', 'DENSE_RANK', 'FIRST', 'LAST', 'NTH_VALUE',
    'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
    'NVL', 'NVL2', 'DECODE', 'COALESCE', 'NULLIF',
    'TO_CHAR', 'TO_DATE', 'TO_NUMBER', 'TO_TIMESTAMP',
    'TRUNC', 'ROUND', 'MONTHS_BETWEEN', 'ADD_MONTHS',
    'INSTR', 'SUBSTR', 'LENGTH', 'REPLACE', 'TRANSLATE',
    'REGEXP_LIKE', 'REGEXP_SUBSTR', 'REGEXP_REPLACE', 'REGEXP_INSTR',
    'UTL_FILE', 'DBMS_OUTPUT', 'DBMS_LOB', 'DBMS_SQL',
    'EXECUTE', 'IMMEDIATE', 'AUTHID', 'DEFINER', 'CURRENT_USER',
    'PRAGMA', 'AUTONOMOUS_TRANSACTION', 'EXCEPTION_INIT',
  ]),
  mysql: new Set([
    'AUTO_INCREMENT', 'ENGINE', 'CHARSET', 'COLLATE', 'COMMENT',
    'IF', 'NOT', 'EXISTS', 'REPLACE', 'IGNORE', 'DELAYED',
    'LOW_PRIORITY', 'HIGH_PRIORITY', 'QUICK', 'EXTENDED',
    'SQL_CALC_FOUND_ROWS', 'SQL_CACHE', 'SQL_NO_CACHE',
    'LOCK', 'UNLOCK', 'TABLES', 'READ', 'WRITE', 'LOCAL',
    'SESSION', 'GLOBAL', 'PERSIST', 'ONLY', 'VARIABLES',
    'SHOW', 'DESCRIBE', 'EXPLAIN', 'ANALYZE', 'OPTIMIZE',
    'REPAIR', 'CHECK', 'CHECKSUM', 'FLUSH', 'RESET', 'PURGE',
    'MASTER', 'SLAVE', 'REPLICA', 'BINLOG', 'RELAY',
    'GRANT', 'REVOKE', 'CREATE', 'USER', 'IDENTIFIED',
    'PASSWORD', 'EXPIRE', 'ACCOUNT', 'LOCK', 'UNLOCK',
    'TRIGGER', 'BEFORE', 'AFTER', 'FOR', 'EACH', 'ROW',
    'PROCEDURE', 'FUNCTION', 'EVENT', 'SCHEDULE', 'EVERY',
    'STARTS', 'ENDS', 'ON', 'COMPLETION', 'PRESERVE',
    'DECLARE', 'CONDITION', 'HANDLER', 'CONTINUE', 'EXIT',
    'UNDO', 'SQLSTATE', 'SQLWARNING', 'NOT', 'FOUND',
    'SIGNAL', 'RESIGNAL', 'SET', 'GET', 'DIAGNOSTICS',
    'PREPARE', 'EXECUTE', 'DEALLOCATE', 'PREPARE',
    'GROUP_REPLICATION', 'CLONE', 'PLUGIN', 'INSTALL',
    'UNINSTALL', 'LOAD', 'INFILE', 'OUTFILE', 'FIELDS',
    'TERMINATED', 'ENCLOSED', 'ESCAPED', 'LINES', 'STARTING',
    'JSON_ARRAY', 'JSON_OBJECT', 'JSON_EXTRACT', 'JSON_SET',
    'JSON_REPLACE', 'JSON_REMOVE', 'JSON_CONTAINS', 'JSON_SEARCH',
    'JSON_KEYS', 'JSON_LENGTH', 'JSON_TYPE', 'JSON_VALID',
    'JSON_PRETTY', 'JSON_UNQUOTE', 'JSON_TABLE',
    'ST_', 'POINT', 'LINESTRING', 'POLYGON', 'GEOMETRY',
    'SPATIAL', 'INDEX', 'RTREE', 'GIST', 'GEOGRAPHY',
  ]),
  postgresql: new Set([
    'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'IDENTITY', 'GENERATED',
    'ALWAYS', 'BY', 'DEFAULT', 'AS', 'STORED', 'VIRTUAL',
    'RETURNING', 'CONFLICT', 'DO', 'NOTHING', 'UPDATE', 'SET',
    'EXCLUDED', 'USING', 'WITH', 'ORDINALITY', 'LATERAL',
    'RECURSIVE', 'CYCLE', 'NO', 'CACHE', 'INCREMENT', 'MINVALUE',
    'MAXVALUE', 'START', 'OWNED', 'NONE', 'SEQUENCE',
    'MATERIALIZED', 'CONCURRENTLY', 'REFRESH', 'VIEW',
    'TRIGGER', 'BEFORE', 'AFTER', 'INSTEAD', 'OF', 'EACH',
    'ROW', 'STATEMENT', 'WHEN', 'EXECUTE', 'FUNCTION', 'PROCEDURE',
    'RETURNS', 'TRIGGER', 'LANGUAGE', 'PLPGSQL', 'SQL', 'C',
    'IMMUTABLE', 'STABLE', 'VOLATILE', 'STRICT', 'SECURITY',
    'DEFINER', 'INVOKER', 'CALLED', 'INPUT', 'PARALLEL',
    'SAFE', 'UNSAFE', 'RESTRICTED', 'COST', 'ROWS',
    'SUPPORT', 'TRANSFORM', 'TYPE', 'COMPOSITE', 'ENUM',
    'DOMAIN', 'CONSTRAINT', 'NOT', 'NULL', 'CHECK', 'EXCLUDE',
    'USING', 'GIST', 'GIN', 'BRIN', 'HASH', 'BTREE',
    'TABLESPACE', 'INHERITS', 'INHERIT', 'NO', 'EXCLUDE',
    'PARTITION', 'RANGE', 'LIST', 'HASH', 'FOR', 'VALUES',
    'DEFAULT', 'DETACH', 'ATTACH', 'FOREVER', 'OPERATOR',
    'CLASS', 'FAMILY', 'ACCESS', 'METHOD', 'OPERATOR',
    'COLLATION', 'ENCODING', 'LC_COLLATE', 'LC_CTYPE',
    'TEMPLATE', 'STRATEGY', 'DETERMINISTIC',
    'JSONB', 'JSON', 'JSON_ARRAY', 'JSON_OBJECT', 'JSON_BUILD_ARRAY',
    'JSON_BUILD_OBJECT', 'JSON_AGG', 'JSON_OBJECT_AGG',
    'JSONB_AGG', 'JSONB_OBJECT_AGG', 'JSON_EXTRACT_PATH',
    'JSONB_EXTRACT_PATH', 'JSON_ARRAY_LENGTH', 'JSONB_ARRAY_LENGTH',
    'JSON_EACH', 'JSONB_EACH', 'JSON_EACH_TEXT', 'JSONB_EACH_TEXT',
    'JSON_OBJECT_KEYS', 'JSONB_OBJECT_KEYS', 'JSON_TYPEOF',
    'JSONB_TYPEOF', 'JSON_TO_RECORD', 'JSON_TO_RECORDSET',
    'JSON_STRIP_NULLS', 'JSONB_STRIP_NULLS', 'JSON_PRETTY',
    'ILIKE', 'SIMILAR', 'REGEXP_REPLACE', 'REGEXP_MATCHES',
    'REGEXP_SPLIT_TO_TABLE', 'REGEXP_SPLIT_TO_ARRAY',
    'STRING_AGG', 'ARRAY_AGG', 'XMLAGG', 'JSON_AGG',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'EVERY', 'BOOL_AND',
    'BOOL_OR', 'BIT_AND', 'BIT_OR', 'ARRAY', 'UNNEST',
    'GENERATE_SERIES', 'GENERATE_SUBSCRIPTS',
    'WINDOW', 'RANGE', 'ROWS', 'GROUPS', 'UNBOUNDED',
    'PRECEDING', 'FOLLOWING', 'CURRENT', 'ROW', 'TIES',
    'EXCLUDE', 'OTHERS', 'CURRENT', 'GROUP', 'TIES',
    'LISTEN', 'NOTIFY', 'ADVISORY', 'LOCK', 'UNLOCK',
    'EXPLAIN', 'ANALYZE', 'VERBOSE', 'COSTS', 'BUFFERS',
    'TIMING', 'SUMMARY', 'FORMAT', 'TEXT', 'XML', 'JSON',
    'YAML', 'TRADITIONAL', 'BRIEF', 'EXTENDED',
  ]),
}

/** 新行关键字：这些关键字前面插入换行并重置缩进 */
const NEWLINE_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER',
  'LIMIT', 'OFFSET', 'FETCH', 'UNION', 'INTERSECT', 'EXCEPT',
  'MINUS', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER',
  'DROP', 'TRUNCATE', 'WITH', 'SET', 'VALUES', 'INTO',
  'ON', 'USING',
])

/** 缩进关键字：这些关键字后面的子句增加一级缩进 */
const INDENT_AFTER_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER',
  'SET', 'VALUES',
])

/** 子查询开括号 */
const SUBQUERY_OPEN = new Set(['(', 'CASE'])

/** 子查询闭括号 */
const SUBQUERY_CLOSE = new Set([')', 'END'])

// ===================== 词法分析 =====================

/**
 * SQL 词法分析器
 * @param {string} sql SQL 语句
 * @param {string} dialect 方言：oracle / mysql / postgresql
 * @returns {Array<{ type: string, value: string }>} token 列表
 */
export function tokenize (sql, dialect = 'mysql') {
  const tokens = []
  let i = 0
  const len = sql.length
  const allKeywords = new Set([...COMMON_KEYWORDS, ...(DIALECT_KEYWORDS[dialect] || [])])

  while (i < len) {
    const ch = sql[i]

    // 空白字符
    if (/\s/.test(ch)) {
      let start = i
      while (i < len && /\s/.test(sql[i])) i++
      tokens.push({ type: 'whitespace', value: sql.slice(start, i) })
      continue
    }

    // 单行注释 --
    if (ch === '-' && i + 1 < len && sql[i + 1] === '-') {
      let start = i
      i += 2
      while (i < len && sql[i] !== '\n') i++
      tokens.push({ type: 'comment', value: sql.slice(start, i) })
      continue
    }

    // 单行注释 #（MySQL）
    if (ch === '#' && dialect === 'mysql') {
      let start = i
      i++
      while (i < len && sql[i] !== '\n') i++
      tokens.push({ type: 'comment', value: sql.slice(start, i) })
      continue
    }

    // 多行注释 /* ... */
    if (ch === '/' && i + 1 < len && sql[i + 1] === '*') {
      let start = i
      i += 2
      while (i + 1 < len && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i += 2
      tokens.push({ type: 'comment', value: sql.slice(start, i) })
      continue
    }

    // 单引号字符串
    if (ch === "'") {
      let start = i
      i++
      while (i < len) {
        if (sql[i] === "'" && i + 1 < len && sql[i + 1] === "'") {
          i += 2 // 转义的单引号 ''
        } else if (sql[i] === '\\') {
          i += 2 // 反斜杠转义
        } else if (sql[i] === "'") {
          i++
          break
        } else {
          i++
        }
      }
      tokens.push({ type: 'string', value: sql.slice(start, i) })
      continue
    }

    // 双引号标识符（Oracle/PostgreSQL）或字符串（MySQL ANSI_QUOTES）
    if (ch === '"') {
      let start = i
      i++
      while (i < len) {
        if (sql[i] === '"' && i + 1 < len && sql[i + 1] === '"') {
          i += 2
        } else if (sql[i] === '"') {
          i++
          break
        } else {
          i++
        }
      }
      tokens.push({ type: 'identifier', value: sql.slice(start, i) })
      continue
    }

    // 反引号标识符（MySQL）
    if (ch === '`' && dialect === 'mysql') {
      let start = i
      i++
      while (i < len) {
        if (sql[i] === '`' && i + 1 < len && sql[i + 1] === '`') {
          i += 2
        } else if (sql[i] === '`') {
          i++
          break
        } else {
          i++
        }
      }
      tokens.push({ type: 'identifier', value: sql.slice(start, i) })
      continue
    }

    // 数字
    if (/[0-9]/.test(ch)) {
      let start = i
      while (i < len && /[0-9.]/.test(sql[i])) i++
      // 科学计数法
      if (i < len && (sql[i] === 'e' || sql[i] === 'E')) {
        i++
        if (i < len && (sql[i] === '+' || sql[i] === '-')) i++
        while (i < len && /[0-9]/.test(sql[i])) i++
      }
      tokens.push({ type: 'number', value: sql.slice(start, i) })
      continue
    }

    // 标识符或关键字
    if (/[a-zA-Z_]/.test(ch)) {
      let start = i
      while (i < len && /[a-zA-Z0-9_$]/.test(sql[i])) i++
      const word = sql.slice(start, i)
      const upper = word.toUpperCase()
      if (allKeywords.has(upper)) {
        tokens.push({ type: 'keyword', value: upper, original: word })
      } else {
        tokens.push({ type: 'identifier', value: word })
      }
      continue
    }

    // 逗号
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',' })
      i++
      continue
    }

    // 分号
    if (ch === ';') {
      tokens.push({ type: 'semicolon', value: ';' })
      i++
      continue
    }

    // 点号
    if (ch === '.') {
      tokens.push({ type: 'dot', value: '.' })
      i++
      continue
    }

    // 括号
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch })
      i++
      continue
    }

    // 运算符
    if (/[+\-*/%!=<>|&^~]/.test(ch)) {
      let start = i
      // 多字符运算符
      if (ch === '!' && i + 1 < len && sql[i + 1] === '=') { i += 2 }
      else if (ch === '<' && i + 1 < len && sql[i + 1] === '=') { i += 2 }
      else if (ch === '>' && i + 1 < len && sql[i + 1] === '=') { i += 2 }
      else if (ch === '<' && i + 1 < len && sql[i + 1] === '>') { i += 2 }
      else if (ch === '|' && i + 1 < len && sql[i + 1] === '|') { i += 2 }
      else if (ch === ':' && i + 1 < len && sql[i + 1] === ':') { i += 2 }
      else { i++ }
      tokens.push({ type: 'operator', value: sql.slice(start, i) })
      continue
    }

    // 其他字符（: @ $ 等）
    tokens.push({ type: 'other', value: ch })
    i++
  }

  return tokens
}

// ===================== 格式化 =====================

/**
 * 格式化 SQL 语句
 * @param {string} sql 原始 SQL
 * @param {object} options 选项
 * @param {string} options.dialect 方言：oracle / mysql / postgresql
 * @param {number} options.indentSize 缩进空格数
 * @param {number} options.maxLineLength 最大行长度（用于换行判断）
 * @param {boolean} options.uppercaseKeywords 是否将关键字大写
 * @returns {{ ok: boolean, value?: string, error?: string }}
 */
export function formatSql (sql, options = {}) {
  const {
    dialect = 'mysql',
    indentSize = 2,
    maxLineLength = 80,
    uppercaseKeywords = true,
  } = options

  try {
    if (!sql || !sql.trim()) {
      return { ok: true, value: '' }
    }

    const tokens = tokenize(sql, dialect)
    const result = []
    let indent = 0
    let lastWasNewline = false
    let lastWasComma = false
    let lastWasOperator = false
    let parenDepth = 0

    const indentStr = () => ' '.repeat(indent * indentSize)

    // 过滤掉原始空白和注释，保留有意义的 token
    const meaningful = tokens.filter(t => t.type !== 'whitespace' && t.type !== 'comment')

    for (let idx = 0; idx < meaningful.length; idx++) {
      const token = meaningful[idx]
      const upper = token.value.toUpperCase()

      // 关键字处理
      if (token.type === 'keyword') {
        const display = uppercaseKeywords ? token.value : (token.original || token.value)

        // 新行关键字
        if (NEWLINE_KEYWORDS.has(upper)) {
          // 特殊处理 GROUP BY, ORDER BY —— BY 本身不换行
          if (upper === 'BY') {
            result.push(' ')
            result.push(display)
            lastWasNewline = false
            continue
          }

          // 特殊处理 LEFT/RIGHT/FULL/INNER/CROSS JOIN
          if (['LEFT', 'RIGHT', 'FULL', 'INNER', 'CROSS', 'NATURAL'].includes(upper)) {
            // 检查后面是否跟 JOIN
            const nextMeaningful = findNextMeaningful(meaningful, idx)
            if (nextMeaningful && nextMeaningful.value.toUpperCase() === 'JOIN') {
              if (!lastWasNewline) {
                result.push('\n')
                result.push(indentStr())
              }
              result.push(display)
              lastWasNewline = false
              continue
            }
          }

          // JOIN 关键字
          if (upper === 'JOIN') {
            // 如果前面已经有 LEFT/RIGHT 等，不需要换行
            if (!lastWasNewline) {
              result.push('\n')
              result.push(indentStr())
            }
            result.push(display)
            lastWasNewline = false
            continue
          }

          // ON 关键字（在 JOIN 条件中）
          if (upper === 'ON') {
            if (!lastWasNewline) {
              result.push('\n')
              result.push(indentStr() + ' '.repeat(indentSize))
            }
            result.push(display)
            lastWasNewline = false
            continue
          }

          // 普通新行关键字
          if (result.length > 0 && !lastWasNewline) {
            result.push('\n')
          }
          result.push(indentStr())
          result.push(display)
          lastWasNewline = false
          continue
        }

        // AND/OR —— 新行
        if (upper === 'AND' || upper === 'OR') {
          if (!lastWasNewline) {
            result.push('\n')
            result.push(indentStr() + ' '.repeat(indentSize))
          }
          result.push(display)
          lastWasNewline = false
          continue
        }

        // CASE / WHEN / ELSE / END —— 增加缩进
        if (upper === 'CASE') {
          if (!lastWasNewline) {
            result.push(' ')
          }
          result.push(display)
          indent++
          lastWasNewline = false
          continue
        }

        if (upper === 'WHEN' || upper === 'ELSE') {
          result.push('\n')
          result.push(indentStr())
          result.push(display)
          lastWasNewline = false
          continue
        }

        if (upper === 'END') {
          indent = Math.max(0, indent - 1)
          result.push('\n')
          result.push(indentStr())
          result.push(display)
          lastWasNewline = false
          continue
        }

        // THEN —— 同行
        if (upper === 'THEN') {
          result.push(' ')
          result.push(display)
          lastWasNewline = false
          continue
        }

        // AS —— 同行
        if (upper === 'AS') {
          result.push(' ')
          result.push(display)
          lastWasNewline = false
          continue
        }

        // 其他关键字
        if (result.length > 0 && !lastWasNewline && !lastWasOperator) {
          result.push(' ')
        }
        result.push(display)
        lastWasNewline = false
        continue
      }

      // 逗号
      if (token.type === 'comma') {
        result.push(',')
        result.push('\n')
        result.push(indentStr() + ' '.repeat(indentSize))
        lastWasNewline = true
        lastWasComma = true
        continue
      }

      // 分号
      if (token.type === 'semicolon') {
        result.push(';')
        // 分号后换行（如果有后续语句）
        if (idx < meaningful.length - 1) {
          result.push('\n\n')
          indent = 0
          lastWasNewline = true
        }
        continue
      }

      // 开括号
      if (token.type === 'paren' && token.value === '(') {
        // 检查是否是子查询（前面是关键字或标识符）
        const prev = findPrevMeaningful(meaningful, idx)
        const isSubquery = prev && (
          prev.type === 'keyword' && ['IN', 'EXISTS', 'FROM', 'WHERE', 'SELECT', 'JOIN', 'ON', 'VALUES'].includes(prev.value.toUpperCase())
        )

        result.push('(')
        parenDepth++

        if (isSubquery) {
          indent++
          result.push('\n')
          result.push(indentStr())
          lastWasNewline = true
        }
        continue
      }

      // 闭括号
      if (token.type === 'paren' && token.value === ')') {
        parenDepth--
        const next = findNextMeaningful(meaningful, idx)
        const prev = findPrevMeaningful(meaningful, idx)

        // 检查是否是 CASE ... END ) 的情况
        if (prev && prev.value.toUpperCase() === 'END') {
          indent = Math.max(0, indent - 1)
        }

        if (indent > 0) {
          indent--
          result.push('\n')
          result.push(indentStr())
        }
        result.push(')')
        lastWasNewline = false
        continue
      }

      // 点号
      if (token.type === 'dot') {
        result.push('.')
        lastWasNewline = false
        continue
      }

      // 运算符
      if (token.type === 'operator') {
        if (result.length > 0 && !lastWasNewline) {
          result.push(' ')
        }
        result.push(token.value)
        result.push(' ')
        lastWasNewline = false
        lastWasOperator = true
        continue
      }

      // 其他 token（标识符、字符串、数字等）
      if (result.length > 0 && !lastWasNewline && !lastWasOperator) {
        result.push(' ')
      }
      result.push(token.value)
      lastWasNewline = false
      lastWasOperator = false
      lastWasComma = false
    }

    return { ok: true, value: result.join('').trim() }
  } catch (e) {
    return { ok: false, error: e.message || '格式化失败' }
  }
}

/**
 * 压缩 SQL 语句（去除多余空白和注释）
 * @param {string} sql 原始 SQL
 * @param {object} options 选项
 * @param {string} options.dialect 方言
 * @param {boolean} options.uppercaseKeywords 是否将关键字大写
 * @returns {{ ok: boolean, value?: string, error?: string }}
 */
export function compressSql (sql, options = {}) {
  const {
    dialect = 'mysql',
    uppercaseKeywords = true,
  } = options

  try {
    if (!sql || !sql.trim()) {
      return { ok: true, value: '' }
    }

    const tokens = tokenize(sql, dialect)
    const result = []

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]

      // 跳过空白和注释
      if (token.type === 'whitespace' || token.type === 'comment') {
        continue
      }

      // 关键字大写
      if (token.type === 'keyword') {
        result.push(uppercaseKeywords ? token.value.toUpperCase() : token.value)
        continue
      }

      result.push(token.value)
    }

    // 重新插入必要的空白（关键字之间、标识符之间）
    const compressed = []
    for (let i = 0; i < result.length; i++) {
      const curr = result[i]
      const prev = i > 0 ? result[i - 1] : ''

      // 需要在两个 token 之间插入空格的情况
      if (prev && needsSpaceBetween(prev, curr)) {
        compressed.push(' ')
      }

      compressed.push(curr)
    }

    return { ok: true, value: compressed.join('') }
  } catch (e) {
    return { ok: false, error: e.message || '压缩失败' }
  }
}

/**
 * 校验 SQL 语法
 * @param {string} sql SQL 语句
 * @param {object} options 选项
 * @param {string} options.dialect 方言：oracle / mysql / postgresql
 * @returns {{ valid: boolean, errors: Array<{ line: number, column: number, message: string, severity: 'error' | 'warning' }>, summary: string }}
 */
export function validateSql (sql, options = {}) {
  const { dialect = 'mysql' } = options
  const errors = []

  if (!sql || !sql.trim()) {
    return { valid: true, errors: [], summary: 'SQL 为空' }
  }

  const tokens = tokenize(sql, dialect)
  const meaningful = tokens.filter(t => t.type !== 'whitespace' && t.type !== 'comment')

  // 计算行号和列号的辅助函数
  function getTokenPosition (tokenIdx) {
    let line = 1
    let column = 1
    let meaningfulCount = 0
    for (const token of tokens) {
      if (token.type !== 'whitespace' && token.type !== 'comment') {
        if (meaningfulCount === tokenIdx) {
          return { line, column }
        }
        meaningfulCount++
      }
      for (const ch of token.value) {
        if (ch === '\n') {
          line++
          column = 1
        } else {
          column++
        }
      }
    }
    return { line, column }
  }

  // 跟踪括号嵌套
  let parenDepth = 0
  let lastOpenParenIdx = -1

  // 跟踪语句结构
  let hasSelect = false
  let hasFrom = false
  let hasWhere = false
  let hasInsert = false
  let hasInto = false
  let hasUpdate = false
  let hasDelete = false
  let hasCreate = false
  let hasDrop = false
  let hasValues = false

  // 跟踪上一个有意义的 token
  let prevMeaningful = null
  let prevPrevMeaningful = null

  for (let idx = 0; idx < meaningful.length; idx++) {
    const token = meaningful[idx]
    const upper = token.value.toUpperCase()

    // 检查括号匹配
    if (token.type === 'paren') {
      if (token.value === '(') {
        parenDepth++
        lastOpenParenIdx = idx
      } else if (token.value === ')') {
        if (parenDepth <= 0) {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: '多余的右括号 ")"',
            severity: 'error'
          })
        } else {
          parenDepth--
        }
      }
    }

    // 检查语句结构
    if (token.type === 'keyword') {
      switch (upper) {
        case 'SELECT':
          hasSelect = true
          break
        case 'FROM':
          hasFrom = true
          break
        case 'WHERE':
          hasWhere = true
          break
        case 'INSERT':
          hasInsert = true
          break
        case 'INTO':
          hasInto = true
          break
        case 'UPDATE':
          hasUpdate = true
          break
        case 'DELETE':
          hasDelete = true
          break
        case 'CREATE':
          hasCreate = true
          break
        case 'DROP':
          hasDrop = true
          break
        case 'VALUES':
          hasValues = true
          break
      }

      // 检查 SELECT 后是否缺少列名
      if (upper === 'SELECT' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type === 'keyword' && next.value.toUpperCase() === 'FROM') {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'SELECT 后缺少列名',
            severity: 'error'
          })
        }
      }

      // 检查 FROM 后是否缺少表名
      if (upper === 'FROM' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type === 'keyword' && !['SELECT', '(', 'WITH', 'DUAL'].includes(next.value.toUpperCase())) {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'FROM 后缺少表名',
            severity: 'error'
          })
        }
      }

      // 检查 JOIN 后是否缺少表名
      if (upper === 'JOIN' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type === 'keyword' && !['ON', 'USING', '('].includes(next.value.toUpperCase())) {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'JOIN 后缺少表名',
            severity: 'error'
          })
        }
      }

      // 检查 ON 后是否有条件
      if (upper === 'ON' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type === 'keyword' && ['WHERE', 'GROUP', 'ORDER', 'LIMIT', 'HAVING', 'UNION', 'JOIN'].includes(next.value.toUpperCase())) {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'ON 后缺少连接条件',
            severity: 'error'
          })
        }
      }

      // 检查 WHERE 后是否有条件
      if (upper === 'WHERE' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type === 'keyword' && ['GROUP', 'ORDER', 'LIMIT', 'HAVING', 'UNION'].includes(next.value.toUpperCase())) {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'WHERE 后缺少条件表达式',
            severity: 'error'
          })
        }
      }

      // 检查 ORDER BY / GROUP BY 后是否有列名
      if (upper === 'BY' && prevMeaningful && ['ORDER', 'GROUP'].includes(prevMeaningful.value.toUpperCase())) {
        if (idx + 1 < meaningful.length) {
          const next = meaningful[idx + 1]
          if (next.type === 'keyword' && ['LIMIT', 'HAVING', 'UNION', 'FOR'].includes(next.value.toUpperCase())) {
            const pos = getTokenPosition(idx)
            errors.push({
              line: pos.line,
              column: pos.column,
              message: `${prevMeaningful.value.toUpperCase()} BY 后缺少列名`,
              severity: 'error'
            })
          }
        }
      }

      // 检查 INSERT INTO 后是否有表名
      if (upper === 'INSERT' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type !== 'keyword' || next.value.toUpperCase() !== 'INTO') {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'INSERT 后缺少 INTO 关键字',
            severity: 'warning'
          })
        }
      }

      // 检查 UPDATE 后是否有表名
      if (upper === 'UPDATE' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type === 'keyword' && ['SET', 'WHERE'].includes(next.value.toUpperCase())) {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'UPDATE 后缺少表名',
            severity: 'error'
          })
        }
      }

      // 检查 SET 后是否有赋值
      if (upper === 'SET' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type === 'keyword' && ['WHERE', 'ORDER', 'LIMIT'].includes(next.value.toUpperCase())) {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'SET 后缺少赋值表达式',
            severity: 'error'
          })
        }
      }

      // 检查 DELETE FROM 后是否有表名
      if (upper === 'DELETE' && idx + 1 < meaningful.length) {
        const next = meaningful[idx + 1]
        if (next.type !== 'keyword' || next.value.toUpperCase() !== 'FROM') {
          const pos = getTokenPosition(idx)
          errors.push({
            line: pos.line,
            column: pos.column,
            message: 'DELETE 后缺少 FROM 关键字',
            severity: 'warning'
          })
        }
      }
    }

    // 检查连续的运算符
    if (token.type === 'operator' && prevMeaningful && prevMeaningful.type === 'operator') {
      const pos = getTokenPosition(idx)
      errors.push({
        line: pos.line,
        column: pos.column,
        message: `连续的运算符 "${prevMeaningful.value}${token.value}"`,
        severity: 'warning'
      })
    }

    // 检查逗号后是否缺少表达式
    if (token.type === 'comma' && idx + 1 < meaningful.length) {
      const next = meaningful[idx + 1]
      if (next.type === 'keyword' && ['FROM', 'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'HAVING', 'UNION'].includes(next.value.toUpperCase())) {
        const pos = getTokenPosition(idx)
        errors.push({
          line: pos.line,
          column: pos.column,
          message: '逗号后缺少表达式',
          severity: 'error'
        })
      }
    }

    // 检查分号位置
    if (token.type === 'semicolon' && idx + 1 < meaningful.length) {
      const next = meaningful[idx + 1]
      if (next.type === 'semicolon') {
        const pos = getTokenPosition(idx)
        errors.push({
          line: pos.line,
          column: pos.column,
          message: '连续的分号',
          severity: 'warning'
        })
      }
    }

    prevPrevMeaningful = prevMeaningful
    prevMeaningful = token
  }

  // 检查未闭合的括号
  if (parenDepth > 0) {
    const pos = getTokenPosition(lastOpenParenIdx)
    errors.push({
      line: pos.line,
      column: pos.column,
      message: `未闭合的左括号 "("（还差 ${parenDepth} 个右括号）`,
      severity: 'error'
    })
  }

  // 检查语句完整性
  if (hasSelect && !hasFrom) {
    // 可能是 SELECT 1 这种简单查询，给出警告
    const selectIdx = meaningful.findIndex(t => t.type === 'keyword' && t.value === 'SELECT')
    if (selectIdx >= 0) {
      // 检查是否有 FROM（可能是子查询中）
      const hasSubqueryFrom = meaningful.some((t, i) => i > selectIdx && t.type === 'keyword' && t.value === 'FROM')
      if (!hasSubqueryFrom) {
        const pos = getTokenPosition(selectIdx)
        errors.push({
          line: pos.line,
          column: pos.column,
          message: 'SELECT 语句缺少 FROM 子句（如果不需要表请忽略此警告）',
          severity: 'warning'
        })
      }
    }
  }

  if (hasInsert && !hasInto) {
    const insertIdx = meaningful.findIndex(t => t.type === 'keyword' && t.value === 'INSERT')
    if (insertIdx >= 0) {
      const pos = getTokenPosition(insertIdx)
      errors.push({
        line: pos.line,
        column: pos.column,
        message: 'INSERT 语句缺少 INTO 子句（如果不需要请忽略此警告）',
        severity: 'warning'
      })
    }
  }

  if (hasInsert && hasInto && !hasValues) {
    const insertIdx = meaningful.findIndex(t => t.type === 'keyword' && t.value === 'INSERT')
    if (insertIdx >= 0) {
      const pos = getTokenPosition(insertIdx)
      errors.push({
        line: pos.line,
        column: pos.column,
        message: 'INSERT 语句缺少 VALUES 子句',
        severity: 'error'
      })
    }
  }

  if (hasDelete && !hasFrom) {
    const deleteIdx = meaningful.findIndex(t => t.type === 'keyword' && t.value === 'DELETE')
    if (deleteIdx >= 0) {
      const pos = getTokenPosition(deleteIdx)
      errors.push({
        line: pos.line,
        column: pos.column,
        message: 'DELETE 语句缺少 FROM 子句（如果不需要请忽略此警告）',
        severity: 'warning'
      })
    }
  }

  // 生成摘要
  const errorCount = errors.filter(e => e.severity === 'error').length
  const warningCount = errors.filter(e => e.severity === 'warning').length

  let summary = ''
  if (errorCount === 0 && warningCount === 0) {
    summary = '✅ SQL 语法正确'
  } else if (errorCount === 0) {
    summary = `⚠️ 发现 ${warningCount} 个警告`
  } else {
    summary = `❌ 发现 ${errorCount} 个错误，${warningCount} 个警告`
  }

  return {
    valid: errorCount === 0,
    errors,
    summary
  }
}

/**
 * 计算 SQL 格式化前后的统计信息
 * @param {string} input 输入 SQL
 * @param {string} output 输出 SQL
 * @returns {{ inputBytes: number, outputBytes: number, inputLines: number, outputLines: number }}
 */
export function computeStats (input, output) {
  const encoder = new TextEncoder()
  const inputBytes = encoder.encode(input).byteLength
  const outputBytes = encoder.encode(output).byteLength
  const inputLines = input.split('\n').length
  const outputLines = output.split('\n').length
  return { inputBytes, outputBytes, inputLines, outputLines }
}

// ===================== 内部工具 =====================

/**
 * 查找下一个有意义的 token
 * @param {Array} tokens
 * @param {number} currentIdx
 * @returns {{ type: string, value: string } | null}
 */
function findNextMeaningful (tokens, currentIdx) {
  for (let i = currentIdx + 1; i < tokens.length; i++) {
    if (tokens[i].type !== 'whitespace' && tokens[i].type !== 'comment') {
      return tokens[i]
    }
  }
  return null
}

/**
 * 查找前一个有意义的 token
 * @param {Array} tokens
 * @param {number} currentIdx
 * @returns {{ type: string, value: string } | null}
 */
function findPrevMeaningful (tokens, currentIdx) {
  for (let i = currentIdx - 1; i >= 0; i--) {
    if (tokens[i].type !== 'whitespace' && tokens[i].type !== 'comment') {
      return tokens[i]
    }
  }
  return null
}

/**
 * 判断两个 token 之间是否需要空格
 * @param {string} prev 前一个 token 值
 * @param {string} curr 当前 token 值
 * @returns {boolean}
 */
function needsSpaceBetween (prev, curr) {
  const noSpaceBefore = new Set(['(', ')', ';', '.'])
  const noSpaceAfter = new Set(['(', ')', ';', '.'])

  if (noSpaceBefore.has(curr) || noSpaceAfter.has(prev)) {
    return false
  }

  // 逗号后面需要空格
  if (prev === ',') {
    return true
  }

  // 运算符周围需要空格
  const isOp = (s) => /^[+\-*/%!=<>|&^~]+$/.test(s)
  if (isOp(prev) || isOp(curr)) {
    return true
  }

  // 两个字母/数字/下划线序列之间需要空格
  const isAlphaNum = (s) => /^[a-zA-Z0-9_$]$/.test(s)
  const lastPrev = prev[prev.length - 1]
  const firstCurr = curr[0]

  if (isAlphaNum(lastPrev) && isAlphaNum(firstCurr)) {
    return true
  }

  return false
}
