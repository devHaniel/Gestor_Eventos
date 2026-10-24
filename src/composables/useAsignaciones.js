import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

export function useAsignaciones() {
  const listaAsignaciones = ref([])
  const cargando = ref(false)
  const error = ref(null)

  async function listarAsignaciones(eventoId) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('v_pagos_asignacion')
        .select('*')
        .eq('evento_id', eventoId)
        .order('area')
        .order('personal')
      if (err) throw err

      const filas = data || []

      // La vista sólo expone los montos calculados; para poder editar
      // pago_individual / tarifa_hora se completan desde la tabla base.
      const areasIds = [...new Set(filas.map((f) => f.evento_area_id))]
      let crudas = []
      if (areasIds.length) {
        const { data: asignacionesCrudas, error: errCrudas } = await supabase
          .from('asignaciones')
          .select('id, pago_individual, tarifa_hora, notas')
          .in('evento_area_id', areasIds)
        if (errCrudas) throw errCrudas
        crudas = asignacionesCrudas || []
      }

      const mapaCrudas = new Map(crudas.map((a) => [a.id, a]))
      const combinadas = filas.map((fila) => {
        const cruda = mapaCrudas.get(fila.asignacion_id) || {}
        return {
          ...fila,
          pago_individual: cruda.pago_individual ?? null,
          tarifa_hora: cruda.tarifa_hora ?? null,
          notas: cruda.notas ?? null,
        }
      })

      listaAsignaciones.value = combinadas
      return combinadas
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function asignarPersonal(eventoAreaId, personalId, datos = {}, eventoId = null) {
    cargando.value = true
    error.value = null
    try {
      const payload = {
        evento_area_id: eventoAreaId,
        personal_id: personalId,
        rol_en_evento: datos.rol_en_evento || null,
        horas: datos.horas !== undefined && datos.horas !== null ? Number(datos.horas) : null,
        tarifa_hora: datos.tarifa_hora !== undefined && datos.tarifa_hora !== null ? Number(datos.tarifa_hora) : null,
        pago_individual: datos.pago_individual !== undefined && datos.pago_individual !== null ? Number(datos.pago_individual) : null,
        notas: datos.notas || null,
      }

      const { data, error: err } = await supabase
        .from('asignaciones')
        .insert(payload)
        .select()
        .single()
      if (err) throw err

      if (eventoId) {
        await listarAsignaciones(eventoId)
      }
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function actualizarAsignacion(id, datos = {}, eventoId = null) {
    cargando.value = true
    error.value = null
    try {
      const payload = {}
      if (datos.rol_en_evento !== undefined) payload.rol_en_evento = datos.rol_en_evento
      if (datos.horas !== undefined) payload.horas = datos.horas !== null && datos.horas !== '' ? Number(datos.horas) : null
      if (datos.tarifa_hora !== undefined) payload.tarifa_hora = datos.tarifa_hora !== null && datos.tarifa_hora !== '' ? Number(datos.tarifa_hora) : null
      if (datos.pago_individual !== undefined) payload.pago_individual = datos.pago_individual !== null && datos.pago_individual !== '' ? Number(datos.pago_individual) : null
      if (datos.notas !== undefined) payload.notas = datos.notas

      const { data, error: err } = await supabase
        .from('asignaciones')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (err) throw err

      if (eventoId) {
        await listarAsignaciones(eventoId)
      }
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function quitarAsignacion(id, eventoId = null) {
    cargando.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('asignaciones')
        .delete()
        .eq('id', id)
      if (err) throw err

      if (eventoId) {
        await listarAsignaciones(eventoId)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  return {
    listaAsignaciones,
    cargando,
    error,
    listarAsignaciones,
    asignarPersonal,
    actualizarAsignacion,
    quitarAsignacion,
  }
}
