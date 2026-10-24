<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AppLayout from '../components/AppLayout.vue'
import { useAreas } from '../composables/useAreas.js'

const toast = useToast()
const confirm = useConfirm()
const { catalogoAreas, cargando, listarAreas, crearArea, crearAreasSugeridas, actualizarArea } = useAreas()

const busqueda = ref('')
const dialogAbierto = ref(false)
const areaSeleccionada = ref(null)
const guardando = ref(false)

const formulario = ref({
  nombre: '',
  descripcion: '',
  activa: true,
})

const areasFiltradas = computed(() => {
  if (!busqueda.value.trim()) return catalogoAreas.value
  const term = busqueda.value.toLowerCase()
  return catalogoAreas.value.filter(
    (a) =>
      a.nombre?.toLowerCase().includes(term) ||
      a.descripcion?.toLowerCase().includes(term)
  )
})

onMounted(async () => {
  try {
    await listarAreas()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  }
})

function abrirNueva() {
  areaSeleccionada.value = null
  formulario.value = {
    nombre: '',
    descripcion: '',
    activa: true,
  }
  dialogAbierto.value = true
}

function abrirEditar(area) {
  areaSeleccionada.value = area
  formulario.value = {
    nombre: area.nombre ?? '',
    descripcion: area.descripcion ?? '',
    activa: area.activa ?? true,
  }
  dialogAbierto.value = true
}

async function guardar() {
  if (!formulario.value.nombre.trim()) return
  guardando.value = true
  try {
    if (areaSeleccionada.value?.id) {
      await actualizarArea(areaSeleccionada.value.id, formulario.value)
      toast.add({
        severity: 'success',
        summary: 'Área Actualizada',
        detail: 'Área modificada correctamente.',
        life: 3000,
      })
    } else {
      await crearArea(formulario.value)
      toast.add({
        severity: 'success',
        summary: 'Área Creada',
        detail: 'Nueva área añadida al catálogo.',
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

function confirmarCargarSugeridas() {
  confirm.require({
    message: '¿Deseas inicializar el catálogo con las 5 áreas estándar de banquetería (Cocina, Meseros, Barra, Montaje y Pastelería)?',
    header: 'Cargar Áreas Sugeridas',
    icon: 'pi pi-sparkles',
    acceptLabel: 'Crear Áreas Sugeridas',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-success',
    accept: async () => {
      guardando.value = true
      try {
        await crearAreasSugeridas()
        toast.add({
          severity: 'success',
          summary: 'Áreas Creadas',
          detail: 'Se han configurado las áreas estándar de catering.',
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
    },
  })
}

async function toggleEstado(area) {
  try {
    await actualizarArea(area.id, { activa: !area.activa })
    toast.add({
      severity: 'info',
      summary: 'Estado cambiado',
      detail: `El área "${area.nombre}" ahora está ${!area.activa ? 'activa' : 'inactiva'}.`,
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
</script>

<template>
  <AppLayout>
    <template #header-title>
      <div>
        <h2 class="text-lg font-bold text-slate-800">Catálogo de Áreas Operativas</h2>
        <p class="text-xs text-slate-500">Configura departamentos y equipos de servicio para tus eventos</p>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <Button
          v-if="catalogoAreas.length === 0"
          label="Crear Áreas Estándar"
          icon="pi pi-sparkles"
          severity="secondary"
          size="small"
          class="!text-xs font-semibold"
          @click="confirmarCargarSugeridas"
        />
        <Button
          label="Nueva Área"
          icon="pi pi-plus"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-medium text-sm"
          @click="abrirNueva"
        />
      </div>
    </template>

    <div class="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <!-- Filtro y contador -->
      <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="relative w-full sm:w-80">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <InputText
            v-model="busqueda"
            placeholder="Buscar área por nombre..."
            class="w-full !pl-9 !py-1.5 text-sm"
          />
        </div>
        <div class="text-xs text-slate-500 font-medium self-end sm:self-center">
          Total: <span class="font-bold text-slate-700">{{ areasFiltradas.length }}</span> áreas
        </div>
      </div>

      <!-- Estado vacío con onboarding -->
      <div v-if="!cargando && catalogoAreas.length === 0" class="py-16 text-center px-4">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
          <i class="pi pi-th-large"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800">No hay áreas configuradas aún</h3>
        <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          Las áreas definen los departamentos del evento (como Cocina, Meseros o Barra) para asignar personal y definir modalidades de pago.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <Button
            label="Inicializar con Áreas Estándar"
            icon="pi pi-sparkles"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-medium text-xs"
            @click="confirmarCargarSugeridas"
          />
          <Button
            label="Crear Área Personalizada"
            icon="pi pi-plus"
            severity="secondary"
            class="!text-xs font-medium"
            @click="abrirNueva"
          />
        </div>
      </div>

      <!-- Tabla de Áreas -->
      <DataTable
        v-else
        :value="areasFiltradas"
        :loading="cargando"
        paginator
        :rows="10"
        tableStyle="min-width: 40rem"
        class="p-datatable-sm"
        emptyMessage="No se encontraron áreas coincidentes."
      >
        <Column field="nombre" header="Nombre del Área" sortable>
          <template #body="{ data }">
            <span class="font-bold text-slate-800">{{ data.nombre }}</span>
          </template>
        </Column>

        <Column field="descripcion" header="Descripción y Responsabilidades">
          <template #body="{ data }">
            <span class="text-xs text-slate-600">{{ data.descripcion || '-' }}</span>
          </template>
        </Column>

        <Column field="activa" header="Estado" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.activa ? 'Activa' : 'Inactiva'"
              :severity="data.activa ? 'success' : 'secondary'"
              class="!text-xs cursor-pointer select-none"
              title="Clic para alternar estado"
              @click="toggleEstado(data)"
            />
          </template>
        </Column>

        <Column header="Acciones" headerStyle="width: 6rem" bodyClass="text-right">
          <template #body="{ data }">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              size="small"
              title="Editar área"
              @click="abrirEditar(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal Formulario Área -->
    <Dialog
      v-model:visible="dialogAbierto"
      modal
      :header="areaSeleccionada ? 'Editar Área' : 'Nueva Área'"
      :style="{ width: '90vw', maxWidth: '450px' }"
    >
      <form @submit.prevent="guardar" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Nombre del Área <span class="text-rose-500">*</span>
          </label>
          <InputText
            v-model="formulario.nombre"
            required
            placeholder="Ej: Cocina Caliente, Meseros, Barra Principal"
            class="w-full text-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Descripción
          </label>
          <Textarea
            v-model="formulario.descripcion"
            rows="2"
            placeholder="Responsabilidades y detalles del departamento..."
            class="w-full text-sm"
          />
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input
            id="activa-check"
            type="checkbox"
            v-model="formulario.activa"
            class="w-4 h-4 rounded text-emerald-600 border-slate-300"
          />
          <label for="activa-check" class="text-xs font-medium text-slate-700 cursor-pointer">
            Área Activa (disponible para asignaciones en eventos)
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="dialogAbierto = false"
          />
          <Button
            type="submit"
            :loading="guardando"
            label="Guardar Área"
            icon="pi pi-check"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-semibold"
          />
        </div>
      </form>
    </Dialog>
  </AppLayout>
</template>
