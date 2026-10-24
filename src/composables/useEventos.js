import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

export function useEventos() {
  const listaEventos = ref([])
  const eventoActual = ref(null)
  const cargando = ref(false)
  const error = ref(null)

  async function listarEventos() {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('v_resumen_evento')
        .select('*')
        .order('fecha', { ascending: false })

      if (err) throw err
      listaEventos.value = data || []
      return listaEventos.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function obtenerEvento(id) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err
      eventoActual.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function crearEvento(datos) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('eventos')
        .insert(datos)
        .select()
        .single()

      if (err) throw err
      await listarEventos()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function actualizarEvento(id, datos) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('eventos')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      eventoActual.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function cambiarEstado(id, estado) {
    cargando.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('eventos')
        .update({ estado })
        .eq('id', id)

      if (err) throw err
      if (eventoActual.value?.id === id) {
        eventoActual.value = { ...eventoActual.value, estado }
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function eliminarEvento(id) {
    cargando.value = true
    error.value = null
    try {
      const { error: err } = await supabase.from('eventos').delete().eq('id', id)
      if (err) throw err
      listaEventos.value = listaEventos.value.filter((e) => e.evento_id !== id)
      if (eventoActual.value?.id === id) eventoActual.value = null
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  return {
    listaEventos,
    eventoActual,
    cargando,
    error,
    listarEventos,
    obtenerEvento,
    crearEvento,
    actualizarEvento,
    cambiarEstado,
    eliminarEvento,
  }
}
