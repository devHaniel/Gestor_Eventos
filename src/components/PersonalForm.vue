<script setup>
import { ref, watch } from 'vue'
import { ROLES_EVENTO } from '../utils/roles.js'

const props = defineProps({
  personal: {
    type: Object,
    default: null,
  },
  cargando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['guardar', 'cancelar'])

const formulario = ref({
  nombre: '',
  telefono: '',
  documento: '',
  rol_habitual: '',
  tarifa_hora: 0,
  activo: true,
  notas: '',
})

watch(
  () => props.personal,
  (nuevo) => {
    if (nuevo) {
      formulario.value = {
        nombre: nuevo.nombre ?? '',
        telefono: nuevo.telefono ?? '',
        documento: nuevo.documento ?? '',
        rol_habitual: nuevo.rol_habitual ?? '',
        tarifa_hora: Number(nuevo.tarifa_hora) || 0,
        activo: nuevo.activo ?? true,
        notas: nuevo.notas ?? '',
      }
    } else {
      formulario.value = {
        nombre: '',
        telefono: '',
        documento: '',
        rol_habitual: '',
        tarifa_hora: 0,
        activo: true,
        notas: '',
      }
    }
  },
  { immediate: true }
)

function submit() {
  if (!formulario.value.nombre.trim()) return
  emit('guardar', { ...formulario.value })
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
        Nombre Completo <span class="text-rose-500">*</span>
      </label>
      <InputText
        v-model="formulario.nombre"
        required
        placeholder="Ej: Juan Pérez"
        class="w-full"
      />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Teléfono
        </label>
        <InputText
          v-model="formulario.telefono"
          placeholder="Ej: +504 9999-9999"
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Documento / Identidad
        </label>
        <InputText
          v-model="formulario.documento"
          placeholder="Ej: 0801-1990-12345"
          class="w-full"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Rol Habitual
        </label>
        <Select
          v-model="formulario.rol_habitual"
          :options="ROLES_EVENTO"
          editable
          placeholder="Elige o escribe un rol"
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Tarifa por Hora Base (HNL)
        </label>
        <InputNumber
          v-model="formulario.tarifa_hora"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          :min="0"
          mode="decimal"
          placeholder="0.00"
          class="w-full"
        />
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
        Estado
      </label>
      <div class="flex items-center gap-2 pt-1">
        <input
          id="activo-check"
          type="checkbox"
          v-model="formulario.activo"
          class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
        />
        <label for="activo-check" class="text-sm text-slate-700 cursor-pointer">
          Personal Activo (disponible para asignaciones)
        </label>
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
        Notas adicionales
      </label>
      <Textarea
        v-model="formulario.notas"
        rows="2"
        placeholder="Observaciones, alergias, habilidades..."
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
        :label="personal ? 'Actualizar' : 'Guardar Personal'"
        icon="pi pi-check"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
      />
    </div>
  </form>
</template>
