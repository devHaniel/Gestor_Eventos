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
const opcionesModo = [
  { label: 'Iniciar Sesión', value: 'login' },
  { label: 'Registrar Admin', value: 'registro' },
]

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
  <div class="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
    <div class="max-w-md w-full">
      <Card class="!shadow-xl !border !border-slate-800 !bg-slate-900/90 overflow-hidden">
        <template #header>
          <!-- Encabezado Institucional -->
          <div class="p-6 pb-4 text-center border-b border-slate-800">
            <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
              <i class="pi pi-calendar text-xl"></i>
            </div>
            <h1 class="text-lg font-bold text-white tracking-tight">Gestor de Eventos & Catering</h1>
            <p class="text-xs text-slate-400 mt-1">
              Plataforma de gestión operativa, asignaciones y rentabilidad
            </p>

            <!-- Selector de Modo con PrimeVue SelectButton -->
            <div class="mt-4 flex justify-center">
              <SelectButton
                v-model="pestana"
                :options="opcionesModo"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
                class="text-xs"
              />
            </div>
          </div>
        </template>

        <template #content>
          <!-- Formulario con PrimeVue Components -->
          <form @submit.prevent="handleSubmit" class="space-y-4 pt-2">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <IconField class="w-full">
                <InputIcon class="pi pi-envelope text-slate-400" />
                <InputText
                  v-model="email"
                  type="email"
                  required
                  placeholder="admin@empresa.com"
                  class="w-full text-sm"
                  autocomplete="username"
                />
              </IconField>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Contraseña
              </label>
              <IconField class="w-full">
                <InputIcon class="pi pi-lock text-slate-400" />
                <InputText
                  v-model="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  class="w-full text-sm"
                  autocomplete="current-password"
                />
              </IconField>
              <p v-if="pestana === 'registro'" class="text-[11px] text-slate-400 mt-1">
                Mínimo 6 caracteres
              </p>
            </div>

            <Button
              type="submit"
              :loading="cargando"
              :label="pestana === 'login' ? 'Acceder al Gestor' : 'Crear Cuenta de Administrador'"
              :icon="pestana === 'login' ? 'pi pi-sign-in' : 'pi pi-user-plus'"
              fluid
              class="mt-4 font-semibold text-sm"
            />
          </form>

          <div class="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
            <i class="pi pi-shield mr-1"></i>
            Autenticación segura respaldada por Supabase
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
