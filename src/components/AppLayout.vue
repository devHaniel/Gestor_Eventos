<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const route = useRoute()
const { usuario, logout } = useAuth()

const sidebarAbierta = ref(false)

const itemsMenu = [
  { label: 'Dashboard', to: '/', icon: 'pi pi-chart-bar' },
  { label: 'Eventos', to: '/eventos', icon: 'pi pi-calendar' },
  { label: 'Personal', to: '/personal', icon: 'pi pi-users' },
  { label: 'Áreas', to: '/areas', icon: 'pi pi-th-large' },
]

async function cerrarSesion() {
  try {
    await logout()
    router.push('/login')
  } catch (err) {
    console.error('Error al cerrar sesión:', err)
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-slate-50">
    <!-- Sidebar móvil overlay -->
    <div
      v-if="sidebarAbierta"
      class="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
      @click="sidebarAbierta = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out',
        sidebarAbierta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Logo y Título -->
      <div class="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div class="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm">
          <i class="pi pi-sparkles text-lg"></i>
        </div>
        <div>
          <h1 class="text-base font-bold leading-tight tracking-wide text-white">Eventos & Catering</h1>
          <p class="text-xs text-slate-400">Sistema de Gestión</p>
        </div>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <router-link
          v-for="item in itemsMenu"
          :key="item.to"
          :to="item.to"
          @click="sidebarAbierta = false"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="[
            route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to))
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white',
          ]"
        >
          <i :class="[item.icon, 'text-base']"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Usuario y Logout en el footer de la barra -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/40">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0 font-semibold text-xs border border-slate-700">
              {{ (usuario?.email?.[0] || 'A').toUpperCase() }}
            </div>
            <div class="overflow-hidden">
              <p class="text-xs font-medium text-slate-200 truncate">
                {{ usuario?.email || 'Administrador' }}
              </p>
              <span class="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Admin</span>
            </div>
          </div>
        </div>
        <button
          @click="cerrarSesion"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-slate-800/80 rounded-md transition-colors border border-slate-800"
        >
          <i class="pi pi-sign-out text-xs"></i>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- Contenido Principal -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Header -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
        <div class="flex items-center gap-3">
          <button
            @click="sidebarAbierta = !sidebarAbierta"
            class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Abrir menú"
          >
            <i class="pi pi-bars text-lg"></i>
          </button>
          <slot name="header-title">
            <h2 class="text-lg font-semibold text-slate-800 truncate">
              {{ route.meta.title || 'Gestión de Eventos' }}
            </h2>
          </slot>
        </div>

        <div class="flex items-center gap-3">
          <slot name="header-actions"></slot>
        </div>
      </header>

      <!-- View Container -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <slot></slot>
      </main>
    </div>
  </div>
</template>
