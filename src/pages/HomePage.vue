<template>
  <div class="home-page">
    <section class="home-hero">
      <p class="home-kicker">
        Tools
      </p>
      <h1>工具集</h1>
      <p class="home-subtitle">
        面向开发与数据处理的常用工具集合，当前已提供 JSON 转换工作台。
      </p>
    </section>

    <section class="tool-grid">
      <template
        v-for="tool in tools"
        :key="tool.id"
      >
        <RouterLink
          v-if="tool.path"
          :to="tool.path"
          class="tool-card"
        >
          <div class="tool-card-icon">
            <AppIcon
              :name="tool.icon"
              :size="20"
            />
          </div>
          <div class="tool-card-body">
            <div class="tool-card-head">
              <h2>{{ tool.title }}</h2>
              <span class="tool-card-badge">{{ tool.badge }}</span>
            </div>
            <p>{{ tool.description }}</p>
          </div>
        </RouterLink>

        <div
          v-else
          class="tool-card tool-card-disabled"
        >
          <div class="tool-card-icon">
            <AppIcon
              :name="tool.icon"
              :size="20"
            />
          </div>
          <div class="tool-card-body">
            <div class="tool-card-head">
              <h2>{{ tool.title }}</h2>
              <span class="tool-card-badge tool-card-badge-pending">{{ tool.badge }}</span>
            </div>
            <p>{{ tool.description }}</p>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { tools } from '../data/tools.js'
</script>
