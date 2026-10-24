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
    header: 'Cargar Áreas Estándar',
    icon: 'pi pi-th-large',
    acceptLabel: 'Crear Áreas Estándar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-primary',
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
        <h2 class="text-base sm:text-lg font-bold text-slate-900">Catálogo de Áreas Operativas</h2>
        <p class="text-xs text-slate-500">Configuración de departamentos de servicio para eventos</p>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <Button
          v-if="catalogoAreas.length === 0"
          label="Crear Áreas Estándar"
          icon="pi pi-th-large"
          severity="secondary"
          variant="outlined"
          size="small"
          class="font-semibold text-xs"
          @click="confirmarCargarSugeridas"
        />
        <Button
          label="Nueva Área"
          icon="pi pi-plus"
          size="small"
          class="font-semibold text-xs"
          @click="abrirNueva"
        />
      </div>
    </template>

    <!-- Contenedor Principal con PrimeVue Card -->
    <Card class="!shadow-xs !border !border-slate-200 overflow-hidden">
      <template #header>
        <!-- Filtro y contador -->
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/60">
          <IconField class="w-full sm:w-80">
            <InputIcon class="pi pi-search text-slate-400" />
            <InputText
              v-model="busqueda"
              placeholder="Buscar área por nombre..."
              class="w-full text-xs"
            />
          </IconField>
          <div class="text-xs text-slate-500 font-medium self-end sm:self-center">
            Total: <span class="font-bold text-slate-700">{{ areasFiltradas.length }}</span> áreas
          </div>
        </div>
      </template>

      <template #content>
        <!-- Estado vacío con onboarding -->
        <div v-if="!cargando && catalogoAreas.length === 0" class="py-16 text-center px-4">
          <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl mx-auto mb-3">
            <i class="pi pi-th-large"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-800">No hay áreas configuradas aún</h3>
          <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Las áreas definen los departamentos de trabajo (Cocina, Meseros, Barra) para organizar asignaciones y modalidades de pago.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <Button
              label="Inicializar con Áreas Estándar"
              icon="pi pi-th-large"
              size="small"
              class="text-xs"
              @click="confirmarCargarSugeridas"
            />
            <Button
              label="Crear Área Manual"
              icon="pi pi-plus"
              severity="secondary"
              variant="outlined"
              size="small"
              class="text-xs"
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
              <span class="font-semibold text-slate-900 text-xs">{{ data.nombre }}</span>
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
                class="!text-xs cursor-pointer select-none font-semibold"
                title="Clic para alternar estado"
                @click="toggleEstado(data)"
              />
            </template>
          </Column>

          <Column header="Acciones" headerStyle="width: 5rem" bodyClass="text-right">
            <template #body="{ data }">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                variant="text"
                rounded
                size="small"
                title="Editar área"
                @click="abrirEditar(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

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

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Estado
          </label>
          <div class="flex items-center gap-2.5 pt-1">
            <ToggleSwitch
              v-model="formulario.activa"
              inputId="activa-check"
            />
            <label for="activa-check" class="text-xs font-medium text-slate-700 cursor-pointer select-none">
              Área Activa (disponible para asignaciones en eventos)
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            variant="text"
            @click="dialogAbierto = false"
          />
          <Button
            type="submit"
            :loading="guardando"
            label="Guardar Área"
            icon="pi pi-check"
          />
        </div>
      </form>
    </Dialog>
  </AppLayout>
</template>
