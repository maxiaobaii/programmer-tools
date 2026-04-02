<template>
  <div
    class="line-numbered-output"
    :class="{ 'line-numbered-output--on': showLineNumbers }"
  >
    <!-- line gutter -->
    <div
      v-if="showLineNumbers"
      class="line-gutter"
      aria-hidden="true"
    >
      <div
        v-for="n in lineCount"
        :key="n"
        class="line-gutter-num"
      >{{ n }}</div>
    </div>

    <!-- content -->
    <div
      v-if="html"
      class="output-area line-content"
      :class="extraClass"
      v-html="html"
    />
    <div
      v-else
      class="output-area line-content"
      :class="extraClass"
    >{{ text }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 纯文本内容（与 html 二选一） */
  text: {
    type: String,
    default: '',
  },
  /** 已高亮的 HTML 内容（与 text 二选一） */
  html: {
    type: String,
    default: '',
  },
  /** 是否显示行号 */
  showLineNumbers: {
    type: Boolean,
    default: false,
  },
  /** 追加到 output-area 上的 CSS class */
  extraClass: {
    type: String,
    default: '',
  },
})

const rawText = computed(() => {
  if (props.text) return props.text
  if (props.html) return props.html.replace(/<[^>]+>/g, '')
  return ''
})

const lineCount = computed(() => {
  if (!rawText.value) return 0
  return rawText.value.split('\n').length
})
</script>
