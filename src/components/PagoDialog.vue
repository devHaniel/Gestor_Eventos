<script setup>
import { ref, watch, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { formatearMoneda, formatearFecha } from '../utils/formato.js'
import { METODOS_PAGO } from '../utils/estados.js'
import { usePagos } from '../composables/usePagos.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  asignacion: {
    type: Object,
    default: null,
  },
  cargando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible', 'pago-registrado', 'pago-eliminado'])

const confirm = useConfirm()
const toast = useToast()
const { listaPagos, listarPagos, eliminarPago } = usePagos()

const monto = ref(0)
const metodo = ref('transferencia')
const referencia = ref('')
const notas = ref('')
const fecha = ref(new Date().toISOString().slice(0, 10))
const cargandoHistorial = ref(false)

const pendiente = computed(() => {
  return Number(props.asignacion?.monto_pendiente) || 0
})

const nuevoSaldoRestante = computed(() => {
  const rest = pendiente.value - (Number(monto.value) || 0)
  return rest
})

watch(
  () => [props.asignacion, props.visible],
  async ([asig, esVisible]) => {
    if (asig && esVisible) {
      monto.value = Number(asig.monto_pendiente) > 0 ? Number(asig.monto_pendiente) : 0
      referencia.value = ''
      notas.value = ''
      fecha.value = new Date().toISOString().slice(0, 10)

      cargandoHistorial.value = true
      try {
        await listarPagos(asig.asignacion_id)
      } catch (e) {
        console.error('Error al listar pagos:', e)
        toast.add({
          severity: 'error',
          summary: 'No se pudo cargar el historial',
          detail: e.message || 'Intenta de nuevo.',
          life: 4000,
        })
      } finally {
        cargandoHistorial.value = false
      }
    }
  },
  { immediate: true }
)

function fijarTotalPendiente() {
  monto.value = pendiente.value
}

function fijarMitadPendiente() {
  monto.value = Math.round((pendiente.value / 2) * 100) / 100
}

function enviarPago() {
  if (monto.value <= 0) return

  // Validar si el pago es mayor al pendiente
  if (monto.value > pendiente.value) {
    const exceso = monto.value - pendiente.value
    confirm.require({
      message: `El monto ingresado (${formatearMoneda(monto.value)}) supera el saldo pendiente (${formatearMoneda(pendiente.value)}) por un exceso de ${formatearMoneda(exceso)}. ¿Deseas confirmar este pago extraordinario?`,
      header: 'Advertencia de Sobrepago',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar Sobrepago',
      rejectLabel: 'Corregir Monto',
      acceptClass: 'p-button-warn',
      accept: () => {
        ejecutarRegistro()
      },
    })
  } else {
    ejecutarRegistro()
  }
}

function ejecutarRegistro() {
  emit('pago-registrado', {
    asignacion_id: props.asignacion.asignacion_id,
    monto: monto.value,
    metodo: metodo.value,
    referencia: referencia.value,
    notas: notas.value,
    fecha: fecha.value,
  })
}

function confirmarEliminarPago(pago) {
  confirm.require({
    message: `¿Eliminar el abono registrado de ${formatearMoneda(pago.monto)}? Esto restaurará el saldo pendiente de la persona.`,
    header: 'Eliminar Pago Registrado',
    icon: 'pi pi-trash',
    acceptLabel: 'Eliminar Pago',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await eliminarPago(pago.id)
        await listarPagos(props.asignacion.asignacion_id)
        emit('pago-eliminado')
      } catch (err) {
        console.error(err)
        toast.add({
          severity: 'error',
          summary: 'No se pudo eliminar el pago',
          detail: err.message || 'Intenta de nuevo.',
          life: 4000,
        })
      }
    },
  })
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :header="`Registrar Abono a ${asignacion?.personal || ''}`"
    :style="{ width: '90vw', maxWidth: '580px' }"
  >
    <div class="space-y-5">
      <!-- Tarjeta informativa del saldo -->
      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <span class="text-slate-500 block mb-0.5">Total a Pagar</span>
          <span class="font-mono font-bold text-slate-800 text-sm">
            {{ formatearMoneda(asignacion?.monto_a_pagar) }}
          </span>
        </div>
        <div>
          <span class="text-slate-500 block mb-0.5">Pagado a la Fecha</span>
          <span class="font-mono font-bold text-emerald-600 text-sm">
            {{ formatearMoneda(asignacion?.monto_pagado) }}
          </span>
        </div>
        <div>
          <span class="text-slate-500 block mb-0.5">Saldo Pendiente</span>
          <span class="font-mono font-bold text-amber-600 text-sm">
            {{ formatearMoneda(asignacion?.monto_pendiente) }}
          </span>
        </div>
      </div>

      <!-- Formulario de Nuevo Pago -->
      <form @submit.prevent="enviarPago" class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-bold uppercase text-slate-700">
              Monto a Abonar (HNL) <span class="text-rose-500">*</span>
            </label>
            <!-- Atajos rápidos -->
            <div class="flex items-center gap-1.5" v-if="pendiente > 0">
              <Button
                type="button"
                :label="`Total (${formatearMoneda(pendiente)})`"
                size="small"
                severity="success"
                variant="outlined"
                class="!text-[11px] !py-0.5 !px-2"
                @click="fijarTotalPendiente"
              />
              <Button
                type="button"
                :label="`50% (${formatearMoneda(pendiente / 2)})`"
                size="small"
                severity="secondary"
                variant="outlined"
                class="!text-[11px] !py-0.5 !px-2"
                @click="fijarMitadPendiente"
              />
            </div>
          </div>

          <InputNumber
            v-model="monto"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :min="0.01"
            mode="decimal"
            class="w-full text-base font-mono"
          />

          <!-- Indicador en tiempo real del saldo resultante -->
          <div class="mt-1.5 flex items-center justify-between text-xs">
            <span class="text-slate-500">Saldo pendiente tras este pago:</span>
            <span
              class="font-mono font-bold"
              :class="nuevoSaldoRestante < 0 ? 'text-rose-600' : nuevoSaldoRestante === 0 ? 'text-emerald-600' : 'text-slate-700'"
            >
              {{ nuevoSaldoRestante < 0 ? `Exceso de +${formatearMoneda(Math.abs(nuevoSaldoRestante))}` : formatearMoneda(nuevoSaldoRestante) }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Método de Pago
            </label>
            <Select
              v-model="metodo"
              :options="METODOS_PAGO"
              optionLabel="label"
              optionValue="value"
              class="w-full text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Fecha del Abono
            </label>
            <DatePicker
              v-model="fecha"
              dateFormat="yy-mm-dd"
              updateModelType="string"
              showIcon
              class="w-full text-sm"
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Referencia / Comprobante
            </label>
            <InputText
              v-model="referencia"
              placeholder="Ej: Transf #9482 / Recibo"
              class="w-full text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Notas Adicionales
            </label>
            <InputText
              v-model="notas"
              placeholder="Observación..."
              class="w-full text-sm"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            variant="text"
            @click="$emit('update:visible', false)"
          />
          <Button
            type="submit"
            :loading="cargando"
            :disabled="monto <= 0"
            label="Registrar Pago"
            icon="pi pi-check"
          />
        </div>
      </form>

      <!-- Historial de Pagos de la Asignación -->
      <div class="pt-4 border-t border-slate-200">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-xs font-bold uppercase text-slate-700 tracking-wider">
            Historial de Pagos Previos
          </h4>
          <span class="text-xs text-slate-400 font-medium">{{ listaPagos.length }} registros</span>
        </div>

        <div v-if="cargandoHistorial" class="text-center py-4 text-xs text-slate-400">
          <i class="pi pi-spin pi-spinner mr-1"></i> Cargando historial de pagos...
        </div>

        <div v-else-if="listaPagos.length === 0" class="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-lg">
          No hay pagos previos registrados para esta persona en este evento.
        </div>

        <div v-else class="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
          <div
            v-for="pago in listaPagos"
            :key="pago.id"
            class="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-slate-800">{{ formatearMoneda(pago.monto) }}</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                  {{ pago.metodo }}
                </span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                {{ formatearFecha(pago.fecha) }}
                <span v-if="pago.referencia">&bull; Ref: {{ pago.referencia }}</span>
                <span v-if="pago.notas">&bull; {{ pago.notas }}</span>
              </div>
            </div>

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              title="Eliminar este pago"
              @click="confirmarEliminarPago(pago)"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
