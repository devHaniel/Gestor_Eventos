<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  evento: {
    type: Object,
    default: null,
  },
  cargando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['guardar', 'cancelar'])

const estados = [
  { label: 'Borrador', value: 'borrador' },
  { label: 'Confirmado', value: 'confirmado' },
  { label: 'En curso', value: 'en_curso' },
  { label: 'Finalizado', value: 'finalizado' },
  { label: 'Cancelado', value: 'cancelado' },
]

const formulario = ref({
  nombre: '',
  cliente: '',
  lugar: '',
  fecha: new Date().toISOString().slice(0, 10),
  hora_inicio: '12:00',
  hora_fin: '18:00',
  num_invitados: null,
  ingreso_pactado: 0,
  estado: 'borrador',
  notas: '',
})

watch(
  () => props.evento,
  (nuevo) => {
    if (nuevo) {
      formulario.value = {
        nombre: nuevo.nombre ?? '',
        cliente: nuevo.cliente ?? '',
        lugar: nuevo.lugar ?? '',
        fecha: nuevo.fecha ? nuevo.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
        hora_inicio: nuevo.hora_inicio ? nuevo.hora_inicio.slice(0, 5) : '12:00',
        hora_fin: nuevo.hora_fin ? nuevo.hora_fin.slice(0, 5) : '18:00',
        num_invitados: nuevo.num_invitados ?? null,
        ingreso_pactado: Number(nuevo.ingreso_pactado) || 0,
        estado: nuevo.estado ?? 'borrador',
        notas: nuevo.notas ?? '',
      }
    } else {
      formulario.value = {
        nombre: '',
        cliente: '',
        lugar: '',
        fecha: new Date().toISOString().slice(0, 10),
        hora_inicio: '12:00',
        hora_fin: '18:00',
        num_invitados: null,
        ingreso_pactado: 0,
        estado: 'borrador',
        notas: '',
      }
    }
  },
  { immediate: true }
)

function submit() {
  if (!formulario.value.nombre.trim() || !formulario.value.cliente.trim() || !formulario.value.fecha) {
    return
  }

  const datos = {
    ...formulario.value,
    num_invitados: formulario.value.num_invitados ? Number(formulario.value.num_invitados) : null,
    ingreso_pactado: Number(formulario.value.ingreso_pactado) || 0,
  }

  emit('guardar', datos)
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Nombre del Evento <span class="text-rose-500">*</span>
        </label>
        <InputText
          v-model="formulario.nombre"
          required
          placeholder="Ej: Boda Martínez & López"
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Cliente / Empresa <span class="text-rose-500">*</span>
        </label>
        <InputText
          v-model="formulario.cliente"
          required
          placeholder="Ej: Banco Atlántida / Laura M."
          class="w-full"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Lugar / Ubicación
        </label>
        <InputText
          v-model="formulario.lugar"
          placeholder="Ej: Salón Real, Hotel Clarion"
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Fecha del Evento <span class="text-rose-500">*</span>
        </label>
        <input
          type="date"
          v-model="formulario.fecha"
          required
          class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Hora de Inicio
        </label>
        <input
          type="time"
          v-model="formulario.hora_inicio"
          class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Hora de Fin
        </label>
        <input
          type="time"
          v-model="formulario.hora_fin"
          class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          N° de Invitados
        </label>
        <InputNumber
          v-model="formulario.num_invitados"
          :min="0"
          placeholder="Ej: 150"
          class="w-full"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Ingreso Pactado (HNL)
        </label>
        <InputNumber
          v-model="formulario.ingreso_pactado"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          :min="0"
          mode="decimal"
          placeholder="0.00"
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Estado
        </label>
        <Select
          v-model="formulario.estado"
          :options="estados"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar estado"
          class="w-full"
        />
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
        Notas u Observaciones
      </label>
      <Textarea
        v-model="formulario.notas"
        rows="2"
        placeholder="Detalles del menú, requerimientos especiales del cliente..."
        class="w-full"
      />
    </div>

    <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
      <Button
        type="button"
        label="Cancelar"
        severity="secondary"
        text
        @click="$emit('cancelar')"
      />
      <Button
        type="submit"
        :loading="cargando"
        :label="evento ? 'Guardar Cambios' : 'Crear Evento'"
        icon="pi pi-check"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
      />
    </div>
  </form>
</template>
