<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuth } from '../composables/useAuth.js'
import { supabase } from '../lib/supabase.js'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { login } = useAuth()

const pestana = ref('login') // 'login' | 'registro'
const email = ref('')
const password = ref('')
const cargando = ref(false)

async function handleSubmit() {
  if (!email.value || !password.value) {
    toast.add({
      severity: 'warn',
      summary: 'Campos requeridos',
      detail: 'Por favor ingresa tu correo electrónico y tu contraseña.',
      life: 4000,
    })
    return
  }

  if (password.value.length < 6) {
    toast.add({
      severity: 'warn',
      summary: 'Contraseña muy corta',
      detail: 'La contraseña debe tener al menos 6 caracteres.',
      life: 4000,
    })
    return
  }

  cargando.value = true
  try {
    if (pestana.value === 'registro') {
      const { data, error } = await supabase.auth.signUp({
        email: email.value.trim(),
        password: password.value,
      })
      if (error) throw error

      if (data?.session) {
        toast.add({
          severity: 'success',
          summary: 'Cuenta de Administrador Creada',
          detail: 'Bienvenido al Gestor de Eventos.',
          life: 3000,
        })
        const destino = route.query.redirect || '/'
        router.push(destino)
      } else {
        toast.add({
          severity: 'info',
          summary: 'Registro recibido',
          detail: 'Si tu proyecto de Supabase tiene confirmación de correo activa, por favor verifica tu bandeja de entrada o inicia sesión.',
          life: 6000,
        })
        pestana.value = 'login'
      }
    } else {
      await login(email.value.trim(), password.value)
      toast.add({
        severity: 'success',
        summary: 'Sesión Iniciada',
        detail: 'Acceso autorizado correctamente.',
        life: 2500,
      })
      const destino = route.query.redirect || '/'
      router.push(destino)
    }
  } catch (err) {
    console.error('Error de autenticación:', err)
    let mensaje = err.message || 'Error al autenticar'
    if (err.message?.includes('Invalid login credentials')) {
      mensaje = 'Credenciales inválidas. Revisa que el correo y contraseña sean correctos.'
    } else if (err.message?.includes('Email not confirmed')) {
      mensaje = 'El correo electrónico aún no ha sido confirmado.'
    } else if (err.message?.includes('User already registered')) {
      mensaje = 'Ya existe un usuario con este correo. Cambia a Iniciar Sesión.'
    }

    toast.add({
      severity: 'error',
      summary: 'Error de Acceso',
      detail: mensaje,
      life: 5000,
    })
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
    <!-- Fondo decorativo sutil -->
    <div class="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">
      <!-- Encabezado con Identidad de Marca -->
      <div class="p-8 pb-6 text-center bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white mb-3 shadow-md shadow-emerald-600/20">
          <i class="pi pi-sparkles text-2xl"></i>
        </div>
        <h1 class="text-xl font-extrabold text-slate-800 tracking-tight">Gestor de Eventos & Catering</h1>
        <p class="text-xs text-slate-500 mt-1">
          Control de áreas, asignación de personal y finanzas en tiempo real
        </p>

        <!-- Selector de Modo (Login / Registro) -->
        <div class="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-xl mt-5">
          <button
            type="button"
            @click="pestana = 'login'"
            class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="pestana === 'login' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            @click="pestana = 'registro'"
            class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="pestana === 'registro' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
          >
            Registrar Administrador
          </button>
        </div>
      </div>

      <!-- Formulario -->
      <div class="p-8 pt-6">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Correo Electrónico
            </label>
            <div class="relative">
              <i class="pi pi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <InputText
                v-model="email"
                type="email"
                required
                placeholder="admin@empresa.com"
                class="w-full !pl-10 !py-2.5 text-sm"
                autocomplete="username"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <i class="pi pi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <InputText
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full !pl-10 !py-2.5 text-sm"
                autocomplete="current-password"
              />
            </div>
            <p v-if="pestana === 'registro'" class="text-[11px] text-slate-400 mt-1">
              Mínimo 6 caracteres
            </p>
          </div>

          <Button
            type="submit"
            :loading="cargando"
            :label="pestana === 'login' ? 'Acceder al Gestor' : 'Crear Cuenta de Administrador'"
            :icon="pestana === 'login' ? 'pi pi-sign-in' : 'pi pi-user-plus'"
            class="w-full !py-2.5 !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-bold text-sm shadow-sm mt-2"
          />
        </form>

        <div class="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-400">
          <i class="pi pi-shield mr-1"></i>
          Conexión segura directa a base de datos Supabase
        </div>
      </div>
    </div>
  </div>
</template>
