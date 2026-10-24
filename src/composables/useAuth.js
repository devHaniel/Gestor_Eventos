import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const usuario = ref(null)
const sesionInicializada = ref(false)

// Inicializar sesión y escuchar cambios
supabase.auth.getSession().then(({ data: { session } }) => {
  usuario.value = session?.user ?? null
  sesionInicializada.value = true
})

supabase.auth.onAuthStateChange((_event, session) => {
  usuario.value = session?.user ?? null
  sesionInicializada.value = true
})

export function useAuth() {
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    usuario.value = data.user
    return data
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    usuario.value = null
  }

  async function esperarSesion() {
    if (sesionInicializada.value) return usuario.value
    return new Promise((resolve) => {
      const stop = setInterval(() => {
        if (sesionInicializada.value) {
          clearInterval(stop)
          resolve(usuario.value)
        }
      }, 50)
    })
  }

  return {
    usuario,
    sesionInicializada,
    login,
    logout,
    esperarSesion,
  }
}
