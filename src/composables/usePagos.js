import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

export function usePagos() {
  const listaPagos = ref([])
  const cargando = ref(false)
  const error = ref(null)

  async function listarPagos(asignacionId) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('pagos')
        .select('*')
        .eq('asignacion_id', asignacionId)
        .order('fecha', { ascending: false })
      if (err) throw err
      listaPagos.value = data || []
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function registrarPago({ asignacion_id, monto, metodo = 'transferencia', referencia = null, notas = null, fecha = null }) {
    cargando.value = true
    error.value = null
    try {
      const payload = {
        asignacion_id,
        monto: Number(monto),
        metodo,
        referencia: referencia || null,
        notas: notas || null,
        fecha: fecha || new Date().toISOString().slice(0, 10),
      }

      const { data, error: err } = await supabase
        .from('pagos')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function eliminarPago(id) {
    cargando.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('pagos')
        .delete()
        .eq('id', id)
      if (err) throw err
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function pagarTodoPendiente(eventoId, metodo = 'transferencia', referencia = 'Liquidación total pendiente') {
    cargando.value = true
    error.value = null
    try {
      const { data: asignacionesPendientes, error: errFetch } = await supabase
        .from('v_pagos_asignacion')
        .select('*')
        .eq('evento_id', eventoId)
        .gt('monto_pendiente', 0)

      if (errFetch) throw errFetch
      if (!asignacionesPendientes || asignacionesPendientes.length === 0) {
        return []
      }

      const fechaHoy = new Date().toISOString().slice(0, 10)
      const pagosAInsertar = asignacionesPendientes.map((asig) => ({
        asignacion_id: asig.asignacion_id,
        monto: Number(asig.monto_pendiente),
        metodo,
        referencia,
        fecha: fechaHoy,
      }))

      const { data, error: errInsert } = await supabase
        .from('pagos')
        .insert(pagosAInsertar)
        .select()

      if (errInsert) throw errInsert
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function pagarPendienteArea(eventoAreaId, metodo = 'transferencia', referencia = 'Liquidación área pendiente') {
    cargando.value = true
    error.value = null
    try {
      const { data: asignacionesPendientes, error: errFetch } = await supabase
        .from('v_pagos_asignacion')
        .select('*')
        .eq('evento_area_id', eventoAreaId)
        .gt('monto_pendiente', 0)

      if (errFetch) throw errFetch
      if (!asignacionesPendientes || asignacionesPendientes.length === 0) {
        return []
      }

      const fechaHoy = new Date().toISOString().slice(0, 10)
      const pagosAInsertar = asignacionesPendientes.map((asig) => ({
        asignacion_id: asig.asignacion_id,
        monto: Number(asig.monto_pendiente),
        metodo,
        referencia,
        fecha: fechaHoy,
      }))

      const { data, error: errInsert } = await supabase
        .from('pagos')
        .insert(pagosAInsertar)
        .select()

      if (errInsert) throw errInsert
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  return {
    listaPagos,
    cargando,
    error,
    listarPagos,
    registrarPago,
    eliminarPago,
    pagarTodoPendiente,
    pagarPendienteArea,
  }
}
