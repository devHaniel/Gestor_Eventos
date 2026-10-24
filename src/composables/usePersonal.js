import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

export function usePersonal() {
  const listaPersonal = ref([])
  const listaResumen = ref([])
  const cargando = ref(false)
  const error = ref(null)

  async function listarPersonal() {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.from('personal').select('*').order('nombre')
      if (err) throw err
      listaPersonal.value = data || []
      return listaPersonal.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function crearPersonal(datos) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('personal')
        .insert(datos)
        .select()
        .single()

      if (err) throw err
      await listarPersonal()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function actualizarPersonal(id, datos) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('personal')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      await listarPersonal()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function desactivarPersonal(id) {
    return actualizarPersonal(id, { activo: false })
  }

  async function activarPersonal(id) {
    return actualizarPersonal(id, { activo: true })
  }

  async function resumenPersonal() {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.from('v_resumen_personal').select('*')
      if (err) throw err
      listaResumen.value = data || []
      return listaResumen.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  return {
    listaPersonal,
    listaResumen,
    cargando,
    error,
    listarPersonal,
    crearPersonal,
    actualizarPersonal,
    desactivarPersonal,
    activarPersonal,
    resumenPersonal,
  }
}
