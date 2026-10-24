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
  <div class="min-h-screen flex bg-slate-100/70">
    <!-- Sidebar móvil overlay -->
    <div
      v-if="sidebarAbierta"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
      @click="sidebarAbierta = false"
    ></div>

    <!-- Sidebar Enterprise -->
    <aside
      :class="[
        'fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800',
        sidebarAbierta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Logo y Título Corporativo -->
      <div class="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
        <div class="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
          <i class="pi pi-calendar text-base"></i>
        </div>
        <div class="overflow-hidden">
          <h1 class="text-sm font-semibold tracking-tight text-white truncate">Gestor de Eventos</h1>
          <p class="text-[11px] text-slate-400 font-medium">Banquetería & Catering</p>
        </div>
      </div>

      <!-- Navegación con items limpios -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in itemsMenu"
          :key="item.to"
          :to="item.to"
          @click="sidebarAbierta = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="[
            route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to))
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
          ]"
        >
          <i :class="[item.icon, 'text-base', route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to)) ? 'text-emerald-400' : 'text-slate-400']"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Usuario y Logout con PrimeVue Avatar y Button -->
      <div class="p-3 border-t border-slate-800 bg-slate-950/60">
        <div class="flex items-center gap-3 p-2 mb-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <Avatar
            :label="(usuario?.email?.[0] || 'A').toUpperCase()"
            shape="circle"
            class="!bg-emerald-700 !text-white !font-bold !text-xs shrink-0"
          />
          <div class="overflow-hidden flex-1 min-w-0">
            <p class="text-xs font-medium text-slate-200 truncate">
              {{ usuario?.email || 'Administrador' }}
            </p>
            <Tag value="Admin" severity="success" class="!text-[9px] !py-0 !px-1.5 font-bold uppercase tracking-wider" />
          </div>
        </div>
        <Button
          label="Cerrar sesión"
          icon="pi pi-sign-out"
          severity="secondary"
          variant="outlined"
          size="small"
          fluid
          class="!text-xs !text-slate-300 hover:!text-rose-400 !border-slate-700 hover:!border-rose-900/50"
          @click="cerrarSesion"
        />
      </div>
    </aside>

    <!-- Contenido Principal -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Header -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-2xs">
        <div class="flex items-center gap-3 min-w-0">
          <Button
            icon="pi pi-bars"
            text
            severity="secondary"
            class="lg:hidden"
            @click="sidebarAbierta = !sidebarAbierta"
            aria-label="Abrir menú"
          />
          <slot name="header-title">
            <h2 class="text-base sm:text-lg font-bold text-slate-900 truncate">
              {{ route.meta.title || 'Gestión de Eventos' }}
            </h2>
          </slot>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
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
