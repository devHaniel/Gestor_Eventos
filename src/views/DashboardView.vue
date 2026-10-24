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

// Total pendiente de pago al personal
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
        <h2 class="text-base sm:text-lg font-bold text-slate-900">Panel de Control General</h2>
        <p class="text-xs text-slate-500">Métricas operativas, estado de eventos y rentabilidad financiera</p>
      </div>
    </template>

    <template #header-actions>
      <Button
        label="Nuevo Evento"
        icon="pi pi-plus"
        size="small"
        class="font-semibold text-xs"
        @click="dialogNuevoEvento = true"
      />
    </template>

    <div class="space-y-6">
      <!-- Tarjetas de Métricas Clave con PrimeVue Card -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Eventos en Curso -->
        <Card class="!shadow-xs !border !border-slate-200">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold uppercase text-slate-500 tracking-wider">En Curso</span>
                <div class="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {{ eventosEnCurso.length }}
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Operando en este momento</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-lg">
                <i class="pi pi-clock"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- Próximos Eventos -->
        <Card class="!shadow-xs !border !border-slate-200">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Próximos Eventos</span>
                <div class="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {{ proximosEventos.length }}
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Agendados a futuro</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-lg">
                <i class="pi pi-calendar"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- Total Pendiente Personal -->
        <Card class="!shadow-xs !border !border-slate-200">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Pendiente Personal</span>
                <div class="text-xl font-bold font-mono text-amber-600 mt-1">
                  {{ formatearMoneda(totalPendientePersonal) }}
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Saldos por liquidar</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-lg">
                <i class="pi pi-users"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- Ganancia Neta del Mes -->
        <Card class="!shadow-xs !border !border-slate-200">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Ganancia del Mes</span>
                <div
                  class="text-xl font-bold font-mono mt-1"
                  :class="gananciaNetaMes >= 0 ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ formatearMoneda(gananciaNetaMes) }}
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Acumulado: {{ formatearMoneda(gananciaTotalAcumulada) }}
                </p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">
                <i class="pi pi-chart-line"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sección de Próximos Eventos -->
      <Card class="!shadow-xs !border !border-slate-200 overflow-hidden">
        <template #header>
          <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div class="flex items-center gap-2">
              <i class="pi pi-calendar text-slate-500 text-sm"></i>
              <h3 class="text-sm font-bold text-slate-800">Próximos eventos agendados</h3>
            </div>
            <router-link
              to="/eventos"
              class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>Ver todos</span>
              <i class="pi pi-arrow-right text-[10px]"></i>
            </router-link>
          </div>
        </template>

        <template #content>
          <!-- Estado vacío -->
          <div v-if="!cargando && proximosEventos.length === 0" class="py-12 text-center px-4">
            <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl mx-auto mb-2 text-slate-400">
              <i class="pi pi-calendar"></i>
            </div>
            <p class="text-sm font-medium text-slate-700">No hay eventos programados a futuro</p>
            <p class="text-xs text-slate-400 mt-0.5 mb-3">Registra un nuevo banquete para visualizarlo en el cronograma.</p>
            <Button
              label="Registrar Evento"
              icon="pi pi-plus"
              size="small"
              class="text-xs"
              @click="dialogNuevoEvento = true"
            />
          </div>

          <!-- Tabla PrimeVue -->
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
                  class="font-semibold text-slate-800 hover:text-emerald-700 transition-colors text-xs"
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

            <Column header="" headerStyle="width: 3.5rem" bodyClass="text-right">
              <template #body="{ data }">
                <Button
                  icon="pi pi-chevron-right"
                  severity="secondary"
                  variant="text"
                  rounded
                  size="small"
                  @click="router.push(`/eventos/${data.evento_id || data.id}`)"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
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
