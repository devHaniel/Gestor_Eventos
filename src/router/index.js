import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false, title: 'Iniciar Sesión' },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard General' },
  },
  {
    path: '/eventos',
    name: 'eventos',
    component: () => import('../views/EventosView.vue'),
    meta: { requiresAuth: true, title: 'Gestión de Eventos' },
  },
  {
    path: '/eventos/:id',
    name: 'evento-detalle',
    component: () => import('../views/EventoDetalleView.vue'),
    meta: { requiresAuth: true, title: 'Detalle de Evento' },
  },
  {
    path: '/personal',
    name: 'personal',
    component: () => import('../views/PersonalView.vue'),
    meta: { requiresAuth: true, title: 'Catálogo de Personal' },
  },
  {
    path: '/areas',
    name: 'areas',
    component: () => import('../views/AreasView.vue'),
    meta: { requiresAuth: true, title: 'Catálogo de Áreas' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const { esperarSesion } = useAuth()
  const usuario = await esperarSesion()

  const requiresAuth = to.meta.requiresAuth ?? true

  if (requiresAuth && !usuario) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && usuario) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
