<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppLayout from '../components/AppLayout.vue'
import EventoForm from '../components/EventoForm.vue'
import { useEventos } from '../composables/useEventos.js'
import { formatearMoneda, formatearFecha } from '../utils/formato.js'
import { ESTADOS_EVENTO, etiquetaEstado, severidadEstado } from '../utils/estados.js'

const router = useRouter()
const toast = useToast()
const { listaEventos, cargando, listarEventos, crearEvento } = useEventos()

const busqueda = ref('')
const filtroEstado = ref('todos')
const dialogNuevo = ref(false)
const guardando = ref(false)

const opcionesEstadoFiltro = [
  { label: 'Todos los estados', value: 'todos' },
  ...ESTADOS_EVENTO.map((e) => ({ label: e.label, value: e.value })),
]

onMounted(async () => {
  try {
    await listarEventos()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al cargar eventos',
      detail: err.message,
      life: 5000,
    })
  }
})

const eventosFiltrados = computed(() => {
  return listaEventos.value.filter((ev) => {
    const cumpleTexto =
      !busqueda.value.trim() ||
      ev.nombre?.toLowerCase().includes(busqueda.value.toLowerCase()) ||
      ev.cliente?.toLowerCase().includes(busqueda.value.toLowerCase())

    const cumpleEstado =
      filtroEstado.value === 'todos' || ev.estado === filtroEstado.value

    return cumpleTexto && cumpleEstado
  })
})

function onFilaSeleccionada(event) {
  const evento = event.data
  const id = evento?.evento_id || evento?.id
  if (id) {
    router.push(`/eventos/${id}`)
  }
}

async function guardarNuevoEvento(datos) {
  guardando.value = true
  try {
    const nuevo = await crearEvento(datos)
    toast.add({
      severity: 'success',
      summary: 'Evento Creado',
      detail: 'El evento se ha registrado exitosamente.',
      life: 3000,
    })
    dialogNuevo.value = false
    const id = nuevo?.id || nuevo?.evento_id
    if (id) {
      router.push(`/eventos/${id}`)
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al crear evento',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

function limpiarFiltros() {
  busqueda.value = ''
  filtroEstado.value = 'todos'
}
</script>

<template>
  <AppLayout>
    <template #header-title>
      <div>
        <h2 class="text-lg font-bold text-slate-800">Eventos y Banquetería</h2>
        <p class="text-xs text-slate-500">Listado general de eventos, estados y resultados financieros</p>
      </div>
    </template>

    <template #header-actions>
      <Button
        label="Nuevo Evento"
        icon="pi pi-plus"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-medium text-sm"
        @click="dialogNuevo = true"
      />
    </template>

    <!-- Contenedor Principal -->
    <div class="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <!-- Filtros -->
      <div class="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div class="relative w-full sm:w-72">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <InputText
              v-model="busqueda"
              placeholder="Buscar por evento o cliente..."
              class="w-full !pl-9 !py-1.5 text-sm"
            />
          </div>

          <Select
            v-model="filtroEstado"
            :options="opcionesEstadoFiltro"
            optionLabel="label"
            optionValue="value"
            class="w-full sm:w-48 text-sm"
          />
        </div>

        <div class="text-xs text-slate-500 font-medium self-end md:self-center">
          Total: <span class="font-bold text-slate-700">{{ eventosFiltrados.length }}</span> eventos
        </div>
      </div>

      <!-- Estado vacío si la BD no tiene eventos -->
      <div v-if="!cargando && listaEventos.length === 0" class="py-16 text-center px-4">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
          <i class="pi pi-calendar-plus"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800">No hay eventos registrados aún</h3>
        <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          Comienza creando tu primer banquete o evento para asignar áreas, personal y llevar el control de pagos y ganancias.
        </p>
        <Button
          label="Crear Primer Evento"
          icon="pi pi-plus"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-medium text-xs"
          @click="dialogNuevo = true"
        />
      </div>

      <!-- Estado vacío por filtro -->
      <div v-else-if="!cargando && eventosFiltrados.length === 0" class="py-12 text-center text-slate-400">
        <p class="text-sm font-medium text-slate-600">No hay eventos que coincidan con los filtros aplicados.</p>
        <Button
          label="Limpiar filtros"
          text
          size="small"
          class="mt-2 !text-xs !text-emerald-600"
          @click="limpiarFiltros"
        />
      </div>

      <!-- Tabla de Eventos -->
      <DataTable
        v-else
        :value="eventosFiltrados"
        :loading="cargando"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        tableStyle="min-width: 60rem"
        class="p-datatable-sm"
        selectionMode="single"
        @row-click="onFilaSeleccionada"
        rowHover
      >
        <Column field="nombre" header="Evento" sortable>
          <template #body="{ data }">
            <div class="font-bold text-slate-800 hover:text-emerald-600 transition-colors cursor-pointer">
              {{ data.nombre }}
            </div>
            <div class="text-xs text-slate-500 font-normal">
              {{ data.cliente }}
            </div>
          </template>
        </Column>

        <Column field="fecha" header="Fecha" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-1.5 text-xs text-slate-700">
              <i class="pi pi-calendar text-slate-400 text-[11px]"></i>
              <span>{{ formatearFecha(data.fecha) }}</span>
            </div>
          </template>
        </Column>

        <Column field="estado" header="Estado" sortable>
          <template #body="{ data }">
            <Tag
              :value="etiquetaEstado(data.estado)"
              :severity="severidadEstado(data.estado)"
              class="!text-xs uppercase tracking-wider font-bold"
            />
          </template>
        </Column>

        <Column field="ingreso_pactado" header="Ingreso" sortable>
          <template #body="{ data }">
            <span class="font-mono text-xs text-slate-700 font-medium">
              {{ formatearMoneda(data.ingreso_pactado) }}
            </span>
          </template>
        </Column>

        <Column field="ganancia_neta" header="Ganancia" sortable>
          <template #body="{ data }">
            <span
              class="font-mono text-xs font-bold px-2 py-0.5 rounded"
              :class="
                (data.ganancia_neta ?? 0) >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              "
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
              text
              rounded
              size="small"
              title="Ver detalle del evento"
              @click.stop="router.push(`/eventos/${data.evento_id || data.id}`)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal Nuevo Evento -->
    <Dialog
      v-model:visible="dialogNuevo"
      modal
      header="Registrar Nuevo Evento"
      :style="{ width: '90vw', maxWidth: '650px' }"
    >
      <EventoForm
        :cargando="guardando"
        @guardar="guardarNuevoEvento"
        @cancelar="dialogNuevo = false"
      />
    </Dialog>
  </AppLayout>
</template>
