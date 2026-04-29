import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import JsonToolsPage from '../pages/JsonToolsPage.vue'
import TimestampToolsPage from '../pages/TimestampToolsPage.vue'
import RegexToolsPage from '../pages/RegexToolsPage.vue'
import Base64ToolsPage from '../pages/Base64ToolsPage.vue'
import UrlEncodeToolsPage from '../pages/UrlEncodeToolsPage.vue'
import SqlToolsPage from '../pages/SqlToolsPage.vue'
import TextDiffPage from '../pages/TextDiffPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/json', name: 'json-tools', component: JsonToolsPage },
    { path: '/timestamp', name: 'timestamp-tools', component: TimestampToolsPage },
    { path: '/regex', name: 'regex-tools', component: RegexToolsPage },
    { path: '/base64', name: 'base64-tools', component: Base64ToolsPage },
    { path: '/url', name: 'url-tools', component: UrlEncodeToolsPage },
    { path: '/sql', name: 'sql-tools', component: SqlToolsPage },
    { path: '/text-diff', name: 'text-diff', component: TextDiffPage },
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
