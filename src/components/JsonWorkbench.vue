<template>
  <div class="app-layout json-workbench">
    <nav
      class="navbar"
      :class="{ 'navbar-mobile': isPhone }"
    >
      <div class="navbar-top-row">
        <RouterLink
          class="navbar-home-link"
          to="/"
        >
          <AppIcon name="home-filled" />
          返回首页
        </RouterLink>
        <!-- <button
          class="theme-toggle"
          :title="isDark ? '切换到亮色模式' : '切换到深色模式'"
          @click="toggleTheme"
        >
          <AppIcon
            :name="isDark ? 'sun' : 'moon'"
            :size="19"
          />
        </button> -->
      </div>
      <div
        class="navbar-tabs"
        :class="{ 'navbar-tabs-mobile': isPhone }"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="nav-tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <AppIcon
            :name="tab.icon"
            :size="16"
            class="nav-tab-icon"
          />
          {{ tab.label }}
        </button>
      </div>
    </nav>

    <div class="main-area">
      <FormatTab v-show="activeTab === 'format'" />
      <CompressTab v-show="activeTab === 'compress'" />
      <ValidateTab v-show="activeTab === 'validate'" />
      <EscapeTab v-show="activeTab === 'escape'" />
      <TreeTab v-show="activeTab === 'tree'" />
      <ConvertTab v-show="activeTab === 'convert'" />
      <JsonPathTab v-show="activeTab === 'jsonpath'" />
      <TypesTab v-show="activeTab === 'types'" />
      <JavaTypesTab v-show="activeTab === 'java'" />
      <DiffTab v-show="activeTab === 'diff'" />
    </div>

    <div
      v-if="showCopy"
      class="copy-flash"
    >
      ✓ 已复制到剪贴板
    </div>
  </div>
</template>

<script setup>
import { onMounted, provide, ref } from 'vue'
import { RouterLink } from 'vue-router'
import FormatTab from './FormatTab.vue'
import CompressTab from './CompressTab.vue'
import ValidateTab from './ValidateTab.vue'
import EscapeTab from './EscapeTab.vue'
import TreeTab from './TreeTab.vue'
import ConvertTab from './ConvertTab.vue'
import JsonPathTab from './JsonPathTab.vue'
import TypesTab from './TypesTab.vue'
import JavaTypesTab from './JavaTypesTab.vue'
import DiffTab from './DiffTab.vue'
import AppIcon from './AppIcon.vue'
import { useViewport } from '../composables/useViewport.js'

const activeTab = ref('format')
const showCopy = ref(false)
const isDark = ref(false)
const { isPhone } = useViewport()

const tabs = [
  { id: 'format', icon: 'format', label: '格式化' },
  { id: 'compress', icon: 'compress', label: '压缩' },
  { id: 'validate', icon: 'validate', label: '校验' },
  { id: 'escape', icon: 'escape', label: '转义' },
  { id: 'tree', icon: 'tree', label: '树视图' },
  { id: 'convert', icon: 'convert', label: '格式转换' },
  { id: 'jsonpath', icon: 'jsonpath', label: 'JSONPath' },
  { id: 'types', icon: 'types', label: 'TS 类型' },
  { id: 'java', icon: 'java', label: 'Java 类型' },
  { id: 'diff', icon: 'diff', label: 'Diff 对比' },
]

function applyTheme(theme) {
  const isDarkTheme = theme === 'dark'
  isDark.value = isDarkTheme
  document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light')
  localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light')
}

function toggleTheme() {
  applyTheme(isDark.value ? 'light' : 'dark')
}

onMounted(() => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
  applyTheme(currentTheme)
})

function flashCopy() {
  showCopy.value = true
  setTimeout(() => {
    showCopy.value = false
  }, 1600)
}

provide('flashCopy', flashCopy)
</script>
