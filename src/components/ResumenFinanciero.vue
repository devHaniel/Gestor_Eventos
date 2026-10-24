<script setup>
import { computed } from 'vue'
import { formatearMoneda } from '../utils/formato.js'

const props = defineProps({
  resumen: {
    type: Object,
    default: () => ({}),
  },
  cargando: {
    type: Boolean,
    default: false,
  },
})

const pendienteCobro = computed(() => {
  const pactado = Number(props.resumen?.ingreso_pactado) || 0
  const cobrado = Number(props.resumen?.cobrado) || 0
  return Math.max(0, pactado - cobrado)
})

const pendientePersonal = computed(() => {
  const costo = Number(props.resumen?.costo_personal) || 0
  const pagado = Number(props.resumen?.personal_pagado) || 0
  return Math.max(0, costo - pagado)
})

const gananciaNeta = computed(() => Number(props.resumen?.ganancia_neta) || 0)
</script>

<template>
  <Card class="!shadow-xs !border !border-slate-200">
    <template #content>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
        <!-- Ingreso pactado -->
        <div class="space-y-0.5">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Ingreso pactado</span>
          <div class="text-base font-bold font-mono text-slate-900">
            {{ formatearMoneda(resumen?.ingreso_pactado) }}
          </div>
          <span class="text-[11px] text-slate-400">Total presupuestado</span>
        </div>

        <!-- Cobrado al cliente -->
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Cobrado</span>
            <Tag v-if="pendienteCobro === 0 && Number(resumen?.ingreso_pactado) > 0" value="100%" severity="success" class="!text-[10px] !py-0 !px-1" />
          </div>
          <div class="text-base font-bold font-mono text-emerald-600">
            {{ formatearMoneda(resumen?.cobrado) }}
          </div>
          <span class="text-[11px] text-slate-500">
            Pendiente: <strong class="font-mono text-slate-700">{{ formatearMoneda(pendienteCobro) }}</strong>
          </span>
        </div>

        <!-- Personal -->
        <div class="space-y-0.5">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Personal</span>
          <div class="text-base font-bold font-mono text-slate-900">
            {{ formatearMoneda(resumen?.costo_personal) }}
          </div>
          <span class="text-[11px]" :class="pendientePersonal > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'">
            Por pagar: <strong class="font-mono">{{ formatearMoneda(pendientePersonal) }}</strong>
          </span>
        </div>

        <!-- Gastos operativos -->
        <div class="space-y-0.5">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Gastos extras</span>
          <div class="text-base font-bold font-mono text-slate-900">
            {{ formatearMoneda(resumen?.total_gastos) }}
          </div>
          <span class="text-[11px] text-slate-400">Compras e insumos</span>
        </div>

        <!-- Ganancia neta -->
        <div
          class="p-3 rounded-lg border flex flex-col justify-center"
          :class="gananciaNeta >= 0 ? 'bg-emerald-50/70 border-emerald-200/80' : 'bg-rose-50/70 border-rose-200/80'"
        >
          <span
            class="text-xs font-semibold uppercase tracking-wider"
            :class="gananciaNeta >= 0 ? 'text-emerald-800' : 'text-rose-800'"
          >
            Ganancia neta
          </span>
          <div
            class="text-lg font-extrabold font-mono"
            :class="gananciaNeta >= 0 ? 'text-emerald-700' : 'text-rose-700'"
          >
            {{ formatearMoneda(gananciaNeta) }}
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
