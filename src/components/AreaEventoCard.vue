<script setup>
import { ref, computed, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { formatearMoneda } from '../utils/formato.js'
import { severidadEstadoPago, etiquetaEstadoPago } from '../utils/estados.js'

const props = defineProps({
  area: {
    type: Object,
    required: true,
  },
  asignaciones: {
    type: Array,
    default: () => [],
  },
  cargando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'actualizar-area',
  'quitar-area',
  'abrir-asignar',
  'actualizar-asignacion',
  'quitar-asignacion',
  'pagar-area',
])

const confirm = useConfirm()

// Sincronizar monto local para no disparar peticiones en cada pulsación de tecla
const montoAreaLocal = ref(Number(props.area.monto_area) || 0)
watch(
  () => props.area.monto_area,
  (val) => {
    montoAreaLocal.value = Number(val) || 0
  }
)

// Asignaciones correspondientes a esta área
const asignacionesDelArea = computed(() => {
  return props.asignaciones.filter(
    (a) => a.evento_area_id === props.area.evento_area_id || a.evento_area_id === props.area.id
  )
})

// Verificar si reparto es por_horas pero nadie tiene horas registradas
const advertenciaHoras = computed(() => {
  if (props.area.tipo_pago !== 'por_area') return false
  if (props.area.metodo_reparto !== 'por_horas') return false
  if (asignacionesDelArea.value.length === 0) return false
  const totalHoras = asignacionesDelArea.value.reduce(
    (sum, a) => sum + (Number(a.horas) || 0),
    0
  )
  return totalHoras === 0
})

const totalHorasRegistradas = computed(() => {
  return asignacionesDelArea.value.reduce(
    (sum, a) => sum + (Number(a.horas) || 0),
    0
  )
})

const pendienteArea = computed(() => {
  const costo = Number(props.area.costo_area) || 0
  const pagado = Number(props.area.pagado_area) || 0
  return Math.max(0, costo - pagado)
})

// Control de edición rápida de asignación
const asignacionEnEdicion = ref(null)
const datosEdicion = ref({ horas: 0, rol_en_evento: '', tarifa_hora: 0, pago_individual: null })

function iniciarEdicion(asig) {
  asignacionEnEdicion.value = asig.asignacion_id
  datosEdicion.value = {
    horas: asig.horas ?? 0,
    rol_en_evento: asig.rol_en_evento ?? '',
    tarifa_hora: asig.tarifa_hora ?? 0,
    pago_individual: asig.pago_individual ?? null,
  }
}

function cancelarEdicion() {
  asignacionEnEdicion.value = null
}

function guardarEdicion(asigId) {
  emit('actualizar-asignacion', {
    id: asigId,
    datos: { ...datosEdicion.value },
  })
  asignacionEnEdicion.value = null
}

function cambiarTipoPago(nuevoTipo) {
  emit('actualizar-area', {
    id: props.area.id,
    config: {
      tipo_pago: nuevoTipo,
      metodo_reparto: nuevoTipo === 'por_area' ? (props.area.metodo_reparto || 'equitativo') : null,
      monto_area: nuevoTipo === 'por_area' ? (Number(montoAreaLocal.value) || 0) : null,
    },
  })
}

function cambiarMetodoReparto(nuevoMetodo) {
  emit('actualizar-area', {
    id: props.area.id,
    config: {
      tipo_pago: 'por_area',
      metodo_reparto: nuevoMetodo,
      monto_area: Number(montoAreaLocal.value) || 0,
    },
  })
}

function aplicarMontoArea() {
  const val = Number(montoAreaLocal.value) || 0
  if (val !== Number(props.area.monto_area)) {
    emit('actualizar-area', {
      id: props.area.id,
      config: {
        tipo_pago: 'por_area',
        metodo_reparto: props.area.metodo_reparto || 'equitativo',
        monto_area: val,
      },
    })
  }
}

function confirmarQuitarArea() {
  confirm.require({
    message: `¿Seguro que deseas desvincular el área "${props.area.area_nombre}" del evento? Se removerán sus asignaciones.`,
    header: 'Quitar Área del Evento',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Quitar Área',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => {
      emit('quitar-area', props.area.id)
    },
  })
}

function confirmarQuitarAsignacion(asig) {
  confirm.require({
    message: `¿Remover a ${asig.personal} de esta área?`,
    header: 'Quitar Asignación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Remover',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => {
      emit('quitar-asignacion', asig.asignacion_id)
    },
  })
}
</script>

<template>
  <Card class="mb-6 !shadow-xs !border !border-slate-200 overflow-hidden">
    <template #header>
      <!-- Cabecera del Área con Métricas y Acciones -->
      <div class="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 mt-0.5">
              <i class="pi pi-users"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base font-bold text-slate-900">{{ area.area_nombre }}</h3>
                <Tag
                  :value="area.tipo_pago === 'por_area' ? 'Bolsa por área' : 'Tarifa por persona'"
                  :severity="area.tipo_pago === 'por_area' ? 'info' : 'secondary'"
                  class="!text-xs font-semibold"
                />
                <span v-if="area.tipo_pago === 'por_area'" class="text-xs text-slate-500 font-medium">
                  ({{ area.metodo_reparto === 'por_horas' ? 'Reparto por horas' : 'Reparto equitativo' }})
                </span>
              </div>
              <div class="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span><strong>{{ asignacionesDelArea.length }}</strong> asignados</span>
                <span class="text-slate-300">&bull;</span>
                <span>Total Horas: <strong class="font-mono text-slate-700">{{ totalHorasRegistradas }}h</strong></span>
                <span class="text-slate-300">&bull;</span>
                <span>Costo: <strong class="font-mono text-slate-800">{{ formatearMoneda(area.costo_area) }}</strong></span>
                <span class="text-slate-300">&bull;</span>
                <span>Pagado: <strong class="font-mono text-emerald-600">{{ formatearMoneda(area.pagado_area) }}</strong></span>
                <span class="text-slate-300">&bull;</span>
                <span>
                  Pendiente:
                  <strong
                    class="font-mono"
                    :class="pendienteArea > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'"
                  >
                    {{ formatearMoneda(pendienteArea) }}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <!-- Acciones principales de área -->
          <div class="flex flex-wrap items-center gap-2">
            <Button
              v-if="pendienteArea > 0"
              label="Liquidar Pendiente"
              icon="pi pi-check-circle"
              severity="success"
              size="small"
              class="text-xs font-semibold"
              @click="$emit('pagar-area', area)"
            />
            <Button
              label="Asignar Personal"
              icon="pi pi-user-plus"
              size="small"
              class="text-xs font-semibold"
              @click="$emit('abrir-asignar', area)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              rounded
              size="small"
              title="Quitar área del evento"
              @click="confirmarQuitarArea"
            />
          </div>
        </div>

        <!-- Parámetros de Modalidad de Pago -->
        <div class="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Forma de pago del área
            </label>
            <Select
              :modelValue="area.tipo_pago"
              :options="[
                { label: 'Por persona (tarifa / horas)', value: 'individual' },
                { label: 'Monto por área (bolsa cerrada)', value: 'por_area' },
              ]"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="cambiarTipoPago"
              class="w-full text-xs"
            />
          </div>

          <div v-if="area.tipo_pago === 'por_area'">
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Criterio de reparto
            </label>
            <Select
              :modelValue="area.metodo_reparto"
              :options="[
                { label: 'En partes iguales (equitativo)', value: 'equitativo' },
                { label: 'Proporcional a las horas', value: 'por_horas' },
              ]"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="cambiarMetodoReparto"
              class="w-full text-xs"
            />
          </div>

          <div v-if="area.tipo_pago === 'por_area'">
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Bolsa total del área (HNL)
            </label>
            <div class="flex items-center gap-1.5">
              <InputNumber
                v-model="montoAreaLocal"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                :min="0"
                mode="decimal"
                placeholder="0.00"
                class="w-full text-xs font-mono"
                @blur="aplicarMontoArea"
                @keydown.enter="aplicarMontoArea"
              />
              <Button
                icon="pi pi-check"
                size="small"
                severity="secondary"
                variant="outlined"
                title="Guardar bolsa"
                @click="aplicarMontoArea"
              />
            </div>
          </div>
        </div>

        <!-- Alerta de horas con PrimeVue Message -->
        <Message
          v-if="advertenciaHoras"
          severity="warn"
          icon="pi pi-exclamation-triangle"
          class="mt-3 text-xs"
        >
          <strong>Horas no registradas:</strong> Ningún colaborador tiene horas cargadas en esta área, por lo que el monto se reparte equitativamente hasta que registres sus horas.
        </Message>
      </div>
    </template>

    <template #content>
      <!-- Tabla PrimeVue de Personal Asignado -->
      <DataTable
        :value="asignacionesDelArea"
        class="p-datatable-sm"
        tableStyle="min-width: 50rem"
        emptyMessage="No hay personal asignado a esta área todavía."
      >
        <template #empty>
          <div class="py-8 text-center text-slate-400">
            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-lg mx-auto mb-2">
              <i class="pi pi-user-plus"></i>
            </div>
            <p class="font-medium text-slate-700 text-sm">No hay colaboradores asignados a esta área</p>
            <p class="text-xs text-slate-400 mt-0.5 mb-3">Asigna personal del equipo para calcular sus pagos automáticamente.</p>
            <Button
              label="Asignar colaboradores"
              icon="pi pi-plus"
              size="small"
              class="text-xs"
              @click="$emit('abrir-asignar', area)"
            />
          </div>
        </template>

        <!-- Colaborador -->
        <Column field="personal" header="Colaborador">
          <template #body="{ data }">
            <div class="font-semibold text-slate-800 text-xs">{{ data.personal }}</div>
            <div v-if="data.notas" class="text-[10px] text-slate-400 italic">{{ data.notas }}</div>
          </template>
        </Column>

        <!-- Rol en Evento -->
        <Column field="rol_en_evento" header="Rol en Evento">
          <template #body="{ data }">
            <template v-if="asignacionEnEdicion === data.asignacion_id">
              <InputText
                v-model="datosEdicion.rol_en_evento"
                class="w-32 !py-1 text-xs"
                placeholder="Rol..."
              />
            </template>
            <template v-else>
              <span class="text-slate-600 text-xs">{{ data.rol_en_evento || 'Sin rol' }}</span>
            </template>
          </template>
        </Column>

        <!-- Horas -->
        <Column field="horas" header="Horas">
          <template #body="{ data }">
            <template v-if="asignacionEnEdicion === data.asignacion_id">
              <InputNumber
                v-model="datosEdicion.horas"
                :min="0"
                :maxFractionDigits="1"
                class="w-20 !py-1 text-xs font-mono"
              />
            </template>
            <template v-else>
              <span class="font-mono text-xs font-medium text-slate-800">{{ data.horas ?? 0 }}h</span>
            </template>
          </template>
        </Column>

        <!-- Modalidad Asignada (Solo si es individual) -->
        <Column v-if="area.tipo_pago === 'individual'" header="Modalidad Base">
          <template #body="{ data }">
            <template v-if="asignacionEnEdicion === data.asignacion_id">
              <div class="space-y-1">
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-slate-400 w-12">Fijo:</span>
                  <InputNumber
                    v-model="datosEdicion.pago_individual"
                    :min="0"
                    placeholder="Fijo..."
                    class="w-24 !py-0.5 text-xs font-mono"
                  />
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-slate-400 w-12">Tarifa/h:</span>
                  <InputNumber
                    v-model="datosEdicion.tarifa_hora"
                    :min="0"
                    placeholder="Tarifa..."
                    class="w-24 !py-0.5 text-xs font-mono"
                  />
                </div>
              </div>
            </template>
            <template v-else>
              <div v-if="data.pago_individual" class="font-mono font-semibold text-slate-700 text-xs">
                {{ formatearMoneda(data.pago_individual) }}
                <span class="text-[10px] text-slate-400 font-normal block">(Monto Fijo)</span>
              </div>
              <div v-else class="text-slate-600 font-mono text-xs">
                {{ formatearMoneda(data.tarifa_hora) }}/h
                <span class="text-[10px] text-slate-400 block">({{ data.horas ?? 0 }}h × tarifa)</span>
              </div>
            </template>
          </template>
        </Column>

        <!-- A Pagar Calculado -->
        <Column field="monto_a_pagar" header="A Pagar">
          <template #body="{ data }">
            <span class="font-mono text-xs font-bold text-slate-900">
              {{ formatearMoneda(data.monto_a_pagar) }}
            </span>
          </template>
        </Column>

        <!-- Pagado -->
        <Column field="monto_pagado" header="Pagado">
          <template #body="{ data }">
            <span class="font-mono text-xs font-semibold text-emerald-600">
              {{ formatearMoneda(data.monto_pagado) }}
            </span>
          </template>
        </Column>

        <!-- Pendiente -->
        <Column field="monto_pendiente" header="Pendiente">
          <template #body="{ data }">
            <span
              class="font-mono text-xs font-bold"
              :class="Number(data.monto_pendiente) > 0 ? 'text-amber-600' : 'text-slate-400'"
            >
              {{ formatearMoneda(data.monto_pendiente) }}
            </span>
          </template>
        </Column>

        <!-- Estado Pago -->
        <Column field="estado_pago" header="Estado">
          <template #body="{ data }">
            <Tag
              :value="etiquetaEstadoPago(data.estado_pago)"
              :severity="severidadEstadoPago(data.estado_pago)"
              class="!text-[10px] uppercase font-bold"
            />
          </template>
        </Column>

        <!-- Acciones -->
        <Column header="Acciones" headerStyle="width: 5rem" bodyClass="text-right">
          <template #body="{ data }">
            <template v-if="asignacionEnEdicion === data.asignacion_id">
              <div class="flex items-center justify-end gap-1">
                <Button
                  icon="pi pi-check"
                  severity="success"
                  size="small"
                  rounded
                  title="Guardar cambios"
                  @click="guardarEdicion(data.asignacion_id)"
                />
                <Button
                  icon="pi pi-times"
                  severity="secondary"
                  size="small"
                  rounded
                  variant="text"
                  title="Cancelar"
                  @click="cancelarEdicion"
                />
              </div>
            </template>
            <template v-else>
              <div class="flex items-center justify-end gap-1">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  size="small"
                  variant="text"
                  rounded
                  title="Modificar horas, rol o tarifa"
                  @click="iniciarEdicion(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  variant="text"
                  rounded
                  title="Remover de esta área"
                  @click="confirmarQuitarAsignacion(data)"
                />
              </div>
            </template>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>
