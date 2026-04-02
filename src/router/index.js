import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import JsonToolsPage from '../pages/JsonToolsPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/json', name: 'json-tools', component: JsonToolsPage },
  ],
})
