import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { validateJsonSchema, isJsonType } from '../src/lib/schema.js'
import { generateTypescript } from '../src/lib/types.js'
import { generateJavaTypes } from '../src/lib/java.js'
import { diffJsonValues, summarizeDiff, formatDiffValue } from '../src/lib/diff.js'
import { parseByFormat, stringifyByFormat, getFormatExtension } from '../src/lib/convert.js'
import { readClipboardText, downloadTextFile, pickTextFile } from '../src/lib/io.js'
import { createEditorResetState, resetEditorWithValue } from '../src/lib/editorState.js'
import { getViewportInfo, PHONE_MAX_WIDTH, PAD_MAX_WIDTH } from '../src/lib/viewport.js'
import { tools } from '../src/data/tools.js'
import { highlightJava, copyText } from '../src/utils.js'


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
  assert.deepEqual(tools, [
    {
      id: 'json-tools',
      title: 'JSON 转换',
      description: '格式化、压缩、校验、树视图、Diff、TS / Java 类型生成',
      path: '/json',
      icon: 'json-symbol',
      badge: '已上线',
    },
    {
      id: 'timestamp-tools',
      title: '时间戳',
      description: '时间戳转换与时间格式处理能力即将上线',
      icon: 'toolbox',
      badge: '开发中',
    },
    {
      id: 'regex-tools',
      title: 'Regex',
      description: '正则表达式测试、提取与替换能力即将上线',
      icon: 'toolbox',
      badge: '开发中',
    },
    {
      id: 'more-tools',
      title: '更多功能',
      description: '敬请期待...',
      icon: 'toolbox',
      badge: '开发中',
    },
  ])
})

test('HomePage renders disabled placeholder cards for upcoming tools', () => {
  const source = readFileSync(new URL('../src/pages/HomePage.vue', import.meta.url), 'utf8')

  assert.match(source, /v-if="tool.path"/)
  assert.match(source, /v-else/)
  assert.match(source, /tool-card tool-card-disabled/)
})

test('router and 404 bridge provide a dedicated not found experience on GitHub Pages', () => {
  const routerSource = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  const pageSource = readFileSync(new URL('../src/pages/NotFoundPage.vue', import.meta.url), 'utf8')
  const bridgeSource = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8')

  assert.match(routerSource, /path:\s*'\/404'/)
  assert.match(routerSource, /path:\s*'\/:pathMatch\(\.\*\)\*'/)
  assert.match(routerSource, /path:\s*'\/404'/)
  assert.match(routerSource, /from:/)
  assert.match(pageSource, /404/)
  assert.match(pageSource, /返回首页/)
  assert.match(pageSource, /RouterLink|router\.replace|router\.push/)
  assert.match(bridgeSource, /location\.replace/)
  assert.match(bridgeSource, /#\/404/)
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
