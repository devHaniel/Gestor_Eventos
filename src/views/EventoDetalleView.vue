<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import AppLayout from '../components/AppLayout.vue'
import ResumenFinanciero from '../components/ResumenFinanciero.vue'
import AreaEventoCard from '../components/AreaEventoCard.vue'
import AsignarPersonalDialog from '../components/AsignarPersonalDialog.vue'
import PagoDialog from '../components/PagoDialog.vue'
import EventoForm from '../components/EventoForm.vue'

import { useEventos } from '../composables/useEventos.js'
import { useAreas } from '../composables/useAreas.js'
import { usePersonal } from '../composables/usePersonal.js'
import { useAsignaciones } from '../composables/useAsignaciones.js'
import { usePagos } from '../composables/usePagos.js'
import { useFinanzas } from '../composables/useFinanzas.js'
import { formatearMoneda, formatearFecha, formatearHora } from '../utils/formato.js'
import { ESTADOS_EVENTO, etiquetaEstado, severidadEstado, severidadEstadoPago, etiquetaEstadoPago, METODOS_COBRO } from '../utils/estados.js'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const eventoId = route.params.id

// Composables
const { eventoActual, obtenerEvento, actualizarEvento, cambiarEstado, eliminarEvento } = useEventos()
const { catalogoAreas, areasEvento, listarAreas, listarAreasEvento, activarAreaEnEvento, actualizarAreaEvento, quitarAreaDeEvento, crearAreasSugeridas } = useAreas()
const { listaPersonal, listarPersonal } = usePersonal()
const { listaAsignaciones, listarAsignaciones, asignarPersonal, actualizarAsignacion, quitarAsignacion } = useAsignaciones()
const { registrarPago, pagarTodoPendiente, pagarPendienteArea } = usePagos()
const { resumen, listaGastos, listaCobros, resumenEvento, listarGastos, crearGasto, eliminarGasto, listarCobros, crearCobro, eliminarCobro } = useFinanzas()

const pestanaActiva = ref('0')
const cargandoTodo = ref(true)

// Modales y estados UI
const dialogEditarEvento = ref(false)
const dialogActivarArea = ref(false)
const dialogAsignarPersonal = ref(false)
const dialogPago = ref(false)
const dialogNuevoGasto = ref(false)
const dialogNuevoCobro = ref(false)

const areaParaAsignar = ref(null)
const asignacionParaPagar = ref(null)
const guardando = ref(false)
const busquedaPagos = ref('')

// Formularios locales
const nuevaAreaConfig = ref({
  area_id: null,
  tipo_pago: 'individual',
  metodo_reparto: 'equitativo',
  monto_area: 0,
})

const nuevoGasto = ref({
  concepto: '',
  categoria: 'Insumos',
  monto: 0,
  fecha: new Date().toISOString().slice(0, 10),
})

const nuevoCobro = ref({
  concepto: 'Anticipo cliente',
  monto: 0,
  metodo: 'transferencia',
  fecha: new Date().toISOString().slice(0, 10),
})

// Áreas del catálogo que aún no están en este evento
const areasDisponiblesParaAgregar = computed(() => {
  const idsActivas = new Set(areasEvento.value.map((a) => a.area_id))
  return catalogoAreas.value.filter((a) => a.activa && !idsActivas.has(a.id))
})

// Total pendiente de pago al personal
const totalPendientePersonal = computed(() => {
  return listaAsignaciones.value.reduce(
    (sum, a) => sum + (Number(a.monto_pendiente) || 0),
    0
  )
})

// Total gastos extras sumados
const sumaTotalGastos = computed(() => {
  return listaGastos.value.reduce((sum, g) => sum + (Number(g.monto) || 0), 0)
})

// Total cobros al cliente sumados
const sumaTotalCobros = computed(() => {
  return listaCobros.value.reduce((sum, c) => sum + (Number(c.monto) || 0), 0)
})

// Filtro de la tabla de pagos
const asignacionesFiltradasPagos = computed(() => {
  if (!busquedaPagos.value.trim()) return listaAsignaciones.value
  const term = busquedaPagos.value.toLowerCase()
  return listaAsignaciones.value.filter(
    (a) =>
      a.personal?.toLowerCase().includes(term) ||
      a.area?.toLowerCase().includes(term) ||
      a.rol_en_evento?.toLowerCase().includes(term)
  )
})

async function cargarTodo() {
  cargandoTodo.value = true
  try {
    await Promise.all([
      obtenerEvento(eventoId),
      resumenEvento(eventoId),
      listarAreas(),
      listarAreasEvento(eventoId),
      listarPersonal(),
      listarAsignaciones(eventoId),
      listarGastos(eventoId),
      listarCobros(eventoId),
    ])
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al cargar evento',
      detail: err.message,
      life: 5000,
    })
  } finally {
    cargandoTodo.value = false
  }
}

onMounted(() => {
  cargarTodo()
})

// Manejo de Estado del Evento
async function onCambiarEstado(nuevoEstado) {
  try {
    await cambiarEstado(eventoId, nuevoEstado)
    await resumenEvento(eventoId)
    toast.add({
      severity: 'success',
      summary: 'Estado Actualizado',
      detail: `El evento ahora está en estado "${etiquetaEstado(nuevoEstado)}".`,
      life: 3000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al cambiar estado',
      detail: err.message,
      life: 5000,
    })
  }
}

// Guardar edición general del evento
async function guardarDatosEvento(datos) {
  guardando.value = true
  try {
    await actualizarEvento(eventoId, datos)
    await resumenEvento(eventoId)
    dialogEditarEvento.value = false
    toast.add({
      severity: 'success',
      summary: 'Evento Actualizado',
      detail: 'Los datos del evento han sido guardados.',
      life: 3000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

// Eliminar evento completo
function confirmarEliminarEvento() {
  confirm.require({
    message: `¿Estás seguro de eliminar completamente el evento "${eventoActual.value?.nombre}"? Esta acción borrará asignaciones, cobros y gastos asociados.`,
    header: 'Eliminar Evento',
    icon: 'pi pi-trash',
    acceptLabel: 'Eliminar Definitivamente',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await eliminarEvento(eventoId)
        toast.add({
          severity: 'info',
          summary: 'Evento Eliminado',
          detail: 'El evento ha sido eliminado.',
          life: 3000,
        })
        router.push('/eventos')
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Error al eliminar',
          detail: err.message,
          life: 5000,
        })
      }
    },
  })
}

// Gestión de Áreas del Evento
function abrirActivarArea() {
  nuevaAreaConfig.value = {
    area_id: areasDisponiblesParaAgregar.value[0]?.id || null,
    tipo_pago: 'individual',
    metodo_reparto: 'equitativo',
    monto_area: 0,
  }
  dialogActivarArea.value = true
}

async function inicializarAreasDesdeEvento() {
  guardando.value = true
  try {
    await crearAreasSugeridas()
    toast.add({
      severity: 'success',
      summary: 'Áreas creadas',
      detail: 'Se configuraron las áreas de catering. Ahora selecciona una para activar.',
      life: 3000,
    })
    nuevaAreaConfig.value.area_id = areasDisponiblesParaAgregar.value[0]?.id || null
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

async function guardarActivarArea() {
  if (!nuevaAreaConfig.value.area_id) return
  guardando.value = true
  try {
    await activarAreaEnEvento(eventoId, nuevaAreaConfig.value.area_id, nuevaAreaConfig.value)
    await Promise.all([
      listarAreasEvento(eventoId),
      listarAsignaciones(eventoId),
      resumenEvento(eventoId),
    ])
    dialogActivarArea.value = false
    toast.add({
      severity: 'success',
      summary: 'Área Añadida',
      detail: 'Área vinculada exitosamente al evento.',
      life: 3000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al añadir área',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

async function handleActualizarArea({ id, config }) {
  try {
    await actualizarAreaEvento(id, config, eventoId)
    await Promise.all([
      listarAreasEvento(eventoId),
      listarAsignaciones(eventoId),
      resumenEvento(eventoId),
    ])
    toast.add({
      severity: 'success',
      summary: 'Modalidad Actualizada',
      detail: 'Montos y criterios recalculados automáticamente.',
      life: 2500,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  }
}

async function handleQuitarArea(id) {
  try {
    await quitarAreaDeEvento(id, eventoId)
    await Promise.all([
      listarAreasEvento(eventoId),
      listarAsignaciones(eventoId),
      resumenEvento(eventoId),
    ])
    toast.add({
      severity: 'info',
      summary: 'Área Removida',
      detail: 'El área fue retirada del evento.',
      life: 2500,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  }
}

// Gestión de Asignaciones
function abrirAsignarPersonal(area) {
  areaParaAsignar.value = area
  dialogAsignarPersonal.value = true
}

async function handleAsignarPersonal({ eventoAreaId, personalId, datos }) {
  guardando.value = true
  try {
    await asignarPersonal(eventoAreaId, personalId, datos, eventoId)
    await Promise.all([
      listarAreasEvento(eventoId),
      listarAsignaciones(eventoId),
      resumenEvento(eventoId),
    ])
    dialogAsignarPersonal.value = false
    toast.add({
      severity: 'success',
      summary: 'Personal Asignado',
      detail: 'Miembro asignado exitosamente al área.',
      life: 3000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al asignar',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

async function handleActualizarAsignacion({ id, datos }) {
  try {
    await actualizarAsignacion(id, datos, eventoId)
    await Promise.all([
      listarAreasEvento(eventoId),
      listarAsignaciones(eventoId),
      resumenEvento(eventoId),
    ])
    toast.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: 'Horas y pagos recalculados por las vistas SQL.',
      life: 2500,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  }
}

async function handleQuitarAsignacion(id) {
  try {
    await quitarAsignacion(id, eventoId)
    await Promise.all([
      listarAreasEvento(eventoId),
      listarAsignaciones(eventoId),
      resumenEvento(eventoId),
    ])
    toast.add({
      severity: 'info',
      summary: 'Removido',
      detail: 'Asignación removida del evento.',
      life: 2500,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  }
}

// Gestión de Pagos
function abrirRegistrarPago(asig) {
  asignacionParaPagar.value = asig
  dialogPago.value = true
}

async function handlePagoRegistrado(datosPago) {
  guardando.value = true
  try {
    await registrarPago(datosPago)
    await Promise.all([
      listarAsignaciones(eventoId),
      listarAreasEvento(eventoId),
      resumenEvento(eventoId),
    ])
    dialogPago.value = false
    toast.add({
      severity: 'success',
      summary: 'Abono Procesado',
      detail: 'El pago ha sido registrado y el saldo actualizado.',
      life: 3000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al registrar pago',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

async function handlePagoEliminado() {
  await Promise.all([
    listarAsignaciones(eventoId),
    listarAreasEvento(eventoId),
    resumenEvento(eventoId),
  ])
  toast.add({
    severity: 'info',
    summary: 'Pago anulado',
    detail: 'El saldo pendiente fue restaurado.',
    life: 3000,
  })
}

function confirmarPagarTodo() {
  if (totalPendientePersonal.value <= 0) {
    toast.add({
      severity: 'info',
      summary: 'Sin saldo pendiente',
      detail: 'Todo el personal ya tiene sus pagos al día.',
      life: 3000,
    })
    return
  }

  const pendientesCount = listaAsignaciones.value.filter((a) => Number(a.monto_pendiente) > 0).length

  confirm.require({
    message: `¿Deseas liquidar el saldo de las ${pendientesCount} personas con pagos pendientes por un total de ${formatearMoneda(totalPendientePersonal.value)}?`,
    header: 'Confirmar Liquidación Total del Personal',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Pagar a Todos',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await pagarTodoPendiente(eventoId)
        await Promise.all([
          listarAsignaciones(eventoId),
          listarAreasEvento(eventoId),
          resumenEvento(eventoId),
        ])
        toast.add({
          severity: 'success',
          summary: 'Liquidación completada',
          detail: 'Se registraron los pagos pendientes a todo el personal.',
          life: 3000,
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Error al liquidar',
          detail: err.message,
          life: 5000,
        })
      }
    },
  })
}

function handlePagarArea(area) {
  const saldoArea = Number(area.costo_area) - Number(area.pagado_area)
  confirm.require({
    message: `¿Liquidar el saldo pendiente de ${formatearMoneda(saldoArea)} para el área "${area.area_nombre}"?`,
    header: 'Liquidar Personal de Área',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Pagar Pendiente Área',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await pagarPendienteArea(area.id || area.evento_area_id)
        await Promise.all([
          listarAsignaciones(eventoId),
          listarAreasEvento(eventoId),
          resumenEvento(eventoId),
        ])
        toast.add({
          severity: 'success',
          summary: 'Área saldada',
          detail: 'Se completaron los pagos de los integrantes del área.',
          life: 3000,
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message,
          life: 5000,
        })
      }
    },
  })
}

// Gestión de Gastos y Cobros
async function guardarNuevoGasto() {
  if (!nuevoGasto.value.concepto || nuevoGasto.value.monto <= 0) return
  guardando.value = true
  try {
    await crearGasto(nuevoGasto.value, eventoId)
    dialogNuevoGasto.value = false
    nuevoGasto.value = {
      concepto: '',
      categoria: 'Insumos',
      monto: 0,
      fecha: new Date().toISOString().slice(0, 10),
    }
    toast.add({
      severity: 'success',
      summary: 'Gasto Registrado',
      detail: 'El gasto ha sido añadido al evento.',
      life: 3000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

function confirmarEliminarGasto(gasto) {
  confirm.require({
    message: `¿Eliminar gasto "${gasto.concepto}" por ${formatearMoneda(gasto.monto)}?`,
    header: 'Eliminar Gasto',
    icon: 'pi pi-trash',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await eliminarGasto(gasto.id, eventoId)
        toast.add({
          severity: 'info',
          summary: 'Gasto Eliminado',
          detail: 'El gasto fue removido y la ganancia neta recalculada.',
          life: 3000,
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message,
          life: 5000,
        })
      }
    },
  })
}

async function guardarNuevoCobro() {
  if (!nuevoCobro.value.concepto || nuevoCobro.value.monto <= 0) return
  guardando.value = true
  try {
    await crearCobro(nuevoCobro.value, eventoId)
    dialogNuevoCobro.value = false
    nuevoCobro.value = {
      concepto: 'Anticipo cliente',
      monto: 0,
      metodo: 'transferencia',
      fecha: new Date().toISOString().slice(0, 10),
    }
    toast.add({
      severity: 'success',
      summary: 'Cobro Registrado',
      detail: 'El cobro del cliente fue registrado exitosamente.',
      life: 3000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

function confirmarEliminarCobro(cobro) {
  confirm.require({
    message: `¿Eliminar cobro "${cobro.concepto}" por ${formatearMoneda(cobro.monto)}?`,
    header: 'Eliminar Cobro',
    icon: 'pi pi-trash',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await eliminarCobro(cobro.id, eventoId)
        toast.add({
          severity: 'info',
          summary: 'Cobro Eliminado',
          detail: 'El cobro fue removido.',
          life: 3000,
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message,
          life: 5000,
        })
      }
    },
  })
}
</script>

<template>
  <AppLayout>
    <!-- Header del Detalle -->
    <template #header-title>
      <div class="flex items-center gap-2.5">
        <router-link
          to="/eventos"
          class="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Volver a lista de eventos"
        >
          <i class="pi pi-arrow-left text-sm"></i>
        </router-link>
        <div class="overflow-hidden">
          <div class="flex items-center gap-2">
            <h2 class="text-base sm:text-lg font-bold text-slate-800 truncate">
              {{ eventoActual?.nombre || 'Cargando evento...' }}
            </h2>
            <Tag
              :value="etiquetaEstado(eventoActual?.estado)"
              :severity="severidadEstado(eventoActual?.estado)"
              class="!text-[11px] uppercase tracking-wider font-bold"
            />
          </div>
          <p class="text-xs text-slate-500 truncate">
            Cliente: <span class="font-semibold text-slate-700">{{ eventoActual?.cliente }}</span> &bull; Fecha: {{ formatearFecha(eventoActual?.fecha) }}
          </p>
        </div>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <!-- Selector de estado rápido con etiqueta visual -->
        <Select
          :modelValue="eventoActual?.estado"
          :options="ESTADOS_EVENTO"
          optionLabel="label"
          optionValue="value"
          @update:modelValue="onCambiarEstado"
          class="text-xs w-36 !py-0.5"
          placeholder="Estado..."
        />

        <Button
          icon="pi pi-pencil"
          severity="secondary"
          size="small"
          label="Editar"
          class="!text-xs font-medium"
          @click="dialogEditarEvento = true"
        />

        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          size="small"
          title="Eliminar evento completo"
          @click="confirmarEliminarEvento"
        />
      </div>
    </template>

    <!-- Indicador de carga inicial -->
    <div v-if="cargandoTodo" class="py-16 text-center text-slate-400">
      <i class="pi pi-spin pi-spinner text-3xl mb-3 text-emerald-600"></i>
      <p class="text-sm font-medium text-slate-600">Cargando detalles y finanzas del evento...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Resumen de Métricas Financieras (Siempre visible arriba) -->
      <ResumenFinanciero :resumen="resumen" />

      <!-- Pestañas Principales -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Tabs v-model:value="pestanaActiva">
          <TabList class="border-b border-slate-200 px-4 bg-slate-50/60">
            <Tab value="0" class="!text-sm font-semibold !py-3">
              <i class="pi pi-info-circle mr-2 text-xs"></i>Resumen y Datos
            </Tab>
            <Tab value="1" class="!text-sm font-semibold !py-3">
              <i class="pi pi-users mr-2 text-xs"></i>Áreas y Personal ({{ areasEvento.length }})
            </Tab>
            <Tab value="2" class="!text-sm font-semibold !py-3">
              <i class="pi pi-credit-card mr-2 text-xs"></i>Control de Pagos ({{ listaAsignaciones.length }})
            </Tab>
            <Tab value="3" class="!text-sm font-semibold !py-3">
              <i class="pi pi-wallet mr-2 text-xs"></i>Gastos y Cobros
            </Tab>
          </TabList>

          <TabPanels class="p-5">
            <!-- PESTAÑA 0: DATOS GENERALES -->
            <TabPanel value="0">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Tarjeta Info Detallada -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Ficha del Evento</h3>
                    <Button
                      label="Modificar Datos"
                      icon="pi pi-pencil"
                      size="small"
                      severity="secondary"
                      text
                      class="!text-xs"
                      @click="dialogEditarEvento = true"
                    />
                  </div>

                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 divide-y divide-slate-100 text-xs">
                    <div class="py-2.5 flex justify-between">
                      <span class="text-slate-500">Nombre del Evento:</span>
                      <span class="font-bold text-slate-800">{{ eventoActual?.nombre }}</span>
                    </div>
                    <div class="py-2.5 flex justify-between">
                      <span class="text-slate-500">Cliente / Contratante:</span>
                      <span class="font-semibold text-slate-800">{{ eventoActual?.cliente }}</span>
                    </div>
                    <div class="py-2.5 flex justify-between">
                      <span class="text-slate-500">Lugar / Salón:</span>
                      <span class="font-medium text-slate-800">{{ eventoActual?.lugar || 'Por definir' }}</span>
                    </div>
                    <div class="py-2.5 flex justify-between">
                      <span class="text-slate-500">Fecha del Evento:</span>
                      <span class="font-medium text-slate-800">{{ formatearFecha(eventoActual?.fecha) }}</span>
                    </div>
                    <div class="py-2.5 flex justify-between">
                      <span class="text-slate-500">Horario de Servicio:</span>
                      <span class="font-medium text-slate-800">
                        {{ formatearHora(eventoActual?.hora_inicio) }} a {{ formatearHora(eventoActual?.hora_fin) }}
                      </span>
                    </div>
                    <div class="py-2.5 flex justify-between">
                      <span class="text-slate-500">Capacidad / Invitados:</span>
                      <span class="font-medium text-slate-800">{{ eventoActual?.num_invitados || 0 }} personas</span>
                    </div>
                    <div class="py-2.5 flex justify-between">
                      <span class="text-slate-500">Ingreso Pactado:</span>
                      <span class="font-mono font-bold text-slate-900">{{ formatearMoneda(eventoActual?.ingreso_pactado) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Tarjeta Notas y Observaciones -->
                <div class="space-y-4">
                  <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Notas y Requerimientos Especiales</h3>
                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 min-h-[180px] text-xs text-slate-700 flex flex-col justify-between">
                    <p v-if="eventoActual?.notas" class="whitespace-pre-line leading-relaxed">
                      {{ eventoActual?.notas }}
                    </p>
                    <p v-else class="text-slate-400 italic">
                      Sin observaciones adicionales registradas para este banquete.
                    </p>

                    <div class="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Última sincronización con vistas SQL</span>
                      <span class="text-emerald-600 font-medium flex items-center gap-1">
                        <i class="pi pi-check text-[10px]"></i> Al día
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- PESTAÑA 1: ÁREAS Y PERSONAL -->
            <TabPanel value="1">
              <div class="space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 class="text-sm font-bold text-slate-800">Áreas Operativas del Evento</h3>
                    <p class="text-xs text-slate-500">Configura modalidades (Individual o Por Área) y asigna tu equipo de trabajo</p>
                  </div>

                  <Button
                    label="Activar Área en este Evento"
                    icon="pi pi-plus"
                    size="small"
                    class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-xs font-semibold"
                    @click="abrirActivarArea"
                  />
                </div>

                <!-- Lista de Tarjetas de Área -->
                <div v-if="areasEvento.length === 0" class="py-14 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 px-4">
                  <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl mx-auto mb-2 text-slate-400">
                    <i class="pi pi-th-large"></i>
                  </div>
                  <p class="text-sm font-bold text-slate-700">No hay áreas activadas en este evento todavía</p>
                  <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Agrega departamentos como Cocina, Meseros o Barra para comenzar a registrar turnos y salarios.
                  </p>
                  <Button
                    label="Activar Primer Área"
                    icon="pi pi-plus"
                    size="small"
                    class="!bg-emerald-600 !border-emerald-600 !text-xs font-semibold"
                    @click="abrirActivarArea"
                  />
                </div>

                <div v-else>
                  <AreaEventoCard
                    v-for="area in areasEvento"
                    :key="area.id"
                    :area="area"
                    :asignaciones="listaAsignaciones"
                    @actualizar-area="handleActualizarArea"
                    @quitar-area="handleQuitarArea"
                    @abrir-asignar="abrirAsignarPersonal"
                    @actualizar-asignacion="handleActualizarAsignacion"
                    @quitar-asignacion="handleQuitarAsignacion"
                    @pagar-area="handlePagarArea"
                  />
                </div>
              </div>
            </TabPanel>

            <!-- PESTAÑA 2: PAGOS AL PERSONAL -->
            <TabPanel value="2">
              <div class="space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h3 class="text-sm font-bold text-slate-800">Control de Pagos a Personal</h3>
                    <p class="text-xs text-slate-500">Monitoreo de montos calculados por las vistas SQL, liquidaciones y recibos</p>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <span class="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Total Pendiente</span>
                      <span class="text-base font-mono font-bold text-amber-600">
                        {{ formatearMoneda(totalPendientePersonal) }}
                      </span>
                    </div>

                    <Button
                      v-if="totalPendientePersonal > 0"
                      label="Liquidar Todo lo Pendiente"
                      icon="pi pi-check-circle"
                      severity="success"
                      size="small"
                      class="!text-xs font-semibold"
                      @click="confirmarPagarTodo"
                    />
                  </div>
                </div>

                <!-- Buscador de la tabla de pagos -->
                <div class="flex items-center justify-between gap-3">
                  <div class="relative w-full sm:w-72">
                    <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <InputText
                      v-model="busquedaPagos"
                      placeholder="Filtrar por persona o área..."
                      class="w-full !pl-9 !py-1.5 text-xs"
                    />
                  </div>
                  <span class="text-xs text-slate-400">{{ asignacionesFiltradasPagos.length }} asignaciones</span>
                </div>

                <!-- Tabla de Todas las Asignaciones y Pagos -->
                <DataTable
                  :value="asignacionesFiltradasPagos"
                  paginator
                  :rows="10"
                  tableStyle="min-width: 55rem"
                  class="p-datatable-sm"
                  emptyMessage="No hay personal asignado para mostrar pagos."
                >
                  <Column field="personal" header="Personal" sortable>
                    <template #body="{ data }">
                      <div class="font-bold text-slate-800">{{ data.personal }}</div>
                      <div class="text-[11px] text-slate-400">{{ data.rol_en_evento || 'Sin rol' }}</div>
                    </template>
                  </Column>

                  <Column field="area" header="Área" sortable>
                    <template #body="{ data }">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {{ data.area }}
                      </span>
                    </template>
                  </Column>

                  <Column field="horas" header="Horas" sortable>
                    <template #body="{ data }">
                      <span class="font-mono text-xs">{{ data.horas ?? 0 }}h</span>
                    </template>
                  </Column>

                  <Column field="monto_a_pagar" header="Monto Calculado" sortable>
                    <template #body="{ data }">
                      <span class="font-mono text-xs font-bold text-slate-800">
                        {{ formatearMoneda(data.monto_a_pagar) }}
                      </span>
                    </template>
                  </Column>

                  <Column field="monto_pagado" header="Total Pagado" sortable>
                    <template #body="{ data }">
                      <span class="font-mono text-xs font-medium text-emerald-600">
                        {{ formatearMoneda(data.monto_pagado) }}
                      </span>
                    </template>
                  </Column>

                  <Column field="monto_pendiente" header="Saldo Pendiente" sortable>
                    <template #body="{ data }">
                      <span
                        class="font-mono text-xs font-bold"
                        :class="Number(data.monto_pendiente) > 0 ? 'text-amber-600' : 'text-slate-400'"
                      >
                        {{ formatearMoneda(data.monto_pendiente) }}
                      </span>
                    </template>
                  </Column>

                  <Column field="estado_pago" header="Estado" sortable>
                    <template #body="{ data }">
                      <Tag
                        :value="etiquetaEstadoPago(data.estado_pago)"
                        :severity="severidadEstadoPago(data.estado_pago)"
                        class="!text-[10px] uppercase font-bold"
                      />
                    </template>
                  </Column>

                  <Column header="Acción" headerStyle="width: 8.5rem" bodyClass="text-right">
                    <template #body="{ data }">
                      <Button
                        label="Abonar"
                        icon="pi pi-dollar"
                        size="small"
                        severity="secondary"
                        class="!text-xs !py-1 font-medium"
                        @click="abrirRegistrarPago(data)"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </TabPanel>

            <!-- PESTAÑA 3: GASTOS Y COBROS -->
            <TabPanel value="3">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Columna Cobros al Cliente -->
                <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="text-sm font-bold text-slate-800">Cobros al Cliente</h4>
                        <span class="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Total: {{ formatearMoneda(sumaTotalCobros) }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500">Anticipos y abonos recibidos del cliente</p>
                    </div>
                    <Button
                      label="Nuevo Cobro"
                      icon="pi pi-plus"
                      size="small"
                      class="!bg-emerald-600 !border-emerald-600 !text-xs font-semibold"
                      @click="dialogNuevoCobro = true"
                    />
                  </div>

                  <DataTable
                    :value="listaCobros"
                    class="p-datatable-sm bg-white rounded-lg border border-slate-200 overflow-hidden"
                    emptyMessage="No hay cobros registrados aún."
                  >
                    <Column field="fecha" header="Fecha">
                      <template #body="{ data }">
                        <span class="text-xs text-slate-600">{{ formatearFecha(data.fecha) }}</span>
                      </template>
                    </Column>
                    <Column field="concepto" header="Concepto">
                      <template #body="{ data }">
                        <div class="text-xs font-semibold text-slate-800">{{ data.concepto }}</div>
                        <div class="text-[10px] text-slate-400 uppercase">{{ data.metodo }}</div>
                      </template>
                    </Column>
                    <Column field="monto" header="Monto">
                      <template #body="{ data }">
                        <span class="font-mono text-xs font-bold text-emerald-600">
                          {{ formatearMoneda(data.monto) }}
                        </span>
                      </template>
                    </Column>
                    <Column header="" headerStyle="width: 3rem">
                      <template #body="{ data }">
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          rounded
                          size="small"
                          @click="confirmarEliminarCobro(data)"
                        />
                      </template>
                    </Column>
                  </DataTable>
                </div>

                <!-- Columna Gastos Extras -->
                <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="text-sm font-bold text-slate-800">Gastos Extras y Compras</h4>
                        <span class="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Total: {{ formatearMoneda(sumaTotalGastos) }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500">Insumos imprevistos, compras de hielo, alquileres</p>
                    </div>
                    <Button
                      label="Nuevo Gasto"
                      icon="pi pi-plus"
                      size="small"
                      severity="secondary"
                      class="!text-xs font-semibold"
                      @click="dialogNuevoGasto = true"
                    />
                  </div>

                  <DataTable
                    :value="listaGastos"
                    class="p-datatable-sm bg-white rounded-lg border border-slate-200 overflow-hidden"
                    emptyMessage="No hay gastos extras registrados."
                  >
                    <Column field="fecha" header="Fecha">
                      <template #body="{ data }">
                        <span class="text-xs text-slate-600">{{ formatearFecha(data.fecha) }}</span>
                      </template>
                    </Column>
                    <Column field="concepto" header="Concepto">
                      <template #body="{ data }">
                        <div class="text-xs font-semibold text-slate-800">{{ data.concepto }}</div>
                        <div class="text-[10px] text-slate-400" v-if="data.categoria">{{ data.categoria }}</div>
                      </template>
                    </Column>
                    <Column field="monto" header="Monto">
                      <template #body="{ data }">
                        <span class="font-mono text-xs font-bold text-rose-600">
                          {{ formatearMoneda(data.monto) }}
                        </span>
                      </template>
                    </Column>
                    <Column header="" headerStyle="width: 3rem">
                      <template #body="{ data }">
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          rounded
                          size="small"
                          @click="confirmarEliminarGasto(data)"
                        />
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>

    <!-- DIÁLOGOS Y MODALES -->

    <!-- Modal Editar Evento -->
    <Dialog
      v-model:visible="dialogEditarEvento"
      modal
      header="Editar Datos del Evento"
      :style="{ width: '90vw', maxWidth: '650px' }"
    >
      <EventoForm
        :evento="eventoActual"
        :cargando="guardando"
        @guardar="guardarDatosEvento"
        @cancelar="dialogEditarEvento = false"
      />
    </Dialog>

    <!-- Modal Activar Área en Evento -->
    <Dialog
      v-model:visible="dialogActivarArea"
      modal
      header="Activar Área en este Evento"
      :style="{ width: '90vw', maxWidth: '520px' }"
    >
      <div v-if="catalogoAreas.length === 0" class="py-4 text-center">
        <p class="text-sm text-slate-700 font-semibold mb-2">Aún no tienes áreas en tu catálogo.</p>
        <p class="text-xs text-slate-500 mb-4">Puedes inicializar las áreas sugeridas (Cocina, Meseros, Barra, etc.) con un clic:</p>
        <Button
          label="Crear Áreas Estándar de Banquetería"
          icon="pi pi-sparkles"
          class="!bg-emerald-600 !border-emerald-600 text-xs"
          :loading="guardando"
          @click="inicializarAreasDesdeEvento"
        />
      </div>

      <form v-else @submit.prevent="guardarActivarArea" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Seleccionar Área del Catálogo <span class="text-rose-500">*</span>
          </label>
          <Select
            v-model="nuevaAreaConfig.area_id"
            :options="areasDisponiblesParaAgregar"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Selecciona un departamento..."
            class="w-full text-sm"
            emptyMessage="Todas las áreas del catálogo ya están activas en este evento."
          />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Modalidad de Pago para esta Área
          </label>
          <Select
            v-model="nuevaAreaConfig.tipo_pago"
            :options="[
              { label: 'Pago Individual (tarifa base o monto fijo por persona)', value: 'individual' },
              { label: 'Por Área (monto global repartido entre el equipo)', value: 'por_area' },
            ]"
            optionLabel="label"
            optionValue="value"
            class="w-full text-sm"
          />
        </div>

        <div v-if="nuevaAreaConfig.tipo_pago === 'por_area'" class="space-y-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Método de Reparto
            </label>
            <Select
              v-model="nuevaAreaConfig.metodo_reparto"
              :options="[
                { label: 'Equitativo (partes iguales entre integrantes)', value: 'equitativo' },
                { label: 'Por Horas Trabajadas (proporcional)', value: 'por_horas' },
              ]"
              optionLabel="label"
              optionValue="value"
              class="w-full text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Monto Bolsa Total a Repartir (HNL)
            </label>
            <InputNumber
              v-model="nuevaAreaConfig.monto_area"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              :min="0"
              mode="decimal"
              class="w-full text-sm font-mono"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="dialogActivarArea = false"
          />
          <Button
            type="submit"
            :loading="guardando"
            :disabled="!nuevaAreaConfig.area_id"
            label="Activar Área"
            icon="pi pi-check"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-semibold"
          />
        </div>
      </form>
    </Dialog>

    <!-- Modal Asignar Personal -->
    <AsignarPersonalDialog
      v-model:visible="dialogAsignarPersonal"
      :area="areaParaAsignar"
      :areas="areasEvento"
      :catalogoPersonal="listaPersonal"
      :asignacionesExistentes="listaAsignaciones"
      :cargando="guardando"
      @asignar="handleAsignarPersonal"
    />

    <!-- Modal Registrar Pago -->
    <PagoDialog
      v-model:visible="dialogPago"
      :asignacion="asignacionParaPagar"
      :cargando="guardando"
      @pago-registrado="handlePagoRegistrado"
      @pago-eliminado="handlePagoEliminado"
    />

    <!-- Modal Nuevo Cobro al Cliente -->
    <Dialog
      v-model:visible="dialogNuevoCobro"
      modal
      header="Registrar Cobro al Cliente"
      :style="{ width: '90vw', maxWidth: '450px' }"
    >
      <form @submit.prevent="guardarNuevoCobro" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Concepto del Cobro <span class="text-rose-500">*</span>
          </label>
          <InputText
            v-model="nuevoCobro.concepto"
            required
            placeholder="Ej: Anticipo 50%, Saldo final..."
            class="w-full text-sm"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Monto (HNL) <span class="text-rose-500">*</span>
            </label>
            <InputNumber
              v-model="nuevoCobro.monto"
              :min="0.01"
              :minFractionDigits="2"
              mode="decimal"
              class="w-full text-sm font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Método
            </label>
            <Select
              v-model="nuevoCobro.metodo"
              :options="METODOS_COBRO"
              optionLabel="label"
              optionValue="value"
              class="w-full text-sm"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Fecha de Cobro
          </label>
          <input
            type="date"
            v-model="nuevoCobro.fecha"
            required
            class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="dialogNuevoCobro = false"
          />
          <Button
            type="submit"
            :loading="guardando"
            :disabled="nuevoCobro.monto <= 0"
            label="Guardar Cobro"
            icon="pi pi-check"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-semibold"
          />
        </div>
      </form>
    </Dialog>

    <!-- Modal Nuevo Gasto -->
    <Dialog
      v-model:visible="dialogNuevoGasto"
      modal
      header="Registrar Gasto del Evento"
      :style="{ width: '90vw', maxWidth: '450px' }"
    >
      <form @submit.prevent="guardarNuevoGasto" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Concepto del Gasto <span class="text-rose-500">*</span>
          </label>
          <InputText
            v-model="nuevoGasto.concepto"
            required
            placeholder="Ej: Hielos y refrescos, Mantelería extra..."
            class="w-full text-sm"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Monto (HNL) <span class="text-rose-500">*</span>
            </label>
            <InputNumber
              v-model="nuevoGasto.monto"
              :min="0.01"
              :minFractionDigits="2"
              mode="decimal"
              class="w-full text-sm font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Categoría
            </label>
            <InputText
              v-model="nuevoGasto.categoria"
              placeholder="Ej: Insumos, Transporte..."
              class="w-full text-sm"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Fecha del Gasto
          </label>
          <input
            type="date"
            v-model="nuevoGasto.fecha"
            required
            class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="dialogNuevoGasto = false"
          />
          <Button
            type="submit"
            :loading="guardando"
            :disabled="nuevoGasto.monto <= 0"
            label="Guardar Gasto"
            icon="pi pi-check"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-semibold"
          />
        </div>
      </form>
    </Dialog>
  </AppLayout>
</template>
