<template>
  <div class="not-found-page">
    <section class="not-found-card">
      <p class="home-kicker">404</p>
      <h1>页面不存在</h1>
      <p class="home-subtitle">
        你访问的页面不存在或链接已失效，可以返回首页继续使用工具。
      </p>
      <p
        v-if="decodedFrom"
        class="not-found-path"
      >
        请求地址：{{ decodedFrom }}
      </p>
      <div class="not-found-actions">
        <RouterLink
          to="/"
          class="btn btn-primary"
        >
          返回首页
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const decodedFrom = computed(() => {
  const from = route.query.from
  const value = Array.isArray(from) ? from[0] : from

  if (!value || typeof value !== 'string') {
    return ''
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
})
</script>
