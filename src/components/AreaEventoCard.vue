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
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6 transition-shadow hover:shadow-sm">
    <!-- Header del Área -->
    <div class="p-5 border-b border-slate-200 bg-slate-50/70">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            <i class="pi pi-users"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-bold text-slate-800">{{ area.area_nombre }}</h3>
              <Tag
                :value="area.tipo_pago === 'por_area' ? 'Bolsa Global Por Área' : 'Pago Individual'"
                :severity="area.tipo_pago === 'por_area' ? 'info' : 'secondary'"
                class="!text-[11px] !font-semibold"
              />
              <span v-if="area.tipo_pago === 'por_area'" class="text-xs text-slate-500 font-medium">
                ({{ area.metodo_reparto === 'por_horas' ? 'Reparto por horas' : 'Reparto equitativo' }})
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              <span><strong>{{ asignacionesDelArea.length }}</strong> asignados</span>
              <span class="text-slate-300">&bull;</span>
              <span>Total Horas: <strong class="font-mono">{{ totalHorasRegistradas }}h</strong></span>
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

        <!-- Acciones principales de la tarjeta de área -->
        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="pendienteArea > 0"
            label="Liquidar Pendiente del Área"
            icon="pi pi-check-circle"
            severity="success"
            size="small"
            class="!text-xs font-semibold"
            @click="$emit('pagar-area', area)"
          />
          <Button
            label="Asignar Personal"
            icon="pi pi-user-plus"
            size="small"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-xs font-semibold"
            @click="$emit('abrir-asignar', area)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            size="small"
            title="Quitar área del evento"
            @click="confirmarQuitarArea"
          />
        </div>
      </div>

      <!-- Configuración de Modalidad de Pago del Área -->
      <div class="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Tipo de Pago -->
        <div>
          <label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Forma de pago
          </label>
          <Select
            :modelValue="area.tipo_pago"
            :options="[
              { label: 'Por persona', value: 'individual' },
              { label: 'Monto por área', value: 'por_area' },
            ]"
            optionLabel="label"
            optionValue="value"
            @update:modelValue="cambiarTipoPago"
            class="w-full text-xs"
          />
        </div>

        <!-- Método de Reparto (Solo si es por_area) -->
        <div v-if="area.tipo_pago === 'por_area'">
          <label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Repartir
          </label>
          <Select
            :modelValue="area.metodo_reparto"
            :options="[
              { label: 'En partes iguales', value: 'equitativo' },
              { label: 'Según las horas', value: 'por_horas' },
            ]"
            optionLabel="label"
            optionValue="value"
            @update:modelValue="cambiarMetodoReparto"
            class="w-full text-xs"
          />
        </div>

        <!-- Monto del Área (Solo si es por_area) -->
        <div v-if="area.tipo_pago === 'por_area'">
          <label class="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Monto del área (HNL)
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
              title="Guardar monto de bolsa"
              @click="aplicarMontoArea"
            />
          </div>
        </div>
      </div>

      <!-- Advertencia si reparto es por horas pero nadie tiene horas -->
      <div
        v-if="advertenciaHoras"
        class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs"
      >
        <i class="pi pi-exclamation-triangle text-amber-600 text-sm mt-0.5"></i>
        <div>
          <span class="font-bold">Faltan las horas:</span>
          nadie tiene horas cargadas en esta área, así que el monto se reparte en partes iguales hasta que las registres.
        </div>
      </div>
    </div>

    <!-- Tabla del Personal Asignado -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-700">
        <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            <th class="py-2.5 px-4">Personal</th>
            <th class="py-2.5 px-4">Rol en Evento</th>
            <th class="py-2.5 px-4">Horas</th>
            <th v-if="area.tipo_pago === 'individual'" class="py-2.5 px-4">Modalidad Asignada</th>
            <th class="py-2.5 px-4 bg-slate-100/60">A Pagar (Calc)</th>
            <th class="py-2.5 px-4">Pagado</th>
            <th class="py-2.5 px-4">Pendiente</th>
            <th class="py-2.5 px-4">Estado</th>
            <th class="py-2.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="asig in asignacionesDelArea"
            :key="asig.asignacion_id"
            class="hover:bg-slate-50/60 transition-colors"
          >
            <!-- Personal -->
            <td class="py-3 px-4">
              <div class="font-bold text-slate-800">{{ asig.personal }}</div>
              <div v-if="asig.notas" class="text-[10px] text-slate-400 italic">{{ asig.notas }}</div>
            </td>

            <!-- Rol -->
            <td class="py-3 px-4">
              <template v-if="asignacionEnEdicion === asig.asignacion_id">
                <InputText
                  v-model="datosEdicion.rol_en_evento"
                  class="w-32 !py-1 text-xs"
                  placeholder="Rol..."
                />
              </template>
              <template v-else>
                <span class="text-slate-600">{{ asig.rol_en_evento || 'Sin rol' }}</span>
              </template>
            </td>

            <!-- Horas -->
            <td class="py-3 px-4">
              <template v-if="asignacionEnEdicion === asig.asignacion_id">
                <InputNumber
                  v-model="datosEdicion.horas"
                  :min="0"
                  :maxFractionDigits="1"
                  class="w-20 !py-1 text-xs font-mono"
                />
              </template>
              <template v-else>
                <span class="font-mono font-medium">{{ asig.horas ?? 0 }}h</span>
              </template>
            </td>

            <!-- Modalidad Asignada (Solo si es individual) -->
            <td v-if="area.tipo_pago === 'individual'" class="py-3 px-4">
              <template v-if="asignacionEnEdicion === asig.asignacion_id">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400 w-12">Fijo:</span>
                    <InputNumber
                      v-model="datosEdicion.pago_individual"
                      :min="0"
                      placeholder="Monto fijo..."
                      class="w-24 !py-1 text-xs font-mono"
                    />
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400 w-12">Tarifa/h:</span>
                    <InputNumber
                      v-model="datosEdicion.tarifa_hora"
                      :min="0"
                      placeholder="Tarifa..."
                      class="w-24 !py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              </template>
              <template v-else>
                <div v-if="asig.pago_individual" class="font-mono font-semibold text-slate-700">
                  {{ formatearMoneda(asig.pago_individual) }}
                  <span class="text-[10px] text-slate-400 font-normal block">(Monto Fijo)</span>
                </div>
                <div v-else class="text-slate-600 font-mono text-[11px]">
                  {{ formatearMoneda(asig.tarifa_hora) }}/h
                  <span class="text-[10px] text-slate-400 block">({{ asig.horas ?? 0 }}h × tarifa)</span>
                </div>
              </template>
            </td>

            <!-- A Pagar (Calculado solo lectura) -->
            <td class="py-3 px-4 font-mono font-bold text-slate-900 bg-slate-100/40">
              {{ formatearMoneda(asig.monto_a_pagar) }}
            </td>

            <!-- Pagado -->
            <td class="py-3 px-4 font-mono font-medium text-emerald-600">
              {{ formatearMoneda(asig.monto_pagado) }}
            </td>

            <!-- Pendiente -->
            <td class="py-3 px-4 font-mono font-semibold" :class="Number(asig.monto_pendiente) > 0 ? 'text-amber-600' : 'text-slate-400'">
              {{ formatearMoneda(asig.monto_pendiente) }}
            </td>

            <!-- Tag Estado Pago -->
            <td class="py-3 px-4">
              <Tag
                :value="etiquetaEstadoPago(asig.estado_pago)"
                :severity="severidadEstadoPago(asig.estado_pago)"
                class="!text-[10px] uppercase font-bold"
              />
            </td>

            <!-- Acciones -->
            <td class="py-3 px-4 text-right">
              <template v-if="asignacionEnEdicion === asig.asignacion_id">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    icon="pi pi-check"
                    severity="success"
                    size="small"
                    rounded
                    title="Guardar cambios"
                    @click="guardarEdicion(asig.asignacion_id)"
                  />
                  <Button
                    icon="pi pi-times"
                    severity="secondary"
                    size="small"
                    rounded
                    text
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
                    text
                    rounded
                    title="Modificar horas, rol o tarifa"
                    @click="iniciarEdicion(asig)"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    text
                    rounded
                    title="Remover de esta área"
                    @click="confirmarQuitarAsignacion(asig)"
                  />
                </div>
              </template>
            </td>
          </tr>

          <tr v-if="asignacionesDelArea.length === 0">
            <td :colspan="area.tipo_pago === 'individual' ? 9 : 8" class="py-8 text-center text-slate-400">
              <div class="flex flex-col items-center justify-center gap-1.5">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-lg mb-1">
                  <i class="pi pi-user-plus"></i>
                </div>
                <p class="font-medium text-slate-600">No hay personal asignado a esta área todavía</p>
                <p class="text-xs text-slate-400">Asigna meseros, cocineros o coordinadores para calcular los pagos.</p>
                <Button
                  label="Asignar primer miembro"
                  icon="pi pi-plus"
                  size="small"
                  class="mt-2 !bg-emerald-600 !border-emerald-600 !text-xs"
                  @click="$emit('abrir-asignar', area)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
