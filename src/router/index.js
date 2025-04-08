import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import PacketFenceTest from '../views/PacketFenceTest.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/debug',
    name: 'PacketFenceTestDebug',
    component: PacketFenceTest
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 