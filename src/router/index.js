import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import JsonToolsPage from '../pages/JsonToolsPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/json', name: 'json-tools', component: JsonToolsPage },
    { path: '/404', name: 'not-found', component: NotFoundPage },
    {
      path: '/:pathMatch(.*)*',
      redirect: (to) => ({
        path: '/404',
        query: {
          from: typeof to.fullPath === 'string' ? to.fullPath : '',
        },
      }),
    },
  ],
})
