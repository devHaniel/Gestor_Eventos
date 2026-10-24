import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'
import { AREAS_PREDEFINIDAS } from '../utils/estados.js'

export function useAreas() {
  const catalogoAreas = ref([])
  const areasEvento = ref([])
  const cargando = ref(false)
  const error = ref(null)

  async function listarAreas() {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('areas')
        .select('*')
        .order('nombre')
      if (err) throw err
      catalogoAreas.value = data || []
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function crearArea(datos) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('areas')
        .insert({
          nombre: datos.nombre,
          descripcion: datos.descripcion || null,
          activa: datos.activa ?? true,
        })
        .select()
        .single()
      if (err) throw err
      await listarAreas()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function crearAreasSugeridas() {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('areas')
        .insert(
          AREAS_PREDEFINIDAS.map((a) => ({
            nombre: a.nombre,
            descripcion: a.descripcion,
            activa: true,
          }))
        )
        .select()
      if (err) throw err
      await listarAreas()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function actualizarArea(id, datos) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('areas')
        .update(datos)
        .eq('id', id)
        .select()
        .single()
      if (err) throw err
      await listarAreas()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function listarAreasEvento(eventoId) {
    cargando.value = true
    error.value = null
    try {
      const [resumenRes, eventoAreasRes] = await Promise.all([
        supabase
          .from('v_resumen_areas')
          .select('*')
          .eq('evento_id', eventoId),
        supabase
          .from('evento_areas')
          .select('*, areas(nombre, descripcion)')
          .eq('evento_id', eventoId),
      ])

      if (resumenRes.error) throw resumenRes.error
      if (eventoAreasRes.error) throw eventoAreasRes.error

      const resumenMap = new Map()
      for (const r of resumenRes.data || []) {
        resumenMap.set(r.evento_area_id, r)
      }

      const combinadas = (eventoAreasRes.data || []).map((ea) => {
        const res = resumenMap.get(ea.id) || {}
        return {
          id: ea.id, // evento_area_id
          evento_area_id: ea.id,
          evento_id: ea.evento_id,
          area_id: ea.area_id,
          area_nombre: ea.areas?.nombre || res.area || 'Área',
          tipo_pago: ea.tipo_pago,
          metodo_reparto: ea.metodo_reparto,
          monto_area: ea.monto_area,
          num_personas: res.num_personas ?? 0,
          costo_area: res.costo_area ?? 0,
          pagado_area: res.pagado_area ?? 0,
        }
      })

      areasEvento.value = combinadas
      return combinadas
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function activarAreaEnEvento(eventoId, areaId, config = {}) {
    cargando.value = true
    error.value = null
    try {
      const payload = {
        evento_id: eventoId,
        area_id: areaId,
        tipo_pago: config.tipo_pago || 'individual',
        metodo_reparto: config.tipo_pago === 'por_area' ? (config.metodo_reparto || 'equitativo') : null,
        monto_area: config.tipo_pago === 'por_area' ? (Number(config.monto_area) || 0) : null,
      }

      const { data, error: err } = await supabase
        .from('evento_areas')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await listarAreasEvento(eventoId)
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function actualizarAreaEvento(id, config, eventoId = null) {
    cargando.value = true
    error.value = null
    try {
      const payload = {
        tipo_pago: config.tipo_pago,
        metodo_reparto: config.tipo_pago === 'por_area' ? config.metodo_reparto : null,
        monto_area: config.tipo_pago === 'por_area' ? Number(config.monto_area) || 0 : null,
      }

      const { data, error: err } = await supabase
        .from('evento_areas')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (err) throw err
      if (eventoId) {
        await listarAreasEvento(eventoId)
      }
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  async function quitarAreaDeEvento(id, eventoId = null) {
    cargando.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('evento_areas')
        .delete()
        .eq('id', id)
      if (err) throw err
      if (eventoId) {
        await listarAreasEvento(eventoId)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  return {
    catalogoAreas,
    areasEvento,
    cargando,
    error,
    listarAreas,
    crearArea,
    crearAreasSugeridas,
    actualizarArea,
    listarAreasEvento,
    activarAreaEnEvento,
    actualizarAreaEvento,
    quitarAreaDeEvento,
  }
}
