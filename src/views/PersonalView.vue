<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import AppLayout from '../components/AppLayout.vue'
import PersonalForm from '../components/PersonalForm.vue'
import { usePersonal } from '../composables/usePersonal.js'
import { formatearMoneda } from '../utils/formato.js'

const {
  listaPersonal,
  listaResumen,
  cargando,
  listarPersonal,
  resumenPersonal,
  crearPersonal,
  actualizarPersonal,
  desactivarPersonal,
  activarPersonal,
} = usePersonal()

const confirm = useConfirm()
const toast = useToast()

const busqueda = ref('')
const filtroEstado = ref('todos') // 'todos' | 'activos' | 'inactivos'
const dialogAbierto = ref(false)
const personalSeleccionado = ref(null)
const guardando = ref(false)

const opcionesFiltroEstado = [
  { label: 'Todo el personal', value: 'todos' },
  { label: 'Solo Activos', value: 'activos' },
  { label: 'Solo Inactivos', value: 'inactivos' },
]

// Unir catálogo con resumen de ganancias y pendientes
const personalConResumen = computed(() => {
  const mapaResumen = new Map()
  for (const r of listaResumen.value) {
    mapaResumen.set(r.personal_id, r)
  }

  return listaPersonal.value.map((p) => {
    const res = mapaResumen.get(p.id) || {}
    return {
      ...p,
      eventos_trabajados: res.eventos_trabajados ?? 0,
      horas_totales: res.horas_totales ?? 0,
      total_ganado: res.total_ganado ?? 0,
      total_pagado: res.total_pagado ?? 0,
      total_pendiente: res.total_pendiente ?? 0,
    }
  })
})

const personalFiltrado = computed(() => {
  return personalConResumen.value.filter((p) => {
    const term = busqueda.value.toLowerCase().trim()
    const cumpleTexto =
      !term ||
      p.nombre?.toLowerCase().includes(term) ||
      p.rol_habitual?.toLowerCase().includes(term) ||
      p.documento?.toLowerCase().includes(term) ||
      p.telefono?.includes(term)

    const cumpleEstado =
      filtroEstado.value === 'todos' ||
      (filtroEstado.value === 'activos' && p.activo) ||
      (filtroEstado.value === 'inactivos' && !p.activo)

    return cumpleTexto && cumpleEstado
  })
})

onMounted(async () => {
  try {
    await Promise.all([listarPersonal(), resumenPersonal()])
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al cargar',
      detail: 'No se pudo obtener el personal: ' + err.message,
      life: 5000,
    })
  }
})

function abrirNuevo() {
  personalSeleccionado.value = null
  dialogAbierto.value = true
}

function abrirEditar(item) {
  personalSeleccionado.value = { ...item }
  dialogAbierto.value = true
}

async function guardarPersonal(datos) {
  guardando.value = true
  try {
    if (personalSeleccionado.value?.id) {
      await actualizarPersonal(personalSeleccionado.value.id, datos)
      toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Datos del personal actualizados correctamente.',
        life: 3000,
      })
    } else {
      await crearPersonal(datos)
      toast.add({
        severity: 'success',
        summary: 'Registrado',
        detail: 'Nuevo miembro del equipo registrado con éxito.',
        life: 3000,
      })
    }
    dialogAbierto.value = false
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al guardar',
      detail: err.message,
      life: 5000,
    })
  } finally {
    guardando.value = false
  }
}

function confirmarDesactivar(item) {
  confirm.require({
    message: `¿Estás seguro de que deseas desactivar a ${item.nombre}? No aparecerá en las opciones para nuevas asignaciones.`,
    header: 'Desactivar Personal',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Desactivar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await desactivarPersonal(item.id)
        toast.add({
          severity: 'info',
          summary: 'Desactivado',
          detail: 'El personal ha sido marcado como inactivo.',
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

async function reactivar(item) {
  try {
    await activarPersonal(item.id)
    toast.add({
      severity: 'success',
      summary: 'Reactivado',
      detail: `${item.nombre} vuelve a estar disponible para asignaciones.`,
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
}
</script>

<template>
  <AppLayout>
    <template #header-title>
      <div>
        <h2 class="text-lg font-bold text-slate-800">Catálogo de Personal</h2>
        <p class="text-xs text-slate-500">Administra el equipo de trabajo, tarifas y consulta saldos</p>
      </div>
    </template>

    <template #header-actions>
      <Button
        label="Nuevo Personal"
        icon="pi pi-plus"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-medium text-sm"
        @click="abrirNuevo"
      />
    </template>

    <!-- Contenedor Principal -->
    <div class="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <!-- Barra de Filtros -->
      <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div class="relative w-full sm:w-80">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <InputText
              v-model="busqueda"
              placeholder="Buscar por nombre, rol, DNI..."
              class="w-full !pl-9 !py-1.5 text-sm"
            />
          </div>

          <Select
            v-model="filtroEstado"
            :options="opcionesFiltroEstado"
            optionLabel="label"
            optionValue="value"
            class="w-full sm:w-44 text-sm"
          />
        </div>

        <div class="text-xs text-slate-500 font-medium self-end sm:self-center">
          Total: <span class="font-bold text-slate-700">{{ personalFiltrado.length }}</span> miembros
        </div>
      </div>

      <!-- Estado vacío si el catálogo no tiene miembros -->
      <div v-if="!cargando && listaPersonal.length === 0" class="py-16 text-center px-4">
        <div class="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
          <i class="pi pi-user-plus"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800">No hay personal registrado aún</h3>
        <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          Agrega a los meseros, cocineros, bartenders y coordinadores de tu equipo para asignarlos a eventos y liquidar sus pagos.
        </p>
        <Button
          label="Registrar Primer Miembro"
          icon="pi pi-plus"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-medium text-xs"
          @click="abrirNuevo"
        />
      </div>

      <!-- Tabla de Personal -->
      <DataTable
        v-else
        :value="personalFiltrado"
        :loading="cargando"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        tableStyle="min-width: 55rem"
        class="p-datatable-sm"
        emptyMessage="No se encontraron registros de personal coincidentes."
      >
        <Column field="nombre" header="Nombre" sortable>
          <template #body="{ data }">
            <div class="font-semibold text-slate-800">{{ data.nombre }}</div>
            <div class="text-xs text-slate-400">
              {{ data.rol_habitual || 'Sin rol' }}
              <span v-if="data.telefono"> · {{ data.telefono }}</span>
            </div>
          </template>
        </Column>

        <Column field="tarifa_hora" header="Tarifa" sortable>
          <template #body="{ data }">
            <span class="font-mono text-xs text-slate-700">{{ formatearMoneda(data.tarifa_hora) }}/h</span>
          </template>
        </Column>

        <Column field="activo" header="Estado" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.activo ? 'Activo' : 'Inactivo'"
              :severity="data.activo ? 'success' : 'secondary'"
              class="!text-xs font-bold"
            />
          </template>
        </Column>

        <Column field="total_ganado" header="Ganado" sortable>
          <template #body="{ data }">
            <span class="font-mono text-xs text-slate-800 font-bold">{{ formatearMoneda(data.total_ganado) }}</span>
          </template>
        </Column>

        <Column field="total_pagado" header="Pagado" sortable>
          <template #body="{ data }">
            <span class="font-mono text-xs text-emerald-600 font-semibold">{{ formatearMoneda(data.total_pagado) }}</span>
          </template>
        </Column>

        <Column field="total_pendiente" header="Pendiente" sortable>
          <template #body="{ data }">
            <span
              class="font-mono text-xs font-bold"
              :class="data.total_pendiente > 0 ? 'text-amber-600' : 'text-slate-400'"
            >
              {{ formatearMoneda(data.total_pendiente) }}
            </span>
          </template>
        </Column>

        <Column header="Acciones" headerStyle="width: 7rem" bodyClass="text-right">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1.5">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                size="small"
                title="Editar personal"
                @click="abrirEditar(data)"
              />
              <Button
                v-if="data.activo"
                icon="pi pi-user-minus"
                severity="danger"
                text
                rounded
                size="small"
                title="Desactivar personal"
                @click="confirmarDesactivar(data)"
              />
              <Button
                v-else
                icon="pi pi-user-plus"
                severity="success"
                text
                rounded
                size="small"
                title="Reactivar personal"
                @click="reactivar(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Diálogo de Creación / Edición -->
    <Dialog
      v-model:visible="dialogAbierto"
      modal
      :header="personalSeleccionado ? 'Editar Personal' : 'Nuevo Miembro de Personal'"
      :style="{ width: '90vw', maxWidth: '540px' }"
    >
      <PersonalForm
        :personal="personalSeleccionado"
        :cargando="guardando"
        @guardar="guardarPersonal"
        @cancelar="dialogAbierto = false"
      />
    </Dialog>
  </AppLayout>
</template>
