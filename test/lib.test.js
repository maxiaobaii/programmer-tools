import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { validateJsonSchema, isJsonType } from '../src/lib/schema.js'
import { generateTypescript } from '../src/lib/types.js'
import { generateJavaTypes } from '../src/lib/java.js'
import { diffJsonValues, summarizeDiff, formatDiffValue, buildAnnotatedSides } from '../src/lib/diff.js'
import { parseByFormat, stringifyByFormat, getFormatExtension } from '../src/lib/convert.js'
import { readClipboardText, downloadTextFile, pickTextFile } from '../src/lib/io.js'
import { createEditorResetState, resetEditorWithValue } from '../src/lib/editorState.js'
import { getViewportInfo, PHONE_MAX_WIDTH, PAD_MAX_WIDTH } from '../src/lib/viewport.js'
import { tools } from '../src/data/tools.js'
import { highlightJava, copyText } from '../src/utils.js'
import { parseTimestampInput, convertTimestampToDateTimes, convertDateTimeToTimestamps, formatDateTimeParts } from '../src/lib/timestamp.js'
import {
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
  addLineBreaks,
  stripWhitespace,
  validateBase64,
  validateBase64Url,
  computeStats,
} from '../src/lib/base64.js'
import {
  encodeUrl,
  encodeUrlComponent,
  encodeQueryParams,
  decodeUrl,
  decodeUrlComponent,
  decodeQueryParams,
  computeStats as computeUrlStats,
} from '../src/lib/url.js'
import {
  formatSql,
  compressSql,
  tokenize,
  computeStats as computeSqlStats,
} from '../src/lib/sql.js'
import { diffText, summarizeDiffStats, formatDiffAsText } from '../src/lib/text-diff.js'


test('isJsonType supports array, null and integer', () => {
  assert.equal(isJsonType([], 'array'), true)
  assert.equal(isJsonType(null, 'null'), true)
  assert.equal(isJsonType(3, 'integer'), true)
  assert.equal(isJsonType(3.2, 'integer'), false)
})

test('validateJsonSchema reports nested schema errors with paths and rules', () => {
  const value = {
    name: 'A',
    age: -1,
    tags: ['ok', 2],
    extra: true,
  }

  const schema = {
    type: 'object',
    required: ['name', 'age'],
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 2 },
      age: { type: 'number', minimum: 0 },
      tags: { type: 'array', items: { type: 'string' } },
    },
  }

  const result = validateJsonSchema(value, schema)

  assert.equal(result.ok, false)
  assert.deepEqual(
    result.errors.map((item) => ({ path: item.path, rule: item.rule })),
    [
      { path: 'root.name', rule: 'minLength' },
      { path: 'root.age', rule: 'minimum' },
      { path: 'root.tags[1]', rule: 'type' },
      { path: 'root.extra', rule: 'additionalProperties' },
    ]
  )
})

test('generateTypescript merges heterogeneous object arrays into optional union fields', () => {
  const source = [
    { id: 1, name: '张三', 'user-name': 'zhangsan', score: null },
    { id: 2, name: null, active: true },
  ]

  const output = generateTypescript(source)

  assert.match(output, /interface RootItem/)
  assert.match(output, /id: number/)
  assert.match(output, /name: null \| string|string \| null/)
  assert.match(output, /'user-name'\?: string/)
  assert.match(output, /active\?: boolean/)
  assert.match(output, /score\?: null/)
  assert.match(output, /export type Root = RootItem\[]/)
})

test('generateJavaTypes supports pojo and lombok styles with separate top-level child classes and JsonProperty', () => {
  const source = {
    id: 1,
    name: '张三',
    'user-name': 'zhangsan',
    tags: [{ label: 'vip' }],
    profile: { active: true },
  }

  const pojo = generateJavaTypes(source, { style: 'pojo', rootName: 'UserProfile' })
  const lombok = generateJavaTypes(source, { style: 'lombok', rootName: 'UserProfile' })

  assert.match(pojo, /import java\.util\.List;/)
  assert.match(pojo, /import com\.fasterxml\.jackson\.annotation\.JsonProperty;/)
  assert.match(pojo, /public class UserProfile/)
  assert.match(pojo, /private Integer id;/)
  assert.match(pojo, /@JsonProperty\("user-name"\)/)
  assert.match(pojo, /private String userName;/)
  assert.match(pojo, /private UserProfileProfile profile;/)
  assert.match(pojo, /private List<UserProfileTagsItem> tags;/)
  assert.match(pojo, /public class UserProfileProfile/)
  assert.match(pojo, /public class UserProfileTagsItem/)
  assert.doesNotMatch(pojo, /public static class/)
  assert.match(pojo, /public Integer getId\(\)/)
  assert.doesNotMatch(pojo, /@Data/)

  assert.match(lombok, /import lombok\.Data;/)
  assert.match(lombok, /@Data/)
  assert.match(lombok, /public class UserProfileProfile/)
  assert.match(lombok, /public class UserProfileTagsItem/)
  assert.doesNotMatch(lombok, /public static class/)
  assert.doesNotMatch(lombok, /getId\(\)/)
})

test('generateJavaTypes renders empty arrays as List<Object>', () => {
  const output = generateJavaTypes({ response: [] }, { rootName: 'PostmanCollection' })

  assert.match(output, /import java\.util\.List;/)
  assert.match(output, /private List<Object> response;/)
  assert.doesNotMatch(output, /public class PostmanCollectionResponseItem/)
})

test('JsonWorkbench renders a home back button instead of the JSON Pro brand text', () => {
  const source = readFileSync(new URL('../src/components/JsonWorkbench.vue', import.meta.url), 'utf8')

  assert.match(source, /to="\/"/)
  assert.match(source, /返回首页/)
  assert.doesNotMatch(source, /JSON Pro/)
})

test('json workbench layout should inherit page height instead of hardcoding viewport height', () => {
  const source = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(source, /\.tool-page-content \.json-workbench \{\s*flex: 1;\s*min-height: 0;\s*height: 100%;\s*\}/)
  assert.match(source, /\.app-layout \{\s*display: flex;\s*flex-direction: column;\s*height: 100%;\s*min-height: 0;\s*overflow: hidden;\s*\}/)
  assert.doesNotMatch(source, /\.app-layout \{[^}]*height: 100vh;/)
  assert.doesNotMatch(source, /@media \(max-width: 767px\) \{[\s\S]*?\.app-layout \{[^}]*height: 100dvh;/)
})

test('json tools page layout provides a definite full-height flex chain for the workbench', () => {
  const source = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(source, /\.tool-page \{\s*height: 100vh;\s*min-height: 100vh;\s*display: flex;\s*flex-direction: column;\s*background: var\(--bg-base\);\s*overflow: hidden;\s*\}/)
  assert.match(source, /\.tool-page-content \{\s*flex: 1;\s*min-height: 0;\s*overflow: hidden;\s*display: flex;\s*\}/)
  assert.match(source, /\.tool-page-content \.json-workbench \{\s*flex: 1;\s*min-height: 0;\s*height: 100%;\s*\}/)
})

test('JsonToolsPage keeps the full-height tool page shell while rendering only the JSON workbench in content', () => {
  const source = readFileSync(new URL('../src/pages/JsonToolsPage.vue', import.meta.url), 'utf8')

  assert.match(source, /class="tool-page"/)
  assert.match(source, /class="tool-page-content"/)
  assert.match(source, /<JsonWorkbench \/>/)
  assert.doesNotMatch(source, /tool-page-header/)
  assert.doesNotMatch(source, /JSON 工具/)
  assert.doesNotMatch(source, /JSON 转换/)
  assert.doesNotMatch(source, /TS \/ Java 类型生成与 Diff 对比/)
})

test('tool registry exposes homepage cards for available and upcoming tools', () => {
  assert.equal(tools.length, 11)
  assert.deepEqual(tools[0], {
    id: 'json-tools',
    title: 'JSON 转换',
    description: '格式化、压缩、校验、树视图、Diff、TS / Java 类型生成',
    path: '/json',
    icon: 'json-symbol',
    badge: '已上线',
  })
  assert.deepEqual(tools[1], {
    id: 'timestamp-tools',
    title: '时间戳',
    description: '时间戳转换与时间格式处理',
    path: '/timestamp',
    icon: 'timestamp',
    badge: '已上线',
  })
  assert.deepEqual(tools[2], {
    id: 'regex-tools',
    title: 'Regex',
    description: '正则表达式测试、匹配与提取',
    path: '/regex',
    icon: 'regex',
    badge: '已上线',
  })
  assert.deepEqual(tools[3], {
    id: 'Base64-tools',
    title: 'Base64工具',
    description: 'Base64编解码，支持标准和 URL-safe 模式',
    path: '/base64',
    icon: 'toolbox',
    badge: '已上线',
  })
  assert.deepEqual(tools[10], {
    id: 'more-tools',
    title: '更多功能',
    description: '敬请期待...',
    icon: 'more',
    badge: '',
  })
})

test('HomePage renders disabled placeholder cards for upcoming tools', () => {
  const source = readFileSync(new URL('../src/pages/HomePage.vue', import.meta.url), 'utf8')

  assert.match(source, /v-if="tool.path"/)
  assert.match(source, /v-else/)
  assert.match(source, /tool-card tool-card-disabled/)
})

test('router exposes standalone timestamp tools page', () => {
  const routerSource = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')

  assert.match(routerSource, /import TimestampToolsPage from '\.\.\/pages\/TimestampToolsPage\.vue'/)
  assert.match(routerSource, /path:\s*'\/timestamp'/)
  assert.match(routerSource, /name:\s*'timestamp-tools'/)
})

test('TimestampToolsPage renders the standalone timestamp workbench shell', () => {
  const source = readFileSync(new URL('../src/pages/TimestampToolsPage.vue', import.meta.url), 'utf8')

  assert.match(source, /class="tool-page"/)
  assert.match(source, /<TimestampWorkbench \/>/)
})

test('TimestampWorkbench provides current timestamp header and dual conversion tabs', () => {
  const source = readFileSync(new URL('../src/components/TimestampWorkbench.vue', import.meta.url), 'utf8')
  const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
  const helperSource = readFileSync(new URL('../src/lib/timestamp.js', import.meta.url), 'utf8')

  assert.match(source, /当前时间戳/)
  assert.match(source, /秒\/毫秒/)
  assert.match(source, /时间戳->日期时间|时间戳 → 日期时间/)
  assert.match(source, /日期时间->时间戳|日期时间 → 时间戳/)
  assert.match(helperSource, /GMT\+08:00 \(北京时间\)/)
  assert.match(source, /convertTimestampToDateTimes/)
  assert.match(source, /convertDateTimeToTimestamps/)
  assert.match(source, /copyText/)
  assert.match(styleSource, /\.timestamp-workbench/)
  assert.match(styleSource, /\.timestamp-topbar/)
  assert.match(styleSource, /\.timestamp-tabs/)
})

test('TimestampWorkbench keeps timestamp form hint and radio rows aligned in the right content column', () => {
  const source = readFileSync(new URL('../src/components/TimestampWorkbench.vue', import.meta.url), 'utf8')
  const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(source, /class="timestamp-field-hint timestamp-field-content"/)
  assert.match(source, /class="timestamp-radio-group timestamp-field-content"/)
  assert.match(styleSource, /\.timestamp-field-content\s*\{[\s\S]*grid-column:\s*2/)
})

test('TimestampWorkbench refreshes current time immediately during timestamp actions', () => {
  const source = readFileSync(new URL('../src/components/TimestampWorkbench.vue', import.meta.url), 'utf8')

  assert.match(source, /function syncCurrentNow\(\) \{/)
  assert.match(source, /currentNowMs\.value = Date\.now\(\)/)
  assert.match(source, /function convertTimestamp\(\) \{[\s\S]*syncCurrentNow\(\)/)
  assert.match(source, /function fillCurrentTimestamp\(\) \{[\s\S]*syncCurrentNow\(\)/)
  assert.match(source, /function convertDateTime\(\) \{[\s\S]*syncCurrentNow\(\)/)
  assert.match(source, /function fillCurrentDateTime\(\) \{[\s\S]*syncCurrentNow\(\)/)
})


test('timestamp conversion helpers support second millisecond and timezone-based outputs', () => {
  assert.deepEqual(parseTimestampInput('1775213843448', 'millis'), {
    timestampMs: 1775213843448,
    digits: 13,
  })
  assert.deepEqual(parseTimestampInput('1775213843', 'seconds'), {
    timestampMs: 1775213843000,
    digits: 10,
  })

  const converted = convertTimestampToDateTimes(1775213843448, 'Asia/Shanghai')
  assert.equal(converted.zonedDateTime, '2026-04-03 18:57:23')
  assert.equal(converted.utcDateTime, '2026-04-03 10:57:23')

  const timestamps = convertDateTimeToTimestamps('2026-04-03 18:50:19', '445', 'Asia/Shanghai')
  assert.equal(timestamps.seconds, '1775213419')
  assert.equal(timestamps.milliseconds, '1775213419445')

  assert.equal(formatDateTimeParts(2026, 4, 3, 18, 50, 19), '2026-04-03 18:50:19')
})
test('FormatTab renders collapsible formatted output with expand and collapse controls', () => {
  const source = readFileSync(new URL('../src/components/FormatTab.vue', import.meta.url), 'utf8')

  assert.match(source, /全部展开/)
  assert.match(source, /全部折叠/)
  assert.match(source, /class="tree-view format-tree-view"/)
  assert.match(source, /<TreeNode/)
  assert.match(source, /expandedSet/)
  assert.match(source, /@toggle="toggleNode"/)
})

test('style uses editor-like token colors for json and code output', () => {
  const source = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(source, /--json-key-color:/)
  assert.match(source, /--json-string-color:/)
  assert.match(source, /--json-number-color:/)
  assert.match(source, /--json-bool-color:/)
  assert.match(source, /\.json-key \{ color: var\(--json-key-color\); \}/)
  assert.match(source, /\.json-string \{ color: var\(--json-string-color\); \}/)
  assert.match(source, /\.json-number \{ color: var\(--json-number-color\); \}/)
  assert.match(source, /\.json-bool \{ color: var\(--json-bool-color\); \}/)
  assert.match(source, /\.tree-key \{ color: var\(--json-key-color\); \}/)
})

test('all tabs reset on refresh instead of using session storage persistence', () => {
  const components = [
    'FormatTab.vue',
    'TreeTab.vue',
    'CompressTab.vue',
    'ValidateTab.vue',
    'TypesTab.vue',
    'JavaTypesTab.vue',
    'JsonPathTab.vue',
    'EscapeTab.vue',
    'ConvertTab.vue',
    'DiffTab.vue',
  ]

  components.forEach((file) => {
    const source = readFileSync(new URL(`../src/components/${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /useSessionStorage/)
  })
})

test('JsonWorkbench keeps tab components mounted so switching tabs preserves in-memory state', () => {
  const source = readFileSync(new URL('../src/components/JsonWorkbench.vue', import.meta.url), 'utf8')

  assert.match(source, /<FormatTab v-show="activeTab === 'format'" \/>/)
  assert.match(source, /<CompressTab v-show="activeTab === 'compress'" \/>/)
  assert.match(source, /<ValidateTab v-show="activeTab === 'validate'" \/>/)
  assert.match(source, /<EscapeTab v-show="activeTab === 'escape'" \/>/)
  assert.match(source, /<TreeTab v-show="activeTab === 'tree'" \/>/)
  assert.match(source, /<ConvertTab v-show="activeTab === 'convert'" \/>/)
  assert.match(source, /<JsonPathTab v-show="activeTab === 'jsonpath'" \/>/)
  assert.match(source, /<TypesTab v-show="activeTab === 'types'" \/>/)
  assert.match(source, /<JavaTypesTab v-show="activeTab === 'java'" \/>/)
  assert.match(source, /<DiffTab v-show="activeTab === 'diff'" \/>/)
  assert.doesNotMatch(source, /v-else-if="activeTab ===/)
})

test('highlightJava wraps java tokens without corrupting html markup', () => {
  const highlighted = highlightJava(`import java.util.List;

public class UserProfile {
  @JsonProperty("user-name")
  private String userName;
}`)

  assert.match(highlighted, /<span class="ts-keyword">import<\/span>/)
  assert.match(highlighted, /<span class="ts-type">List<\/span>/)
  assert.match(highlighted, /<span class="ts-string">@JsonProperty<\/span>/)
  assert.match(highlighted, /<span class="ts-string">&quot;user-name&quot;<\/span>/)
  assert.doesNotMatch(highlighted, /class=<span/)
})

test('diffJsonValues reports added removed changed and type_changed items by path', () => {
  const left = {
    name: '张三',
    age: 25,
    profile: { vip: true },
    oldField: 'x',
  }
  const right = {
    name: '张三',
    age: 26,
    profile: { vip: 'yes' },
    email: 'zhangsan@example.com',
  }

  const diff = diffJsonValues(left, right)
  const summary = summarizeDiff(diff)

  assert.deepEqual(
    diff.map((item) => item.type),
    ['changed', 'added', 'removed', 'type_changed']
  )
  assert.equal(diff[0].path, 'root.age')
  assert.equal(diff[1].path, 'root.email')
  assert.equal(diff[2].path, 'root.oldField')
  assert.equal(diff[3].path, 'root.profile.vip')
  assert.match(summary, /新增 1 项/)
  assert.match(summary, /删除 1 项/)
  assert.match(summary, /修改 1 项/)
  assert.match(summary, /类型变更 1 项/)
  assert.equal(formatDiffValue({ a: 1 }), '{"a":1}')
})

test('parseByFormat and stringifyByFormat support csv toml and query', () => {
  const csvText = 'name,age\n张三,25\n李四,30'
  const csvValue = parseByFormat(csvText, 'csv')
  assert.deepEqual(csvValue, [
    { name: '张三', age: '25' },
    { name: '李四', age: '30' },
  ])

  const tomlText = 'title = "Example"\n[owner]\nname = "Tom"'
  const tomlValue = parseByFormat(tomlText, 'toml')
  assert.equal(tomlValue.owner.name, 'Tom')

  const queryValue = parseByFormat('name=张三&tag=vip&tag=new', 'query')
  assert.deepEqual(queryValue, { name: '张三', tag: ['vip', 'new'] })

  assert.match(stringifyByFormat(csvValue, 'csv'), /name,age/)
  assert.match(stringifyByFormat({ title: 'Example', owner: { name: 'Tom' } }, 'toml'), /title = "Example"/)
  assert.equal(stringifyByFormat({ name: '张三', tag: ['vip', 'new'] }, 'query'), 'name=%E5%BC%A0%E4%B8%89&tag=vip&tag=new')
  assert.equal(getFormatExtension('toml'), 'toml')
})

test('readClipboardText throws clear error when clipboard API is unavailable', async () => {
  const originalNavigator = globalThis.navigator
  Object.defineProperty(globalThis, 'navigator', {
    value: {},
    configurable: true,
    writable: true,
  })

  await assert.rejects(() => readClipboardText(), /剪贴板读取不可用/)

  Object.defineProperty(globalThis, 'navigator', {
    value: originalNavigator,
    configurable: true,
    writable: true,
  })
})

test('copyText shows clear feedback when clipboard copy fails completely', async () => {
  const originalNavigator = globalThis.navigator
  const originalDocument = globalThis.document
  const originalAlert = globalThis.alert
  const alerts = []

  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: {
        async writeText() {
          throw new Error('denied')
        },
      },
    },
    configurable: true,
    writable: true,
  })

  globalThis.document = {
    createElement() {
      throw new Error('dom unavailable')
    },
  }

  globalThis.alert = (message) => {
    alerts.push(message)
  }

  const copied = await copyText('hello')

  assert.equal(copied, false)
  assert.equal(alerts.length, 1)
  assert.match(alerts[0], /复制失败/)

  Object.defineProperty(globalThis, 'navigator', {
    value: originalNavigator,
    configurable: true,
    writable: true,
  })
  globalThis.document = originalDocument
  globalThis.alert = originalAlert
})

test('FormatTab pasteJson should not silently ignore clipboard read failure', () => {
  const source = readFileSync(new URL('../src/components/FormatTab.vue', import.meta.url), 'utf8')
  const pasteJsonBlock = source.match(/async function pasteJson\(\) \{[\s\S]*?\n\}/)?.[0] || ''

  assert.match(pasteJsonBlock, /async function pasteJson\(\)/)
  assert.match(pasteJsonBlock, /catch \(error\)/)
  assert.doesNotMatch(pasteJsonBlock, /catch \{\s*\/\/ ignore\s*\}/)
})

test('downloadTextFile creates and clicks an anchor element', () => {
  const calls = []
  const originalDocument = globalThis.document
  const originalURL = globalThis.URL

  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'a')
      return {
        click() {
          calls.push('click')
        },
      }
    },
  }

  globalThis.URL = {
    createObjectURL() {
      calls.push('create')
      return 'blob:test'
    },
    revokeObjectURL(url) {
      calls.push(`revoke:${url}`)
    },
  }

  downloadTextFile('demo.txt', 'hello')

  assert.deepEqual(calls, ['create', 'click', 'revoke:blob:test'])

  globalThis.document = originalDocument
  globalThis.URL = originalURL
})

test('pickTextFile resolves file text from hidden file input', async () => {
  const originalDocument = globalThis.document
  const originalFileReader = globalThis.FileReader

  globalThis.FileReader = class {
    readAsText(file) {
      this.result = file.mockText
      this.onload()
    }
  }

  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'input')
      return {
        type: '',
        accept: '',
        files: [{ mockText: '{"ok":true}' }],
        click() {
          this.onchange()
        },
      }
    },
  }

  const text = await pickTextFile('.json')
  assert.equal(text, '{"ok":true}')

  globalThis.document = originalDocument
  globalThis.FileReader = originalFileReader
})

test('resetEditorWithValue replaces content and bumps revision to clear native undo history', () => {
  const state = createEditorResetState('old content')
  const next = resetEditorWithValue(state, 'sample content')

  assert.deepEqual(next, {
    value: 'sample content',
    revision: 1,
  })
})

test('LineNumberedOutput component provides line number toggle for text and HTML output panels', () => {
  const source = readFileSync(new URL('../src/components/LineNumberedOutput.vue', import.meta.url), 'utf8')

  assert.match(source, /showLineNumbers/)
  assert.match(source, /line-gutter/)
  assert.match(source, /v-html|innerHTML|innerText/)
  assert.match(source, /defineProps/)
})

test('buildAnnotatedSides produces per-line type annotations for A and B views', () => {
  const left  = { name: '张三', age: 25, city: '北京' }
  const right = { name: '张三', age: 26, email: 'x@x.com' }
  const items = diffJsonValues(left, right)
  const { linesA, linesB } = buildAnnotatedSides(
    JSON.stringify(left, null, 2),
    JSON.stringify(right, null, 2),
    items,
  )
  // age changed: both sides should have a line marked 'changed'
  assert.ok(linesA.some((l) => l.type === 'changed'))
  assert.ok(linesB.some((l) => l.type === 'changed'))
  // city only in A → removed on A side
  assert.ok(linesA.some((l) => l.type === 'removed'))
  // email only in B → added on B side
  assert.ok(linesB.some((l) => l.type === 'added'))
})

test('DiffTab renders side-by-side highlighted view after runDiff', () => {
  const source = readFileSync(new URL('../src/components/DiffTab.vue', import.meta.url), 'utf8')
  assert.match(source, /diff-line-added/)
  assert.match(source, /diff-line-removed/)
  assert.match(source, /diff-line-changed/)
  assert.match(source, /linesA/)
  assert.match(source, /linesB/)
})

test('TreeNode keeps key and colon on one line while only wrapped string value is allowed to wrap', () => {
  const treeSource = readFileSync(new URL('../src/components/TreeNode.vue', import.meta.url), 'utf8')
  const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(treeSource, /wrapped-string-value/)
  assert.doesNotMatch(treeSource, /'wrapped-string-flow': isWrappedString/)
  assert.match(styleSource, /\.wrapped-string-value\s*\{[^}]*overflow-wrap:\s*anywhere/s)
  assert.match(styleSource, /\.wrapped-string-value\s*\{[^}]*word-break:\s*break-word/s)
})

test('FormatTab uses a real two-column gutter for tree view line numbers', () => {
  const formatSource = readFileSync(new URL('../src/components/FormatTab.vue', import.meta.url), 'utf8')
  const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(formatSource, /tree-line-number-layout/)
  assert.match(formatSource, /tree-line-gutter/)
  assert.match(formatSource, /visibleLineCount/)
  assert.match(formatSource, /@scroll="syncTreeLineGutter"/)
  assert.match(formatSource, /ref="treeViewRef"/)
  assert.match(formatSource, /ref="treeLineGutterRef"/)
  assert.match(formatSource, /:indent-size="indentSize"/)
  assert.match(formatSource, /const indentSize = computed\(\(\) => indent\.value === '\\t' \? 16 : Number\(indent\.value\) \* 8\)/)
  assert.match(styleSource, /\.tree-line-number-layout/)
  assert.match(styleSource, /\.tree-line-gutter/)
  assert.doesNotMatch(styleSource, /counter-increment:\s*tree-line/)
})

test('TreeNode uses provided indentSize for depth-based line indentation', () => {
  const treeSource = readFileSync(new URL('../src/components/TreeNode.vue', import.meta.url), 'utf8')
  const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(treeSource, /indentSize:\s*\{\s*type:\s*Number,\s*default:\s*16\s*\}/)
  assert.match(treeSource, /paddingLeft: `\$\{props\.depth \* props\.indentSize\}px`/)
  assert.match(treeSource, /:indent-size="indentSize"/)
  assert.doesNotMatch(styleSource, /\.tree-node\s*\{\s*padding-left:\s*16px;\s*\}/)
})

test('getViewportInfo distinguishes phone, pad portrait and desktop layouts', () => {
  assert.equal(PHONE_MAX_WIDTH, 767)
  assert.equal(PAD_MAX_WIDTH, 1180)

  assert.deepEqual(getViewportInfo(390, 844), {
    width: 390,
    height: 844,
    isPhone: true,
    isPad: false,
    isDesktop: false,
    isPortrait: true,
    shouldUseBottomTabs: true,
    shouldStackPanels: true,
  })

  assert.deepEqual(getViewportInfo(1024, 1366), {
    width: 1024,
    height: 1366,
    isPhone: false,
    isPad: true,
    isDesktop: false,
    isPortrait: true,
    shouldUseBottomTabs: false,
    shouldStackPanels: true,
  })

  assert.deepEqual(getViewportInfo(1366, 1024), {
    width: 1366,
    height: 1024,
    isPhone: false,
    isPad: false,
    isDesktop: true,
    isPortrait: false,
    shouldUseBottomTabs: false,
    shouldStackPanels: false,
  })
})

test('encodeBase64 and decodeBase64 handle ASCII text roundtrip', () => {
  const text = 'Hello, World!'
  const encoded = encodeBase64(text)
  assert.equal(encoded, 'SGVsbG8sIFdvcmxkIQ==')
  assert.equal(decodeBase64(encoded), text)
})

test('encodeBase64 and decodeBase64 handle Unicode text roundtrip', () => {
  const text = '你好世界 🚀'
  const encoded = encodeBase64(text)
  assert.equal(decodeBase64(encoded), text)
})

test('encodeBase64Url produces URL-safe characters and decodes back correctly', () => {
  const text = 'a+b/c=d?e&f'
  const standard = encodeBase64(text)
  const urlSafe = encodeBase64Url(text)

  // URL-safe should not contain + / or =
  assert.equal(urlSafe.includes('+'), false)
  assert.equal(urlSafe.includes('/'), false)
  assert.equal(urlSafe.includes('='), false)

  // Both should decode to the same text
  assert.equal(decodeBase64(standard), text)
  assert.equal(decodeBase64Url(urlSafe), text)
})

test('encodeBase64Url and decodeBase64Url handle Unicode roundtrip', () => {
  const text = '测试中文 Base64 编码'
  const encoded = encodeBase64Url(text)
  assert.equal(decodeBase64Url(encoded), text)
})

test('addLineBreaks inserts newline every 76 characters', () => {
  const base64 = 'A'.repeat(200)
  const withBreaks = addLineBreaks(base64)
  const lines = withBreaks.split('\n')
  assert.equal(lines.length, 3)
  assert.equal(lines[0].length, 76)
  assert.equal(lines[1].length, 76)
  assert.equal(lines[2].length, 48)
})

test('stripWhitespace removes all whitespace characters', () => {
  assert.equal(stripWhitespace('  a b\nc\td\r\n'), 'abcd')
  assert.equal(stripWhitespace('no-whitespace'), 'no-whitespace')
  assert.equal(stripWhitespace(''), '')
})

test('validateBase64 accepts valid Base64 and rejects invalid input', () => {
  assert.deepEqual(validateBase64('SGVsbG8='), { valid: true, error: null })
  assert.deepEqual(validateBase64(''), { valid: false, error: '输入内容不能为空' })
  assert.deepEqual(validateBase64('  '), { valid: false, error: '输入内容不能为空' })
  assert.equal(validateBase64('SGVsbG8!').valid, false)
  assert.equal(validateBase64('A').valid, false)
})

test('validateBase64Url accepts URL-safe Base64 characters', () => {
  assert.deepEqual(validateBase64Url('SGVsbG8-d29ybGQ'), { valid: true, error: null })
  assert.deepEqual(validateBase64Url(''), { valid: false, error: '输入内容不能为空' })
  assert.equal(validateBase64Url('abc+def').valid, false)
})

test('computeStats returns byte counts and compression ratio', () => {
  const stats = computeStats('Hello', 'SGVsbG8=')
  assert.equal(stats.inputBytes, 5)
  assert.equal(stats.outputBytes, 8)
  assert.equal(stats.ratio, '1.60')

  const empty = computeStats('', '')
  assert.equal(empty.inputBytes, 0)
  assert.equal(empty.outputBytes, 0)
  assert.equal(empty.ratio, '0.00')
})

test('Base64 roundtrip preserves JSON content', () => {
  const json = '{"name":"张三","age":25,"tags":["a","b"]}'
  const encoded = encodeBase64(json)
  const decoded = decodeBase64(encoded)
  assert.equal(decoded, json)
})

test('Base64 page is registered in router with /base64 path', () => {
  const routerSource = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')

  assert.match(routerSource, /import Base64ToolsPage from '\.\.\/pages\/Base64ToolsPage\.vue'/)
  assert.match(routerSource, /path:\s*'\/base64'/)
  assert.match(routerSource, /name:\s*'base64-tools'/)
})

test('Base64ToolsPage renders the standalone base64 workbench shell', () => {
  const source = readFileSync(new URL('../src/pages/Base64ToolsPage.vue', import.meta.url), 'utf8')

  assert.match(source, /class="tool-page"/)
  assert.match(source, /<Base64Workbench \/>/)
})

test('Base64Workbench provides encode and decode tabs with mode switch', () => {
  const source = readFileSync(new URL('../src/components/Base64Workbench.vue', import.meta.url), 'utf8')

  assert.match(source, /返回首页/)
  assert.match(source, /标准 Base64/)
  assert.match(source, /URL-safe Base64/)
  assert.match(source, /编码/)
  assert.match(source, /解码/)
  assert.match(source, /encodeBase64/)
  assert.match(source, /decodeBase64/)
  assert.match(source, /encodeBase64Url/)
  assert.match(source, /decodeBase64Url/)
  assert.match(source, /copyText/)
})

test('Base64 workbench style classes are defined in stylesheet', () => {
  const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(styleSource, /\.base64-workbench/)
  assert.match(styleSource, /\.base64-shell/)
  assert.match(styleSource, /\.base64-topbar/)
  assert.match(styleSource, /\.base64-card/)
  assert.match(styleSource, /\.base64-tabs/)
  assert.match(styleSource, /\.base64-panel/)
  assert.match(styleSource, /\.base64-result-card/)
})

// ==================== URL Encode/Decode ====================

test('encodeUrl and decodeUrl handle full URL roundtrip', () => {
  const original = 'https://example.com/path?name=你好&city=北京'
  const encoded = encodeUrl(original)
  assert.match(encoded, /%E4%BD%A0%E5%A5%BD/)
  assert.match(encoded, /%E5%8C%97%E4%BA%AC/)
  assert.doesNotMatch(encoded, /你好/)
  assert.equal(decodeUrl(encoded), original)
})

test('encodeUrl preserves URL structure characters', () => {
  const url = 'https://example.com/path?key=value#fragment'
  const encoded = encodeUrl(url)
  assert.equal(encoded, url)
})

test('encodeUrlComponent encodes more characters than encodeUrl', () => {
  const input = 'key=value&foo=bar'
  const encodedUri = encodeUrl(input)
  const encodedComp = encodeUrlComponent(input)
  // Component mode encodes = and &
  assert.match(encodedComp, /%3D/)
  assert.match(encodedComp, /%26/)
  // URI mode preserves = and &
  assert.match(encodedUri, /=/)
  assert.match(encodedUri, /&/)
})

test('encodeUrlComponent and decodeUrlComponent handle Unicode roundtrip', () => {
  const original = '你好世界 Hello 🌍'
  const encoded = encodeUrlComponent(original)
  assert.equal(decodeUrlComponent(encoded), original)
})

test('encodeQueryParams parses key=value lines', () => {
  const input = 'name=你好\ncity=北京'
  const result = encodeQueryParams(input)
  assert.equal(result, 'name=%E4%BD%A0%E5%A5%BD&city=%E5%8C%97%E4%BA%AC')
})

test('encodeQueryParams supports colon separator', () => {
  const input = 'name:hello\ncity:world'
  const result = encodeQueryParams(input)
  assert.equal(result, 'name=hello&city=world')
})

test('encodeQueryParams handles empty value', () => {
  const input = 'key='
  const result = encodeQueryParams(input)
  assert.equal(result, 'key=')
})

test('decodeQueryParams parses query string to lines', () => {
  const input = 'name=%E4%BD%A0%E5%A5%BD&city=%E5%8C%97%E4%BA%AC'
  const result = decodeQueryParams(input)
  assert.equal(result, 'name=你好\ncity=北京')
})

test('decodeQueryParams strips leading question mark', () => {
  const input = '?a=1&b=2'
  const result = decodeQueryParams(input)
  assert.equal(result, 'a=1\nb=2')
})

test('decodeQueryParams handles empty value pair', () => {
  const input = 'key=&a=1'
  const result = decodeQueryParams(input)
  assert.equal(result, 'key=\na=1')
})

test('URL encode/decode preserves JSON content', () => {
  const json = '{"name":"你好","items":[1,2,3]}'
  const encoded = encodeUrlComponent(json)
  const decoded = decodeUrlComponent(encoded)
  assert.equal(decoded, json)
})

test('computeUrlStats returns correct byte counts', () => {
  const stats = computeUrlStats('hello', 'hello')
  assert.equal(stats.inputBytes, 5)
  assert.equal(stats.outputBytes, 5)
  assert.equal(stats.ratio, '1.00')
})

test('URL page is registered in router with /url path', () => {
  const source = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(source, /import UrlEncodeToolsPage from/)
  assert.match(source, /path:\s*'\/url'/)
})

test('UrlEncodeToolsPage renders the standalone url workbench shell', () => {
  const source = readFileSync(new URL('../src/pages/UrlEncodeToolsPage.vue', import.meta.url), 'utf8')
  assert.match(source, /tool-page/)
  assert.match(source, /tool-page-content/)
  assert.match(source, /UrlWorkbench/)
})

test('UrlWorkbench provides encode and decode tabs with mode switch', () => {
  const source = readFileSync(new URL('../src/components/UrlWorkbench.vue', import.meta.url), 'utf8')
  assert.match(source, /activeTab/)
  assert.match(source, /编码/)
  assert.match(source, /解码/)
  assert.match(source, /mode === 'uri'/)
  assert.match(source, /mode === 'component'/)
  assert.match(source, /mode === 'query'/)
  assert.match(source, /encodeUrl/)
  assert.match(source, /decodeUrl/)
  assert.match(source, /encodeUrlComponent/)
  assert.match(source, /decodeUrlComponent/)
  assert.match(source, /encodeQueryParams/)
  assert.match(source, /decodeQueryParams/)
  assert.match(source, /copyText/)
})

test('Url workbench style classes are defined in stylesheet', () => {
  const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(styleSource, /\.url-workbench/)
  assert.match(styleSource, /\.url-shell/)
  assert.match(styleSource, /\.url-topbar/)
  assert.match(styleSource, /\.url-card/)
  assert.match(styleSource, /\.url-tabs/)
  assert.match(styleSource, /\.url-panel/)
  assert.match(styleSource, /\.url-result-card/)
})

// ==================== SQL Format ====================

test('tokenize splits SQL into meaningful tokens', () => {
  const tokens = tokenize('SELECT * FROM users', 'mysql')
  const types = tokens.filter(t => t.type !== 'whitespace').map(t => t.type)
  const values = tokens.filter(t => t.type !== 'whitespace').map(t => t.value)
  assert.deepEqual(types, ['keyword', 'operator', 'keyword', 'identifier'])
  assert.deepEqual(values, ['SELECT', '*', 'FROM', 'users'])
})

test('tokenize handles string literals with escapes', () => {
  const tokens = tokenize("SELECT 'it''s a test'", 'mysql')
  const strings = tokens.filter(t => t.type === 'string')
  assert.equal(strings.length, 1)
  assert.equal(strings[0].value, "'it''s a test'")
})

test('tokenize handles single-line comments', () => {
  const tokens = tokenize('SELECT 1 -- this is a comment\nFROM dual', 'mysql')
  const comments = tokens.filter(t => t.type === 'comment')
  assert.equal(comments.length, 1)
  assert.match(comments[0].value, /this is a comment/)
})

test('tokenize handles multi-line comments', () => {
  const tokens = tokenize('SELECT /* hint */ 1 FROM dual', 'mysql')
  const comments = tokens.filter(t => t.type === 'comment')
  assert.equal(comments.length, 1)
  assert.match(comments[0].value, /hint/)
})

test('tokenize handles backtick identifiers in MySQL mode', () => {
  const tokens = tokenize('SELECT `user name` FROM `my table`', 'mysql')
  const identifiers = tokens.filter(t => t.type === 'identifier')
  assert.equal(identifiers[0].value, '`user name`')
  assert.equal(identifiers[1].value, '`my table`')
})

test('tokenize handles double-quoted identifiers in PostgreSQL mode', () => {
  const tokens = tokenize('SELECT "user name" FROM "my table"', 'postgresql')
  const identifiers = tokens.filter(t => t.type === 'identifier')
  assert.equal(identifiers[0].value, '"user name"')
  assert.equal(identifiers[1].value, '"my table"')
})

test('formatSql adds newlines for main clauses', () => {
  const sql = 'SELECT id, name FROM users WHERE status = 1 ORDER BY name'
  const result = formatSql(sql, { dialect: 'mysql' })
  assert.equal(result.ok, true)
  assert.match(result.value, /SELECT/)
  assert.match(result.value, /\n\s*FROM/)
  assert.match(result.value, /\n\s*WHERE/)
  assert.match(result.value, /\n\s*ORDER BY/)
})

test('formatSql puts commas on separate lines in SELECT', () => {
  const sql = 'SELECT id, name, email FROM users'
  const result = formatSql(sql, { dialect: 'mysql' })
  assert.equal(result.ok, true)
  // Each column should be on its own line after SELECT
  const lines = result.value.split('\n')
  assert.ok(lines.length >= 4) // SELECT + 3 columns + FROM
})

test('formatSql handles AND/OR with indentation', () => {
  const sql = 'SELECT * FROM users WHERE id > 1 AND name IS NOT NULL OR status = 0'
  const result = formatSql(sql, { dialect: 'mysql' })
  assert.equal(result.ok, true)
  assert.match(result.value, /\n\s+AND/)
  assert.match(result.value, /\n\s+OR/)
})

test('formatSql handles JOIN clauses', () => {
  const sql = 'SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id'
  const result = formatSql(sql, { dialect: 'mysql' })
  assert.equal(result.ok, true)
  assert.match(result.value, /INNER JOIN/)
  assert.match(result.value, /ON/)
})

test('formatSql handles subqueries with indentation', () => {
  const sql = 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100)'
  const result = formatSql(sql, { dialect: 'mysql' })
  assert.equal(result.ok, true)
  // Subquery should be indented
  assert.match(result.value, /\(/)
  assert.match(result.value, /SELECT user_id/)
})

test('formatSql handles CASE/WHEN/END', () => {
  const sql = 'SELECT CASE WHEN status = 1 THEN \'active\' ELSE \'inactive\' END AS status_text FROM users'
  const result = formatSql(sql, { dialect: 'mysql' })
  assert.equal(result.ok, true)
  assert.match(result.value, /CASE/)
  assert.match(result.value, /WHEN/)
  assert.match(result.value, /THEN/)
  assert.match(result.value, /ELSE/)
  assert.match(result.value, /END/)
})

test('formatSql respects uppercaseKeywords option', () => {
  const sql = 'select id from users where id = 1'
  const resultLower = formatSql(sql, { dialect: 'mysql', uppercaseKeywords: false })
  assert.equal(resultLower.ok, true)
  assert.match(resultLower.value, /select/)
  assert.match(resultLower.value, /from/)
  assert.match(resultLower.value, /where/)
})

test('formatSql handles empty input', () => {
  const result = formatSql('', { dialect: 'mysql' })
  assert.equal(result.ok, true)
  assert.equal(result.value, '')
})

test('formatSql handles MySQL backtick identifiers', () => {
  const sql = 'SELECT `id`, `name` FROM `users` WHERE `status` = 1'
  const result = formatSql(sql, { dialect: 'mysql' })
  assert.equal(result.ok, true)
  assert.match(result.value, /`id`/)
  assert.match(result.value, /`name`/)
})

test('formatSql handles PostgreSQL double-quoted identifiers', () => {
  const sql = 'SELECT "id", "name" FROM "users" WHERE "status" = 1'
  const result = formatSql(sql, { dialect: 'postgresql' })
  assert.equal(result.ok, true)
  assert.match(result.value, /"id"/)
  assert.match(result.value, /"name"/)
})

test('formatSql handles Oracle dual table', () => {
  const sql = 'SELECT SYSDATE FROM dual'
  const result = formatSql(sql, { dialect: 'oracle' })
  assert.equal(result.ok, true)
  assert.match(result.value, /SYSDATE/)
  assert.match(result.value, /DUAL/)
})

test('compressSql removes whitespace and comments', () => {
  const sql = 'SELECT  id,  name\n  FROM  users\n  -- comment\n  WHERE  id = 1'
  const result = compressSql(sql, { dialect: 'mysql' })
  assert.equal(result.ok, true)
  assert.doesNotMatch(result.value, /--/)
  assert.doesNotMatch(result.value, /\n/)
  assert.match(result.value, /SELECT id, name FROM users WHERE id = 1/)
})

test('compressSql handles empty input', () => {
  const result = compressSql('', { dialect: 'mysql' })
  assert.equal(result.ok, true)
  assert.equal(result.value, '')
})

test('compressSql respects uppercaseKeywords option', () => {
  const sql = 'select id from users'
  const result = compressSql(sql, { dialect: 'mysql', uppercaseKeywords: true })
  assert.equal(result.ok, true)
  assert.match(result.value, /SELECT/)
  assert.match(result.value, /FROM/)
})

test('computeSqlStats returns correct counts', () => {
  const stats = computeSqlStats('SELECT 1', 'SELECT\n  1')
  assert.equal(stats.inputBytes, 8)
  assert.equal(stats.outputBytes, 10)
  assert.equal(stats.inputLines, 1)
  assert.equal(stats.outputLines, 2)
})

test('SQL page is registered in router with /sql path', () => {
  const source = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(source, /import SqlToolsPage from/)
  assert.match(source, /path:\s*'\/sql'/)
})

test('SqlToolsPage renders the standalone sql workbench shell', () => {
  const source = readFileSync(new URL('../src/pages/SqlToolsPage.vue', import.meta.url), 'utf8')
  assert.match(source, /tool-page/)
  assert.match(source, /tool-page-content/)
  assert.match(source, /SqlWorkbench/)
})

test('SqlWorkbench provides format and compress tabs with dialect switch', () => {
  const source = readFileSync(new URL('../src/components/SqlWorkbench.vue', import.meta.url), 'utf8')
  assert.match(source, /activeTab/)
  assert.match(source, /美化/)
  assert.match(source, /压缩/)
  assert.match(source, /dialect === 'mysql'/)
  assert.match(source, /dialect === 'postgresql'/)
  assert.match(source, /dialect === 'oracle'/)
  assert.match(source, /formatSql/)
  assert.match(source, /compressSql/)
  assert.match(source, /copyText/)
})

test('Sql workbench style classes are defined in stylesheet', () => {
  const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(styleSource, /\.sql-workbench/)
  assert.match(styleSource, /\.sql-shell/)
  assert.match(styleSource, /\.sql-topbar/)
  assert.match(styleSource, /\.sql-card/)
  assert.match(styleSource, /\.sql-tabs/)
  assert.match(styleSource, /\.sql-panel/)
  assert.match(styleSource, /\.sql-result-card/)
})

// ==================== Text Diff ====================

test('diffText detects identical texts', () => {
  const result = diffText('hello\nworld', 'hello\nworld')
  assert.equal(result.stats.unchanged, 2)
  assert.equal(result.stats.added, 0)
  assert.equal(result.stats.removed, 0)
  assert.equal(result.stats.modified, 0)
})

test('diffText detects added lines', () => {
  const result = diffText('hello', 'hello\nworld')
  assert.equal(result.stats.added, 1)
  assert.equal(result.stats.unchanged, 1)
})

test('diffText detects removed lines', () => {
  const result = diffText('hello\nworld', 'hello')
  assert.equal(result.stats.removed, 1)
  assert.equal(result.stats.unchanged, 1)
})

test('diffText detects modified lines', () => {
  const result = diffText('hello\nfoo', 'hello\nbar')
  assert.equal(result.stats.modified, 1)
  assert.equal(result.stats.unchanged, 1)
  const modified = result.lines.find(l => l.type === 'modified')
  assert.ok(modified)
  assert.ok(modified.oldSegments)
  assert.ok(modified.newSegments)
})

test('diffText handles empty inputs', () => {
  const result = diffText('', '')
  assert.equal(result.lines.length, 1)
  assert.equal(result.stats.unchanged, 1)
})

test('diffText handles one empty input', () => {
  const result = diffText('', 'hello\nworld')
  // 空行被视为被修改，其余行为新增
  assert.ok(result.stats.added + result.stats.modified >= 1)
  assert.equal(result.stats.unchanged, 0)
})

test('diffText provides correct line numbers', () => {
  const result = diffText('a\nb\nc', 'a\nx\nc')
  const unchanged = result.lines.filter(l => l.type === 'unchanged')
  assert.equal(unchanged[0].oldLineNo, 1)
  assert.equal(unchanged[0].newLineNo, 1)
  assert.equal(unchanged[1].oldLineNo, 3)
  assert.equal(unchanged[1].newLineNo, 3)
})

test('diffText does character-level highlighting for modified lines', () => {
  const result = diffText('abcdef', 'abXYef')
  const modified = result.lines.find(l => l.type === 'modified')
  assert.ok(modified)
  // oldSegments should have removed chars
  assert.ok(modified.oldSegments.some(s => s.type === 'removed'))
  // newSegments should have added chars
  assert.ok(modified.newSegments.some(s => s.type === 'added'))
})

test('summarizeDiffStats returns correct summary', () => {
  assert.equal(summarizeDiffStats({ added: 0, removed: 0, modified: 0, unchanged: 5 }), '✅ 两段文本完全相同')
  assert.match(summarizeDiffStats({ added: 2, removed: 1, modified: 3, unchanged: 4 }), /新增 2 行/)
  assert.match(summarizeDiffStats({ added: 2, removed: 1, modified: 3, unchanged: 4 }), /删除 1 行/)
  assert.match(summarizeDiffStats({ added: 2, removed: 1, modified: 3, unchanged: 4 }), /修改 3 行/)
})

test('formatDiffAsText produces unified diff format', () => {
  const result = diffText('hello\nfoo', 'hello\nbar')
  const text = formatDiffAsText(result.lines)
  assert.match(text, /  hello/)
  assert.match(text, /- foo/)
  assert.match(text, /\+ bar/)
})

test('text-diff source file exports expected functions', () => {
  const source = readFileSync(new URL('../src/lib/text-diff.js', import.meta.url), 'utf8')
  assert.match(source, /export function diffText/)
  assert.match(source, /export function summarizeDiffStats/)
  assert.match(source, /export function formatDiffAsText/)
})

test('TextDiffWorkbench imports diffText and summarizeDiffStats', () => {
  const source = readFileSync(new URL('../src/components/TextDiffWorkbench.vue', import.meta.url), 'utf8')
  assert.match(source, /diffText/)
  assert.match(source, /summarizeDiffStats/)
  assert.match(source, /formatDiffAsText/)
})

test('TextDiffPage includes TextDiffWorkbench', () => {
  const source = readFileSync(new URL('../src/pages/TextDiffPage.vue', import.meta.url), 'utf8')
  assert.match(source, /TextDiffWorkbench/)
})

test('router includes text-diff route', () => {
  const source = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(source, /\/text-diff/)
  assert.match(source, /TextDiffPage/)
})

test('tools.js has text diff entry with path', () => {
  const entry = tools.find(t => t.id === 'diff-tools')
  assert.ok(entry)
  assert.equal(entry.path, '/text-diff')
  assert.equal(entry.badge, '已上线')
})
