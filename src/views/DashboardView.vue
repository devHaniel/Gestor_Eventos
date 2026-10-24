<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppLayout from '../components/AppLayout.vue'
import EventoForm from '../components/EventoForm.vue'
import { useEventos } from '../composables/useEventos.js'
import { formatearMoneda, formatearFecha } from '../utils/formato.js'
import { etiquetaEstado, severidadEstado } from '../utils/estados.js'

const router = useRouter()
const toast = useToast()
const { listaEventos, cargando, listarEventos, crearEvento } = useEventos()

const dialogNuevoEvento = ref(false)
const guardando = ref(false)

onMounted(async () => {
  try {
    await listarEventos()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al cargar dashboard',
      detail: err.message,
      life: 5000,
    })
  }
})

// Eventos en curso
const eventosEnCurso = computed(() => {
  return listaEventos.value.filter((e) => e.estado === 'en_curso')
})

// Próximos eventos ordenados cronológicamente
const proximosEventos = computed(() => {
  const hoyStr = new Date().toISOString().slice(0, 10)
  return [...listaEventos.value]
    .filter((e) => e.fecha >= hoyStr && e.estado !== 'cancelado')
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
    .slice(0, 5)
})

// Total pendiente de pago al personal (calculado de v_resumen_evento: costo_personal - personal_pagado)
const totalPendientePersonal = computed(() => {
  return listaEventos.value.reduce((sum, e) => {
    const costo = Number(e.costo_personal) || 0
    const pagado = Number(e.personal_pagado) || 0
    return sum + Math.max(0, costo - pagado)
  }, 0)
})

// Ganancia neta del mes actual
const gananciaNetaMes = computed(() => {
  const ahora = new Date()
  const añoMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`

  return listaEventos.value
    .filter((e) => e.fecha && e.fecha.startsWith(añoMes) && e.estado !== 'cancelado')
    .reduce((sum, e) => sum + (Number(e.ganancia_neta) || 0), 0)
})

// Ganancia total acumulada
const gananciaTotalAcumulada = computed(() => {
  return listaEventos.value
    .filter((e) => e.estado !== 'cancelado')
    .reduce((sum, e) => sum + (Number(e.ganancia_neta) || 0), 0)
})

async function guardarNuevoEvento(datos) {
  guardando.value = true
  try {
    const nuevo = await crearEvento(datos)
    dialogNuevoEvento.value = false
    toast.add({
      severity: 'success',
      summary: 'Evento Creado',
      detail: 'El evento fue registrado con éxito.',
      life: 3000,
    })
    const id = nuevo?.id || nuevo?.evento_id
    if (id) {
      router.push(`/eventos/${id}`)
    }
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
</script>

<template>
  <AppLayout>
    <template #header-title>
      <div>
        <h2 class="text-lg font-bold text-slate-800">Panel de Control General</h2>
        <p class="text-xs text-slate-500">Visión global de eventos, saldos pendientes y rentabilidad</p>
      </div>
    </template>

    <template #header-actions>
      <Button
        label="Nuevo Evento"
        icon="pi pi-plus"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-medium text-sm"
        @click="dialogNuevoEvento = true"
      />
    </template>

    <div class="space-y-6">
      <!-- Tarjetas de Métricas Clave -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Eventos en Curso -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Eventos en Curso</span>
            <div class="text-2xl font-bold font-mono text-slate-800 mt-1">
              {{ eventosEnCurso.length }}
            </div>
            <p class="text-xs text-slate-400 mt-1">Ahora</p>
          </div>
          <div class="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
            <i class="pi pi-hourglass"></i>
          </div>
        </div>

        <!-- Próximos Eventos -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Próximos Eventos</span>
            <div class="text-2xl font-bold font-mono text-slate-800 mt-1">
              {{ proximosEventos.length }}
            </div>
            <p class="text-xs text-slate-400 mt-1">Por venir</p>
          </div>
          <div class="w-11 h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
            <i class="pi pi-calendar"></i>
          </div>
        </div>

        <!-- Total Pendiente Personal -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Pendiente Personal</span>
            <div class="text-xl font-bold font-mono text-amber-600 mt-1">
              {{ formatearMoneda(totalPendientePersonal) }}
            </div>
            <p class="text-xs text-slate-400 mt-1">Por pagar</p>
          </div>
          <div class="w-11 h-11 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
            <i class="pi pi-users"></i>
          </div>
        </div>

        <!-- Ganancia Neta del Mes -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Ganancia del Mes</span>
            <div
              class="text-xl font-bold font-mono mt-1"
              :class="gananciaNetaMes >= 0 ? 'text-emerald-600' : 'text-rose-600'"
            >
              {{ formatearMoneda(gananciaNetaMes) }}
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Total acumulado: {{ formatearMoneda(gananciaTotalAcumulada) }}
            </p>
          </div>
          <div class="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
            <i class="pi pi-chart-line"></i>
          </div>
        </div>
      </div>

      <!-- Sección de Próximos Eventos -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar-clock text-slate-500"></i>
            <h3 class="text-sm font-bold text-slate-800">Próximos eventos</h3>
          </div>
          <router-link
            to="/eventos"
            class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Ver todos los eventos</span>
            <i class="pi pi-arrow-right text-[10px]"></i>
          </router-link>
        </div>

        <!-- Estado vacío si no hay eventos agendados -->
        <div v-if="!cargando && proximosEventos.length === 0" class="py-12 text-center px-4">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl mx-auto mb-2 text-slate-400">
            <i class="pi pi-calendar"></i>
          </div>
          <p class="text-sm font-medium text-slate-600">No hay eventos programados a futuro</p>
          <p class="text-xs text-slate-400 mt-0.5 mb-3">Registra tu próximo banquete para visualizarlo aquí.</p>
          <Button
            label="Registrar Evento"
            icon="pi pi-plus"
            size="small"
            class="!bg-emerald-600 !border-emerald-600 !text-xs"
            @click="dialogNuevoEvento = true"
          />
        </div>

        <DataTable
          v-else
          :value="proximosEventos"
          :loading="cargando"
          tableStyle="min-width: 45rem"
          class="p-datatable-sm"
        >
          <Column field="fecha" header="Fecha">
            <template #body="{ data }">
              <span class="text-xs font-mono font-medium text-slate-700">
                {{ formatearFecha(data.fecha) }}
              </span>
            </template>
          </Column>

          <Column field="nombre" header="Evento">
            <template #body="{ data }">
              <router-link
                :to="`/eventos/${data.evento_id || data.id}`"
                class="font-bold text-slate-800 hover:text-emerald-600 transition-colors"
              >
                {{ data.nombre }}
              </router-link>
              <div class="text-[11px] text-slate-400">{{ data.cliente }}</div>
            </template>
          </Column>

          <Column field="estado" header="Estado">
            <template #body="{ data }">
              <Tag
                :value="etiquetaEstado(data.estado)"
                :severity="severidadEstado(data.estado)"
                class="!text-xs uppercase tracking-wider font-bold"
              />
            </template>
          </Column>

          <Column field="ganancia_neta" header="Ganancia">
            <template #body="{ data }">
              <span
                class="font-mono text-xs font-bold"
                :class="(data.ganancia_neta ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'"
              >
                {{ formatearMoneda(data.ganancia_neta) }}
              </span>
            </template>
          </Column>

          <Column header="" headerStyle="width: 4rem" bodyClass="text-right">
            <template #body="{ data }">
              <Button
                icon="pi pi-chevron-right"
                severity="secondary"
                text
                rounded
                size="small"
                @click="router.push(`/eventos/${data.evento_id || data.id}`)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Modal Nuevo Evento -->
    <Dialog
      v-model:visible="dialogNuevoEvento"
      modal
      header="Registrar Nuevo Evento"
      :style="{ width: '90vw', maxWidth: '650px' }"
    >
      <EventoForm
        :cargando="guardando"
        @guardar="guardarNuevoEvento"
        @cancelar="dialogNuevoEvento = false"
      />
    </Dialog>
  </AppLayout>
</template>
