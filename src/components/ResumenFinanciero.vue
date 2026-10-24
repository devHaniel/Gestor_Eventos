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
  <div class="bg-white rounded-xl border border-slate-200 p-4">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div>
        <p class="text-xs text-slate-500">Ingreso pactado</p>
        <p class="text-base font-semibold text-slate-800 mt-0.5">
          {{ formatearMoneda(resumen?.ingreso_pactado) }}
        </p>
      </div>

      <div>
        <p class="text-xs text-slate-500">Cobrado</p>
        <p class="text-base font-semibold text-emerald-600 mt-0.5">
          {{ formatearMoneda(resumen?.cobrado) }}
        </p>
        <p class="text-[11px] text-slate-400">
          Falta {{ formatearMoneda(pendienteCobro) }}
        </p>
      </div>

      <div>
        <p class="text-xs text-slate-500">Personal</p>
        <p class="text-base font-semibold text-slate-800 mt-0.5">
          {{ formatearMoneda(resumen?.costo_personal) }}
        </p>
        <p class="text-[11px] text-slate-400">
          Por pagar {{ formatearMoneda(pendientePersonal) }}
        </p>
      </div>

      <div>
        <p class="text-xs text-slate-500">Gastos</p>
        <p class="text-base font-semibold text-slate-800 mt-0.5">
          {{ formatearMoneda(resumen?.total_gastos) }}
        </p>
      </div>

      <div class="rounded-lg px-3 py-2 -my-1" :class="gananciaNeta >= 0 ? 'bg-emerald-50' : 'bg-rose-50'">
        <p class="text-xs" :class="gananciaNeta >= 0 ? 'text-emerald-700' : 'text-rose-700'">
          Ganancia neta
        </p>
        <p
          class="text-lg font-bold mt-0.5"
          :class="gananciaNeta >= 0 ? 'text-emerald-700' : 'text-rose-700'"
        >
          {{ formatearMoneda(gananciaNeta) }}
        </p>
      </div>
    </div>
  </div>
</template>
