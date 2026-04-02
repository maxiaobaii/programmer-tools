import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import JsonToolsPage from '../pages/JsonToolsPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/json', name: 'json-tools', component: JsonToolsPage },
  ],
})
