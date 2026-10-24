import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

export function useFinanzas() {
  const resumen = ref(null)
  const listaGastos = ref([])
  const listaCobros = ref([])
  const cargando = ref(false)
  const error = ref(null)

  async function resumenEvento(eventoId) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('v_resumen_evento')
        .select('*')
        .eq('evento_id', eventoId)
        .single()
      if (err) throw err
      resumen.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function listarGastos(eventoId) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('gastos')
        .select('*')
        .eq('evento_id', eventoId)
        .order('fecha', { ascending: false })
      if (err) throw err
      listaGastos.value = data || []
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function crearGasto(datos, eventoId) {
    cargando.value = true
    error.value = null
    try {
      const payload = {
        evento_id: eventoId,
        concepto: datos.concepto,
        categoria: datos.categoria || null,
        monto: Number(datos.monto) || 0,
        fecha: datos.fecha || new Date().toISOString().slice(0, 10),
      }
      const { data, error: err } = await supabase
        .from('gastos')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await listarGastos(eventoId)
      await resumenEvento(eventoId)
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function eliminarGasto(id, eventoId) {
    cargando.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id)
      if (err) throw err
      await listarGastos(eventoId)
      await resumenEvento(eventoId)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function listarCobros(eventoId) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('cobros')
        .select('*')
        .eq('evento_id', eventoId)
        .order('fecha', { ascending: false })
      if (err) throw err
      listaCobros.value = data || []
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function crearCobro(datos, eventoId) {
    cargando.value = true
    error.value = null
    try {
      const payload = {
        evento_id: eventoId,
        concepto: datos.concepto,
        monto: Number(datos.monto) || 0,
        fecha: datos.fecha || new Date().toISOString().slice(0, 10),
        metodo: datos.metodo || 'transferencia',
      }
      const { data, error: err } = await supabase
        .from('cobros')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await listarCobros(eventoId)
      await resumenEvento(eventoId)
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function eliminarCobro(id, eventoId) {
    cargando.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('cobros')
        .delete()
        .eq('id', id)
      if (err) throw err
      await listarCobros(eventoId)
      await resumenEvento(eventoId)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  return {
    resumen,
    listaGastos,
    listaCobros,
    cargando,
    error,
    resumenEvento,
    listarGastos,
    crearGasto,
    eliminarGasto,
    listarCobros,
    crearCobro,
    eliminarCobro,
  }
}
