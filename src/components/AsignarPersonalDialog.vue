<script setup>
import { ref, computed, watch } from 'vue'
import { ROLES_EVENTO } from '../utils/roles.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  area: {
    type: Object,
    default: null,
  },
  areas: {
    type: Array,
    default: () => [],
  },
  catalogoPersonal: {
    type: Array,
    default: () => [],
  },
  asignacionesExistentes: {
    type: Array,
    default: () => [],
  },
  cargando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible', 'asignar'])

const areaSeleccionadaId = ref(null)
const personalSeleccionadoId = ref(null)
const formulario = ref({
  rol_en_evento: '',
  horas: 6,
  tarifa_hora: 0,
  pago_individual: null,
  notas: '',
})

const areaActual = computed(() => {
  return (
    props.areas.find((a) => a.id === areaSeleccionadaId.value) ||
    (props.area?.id === areaSeleccionadaId.value ? props.area : null)
  )
})

// Personal activo que todavía no está en el área elegida.
const personalDisponible = computed(() => {
  const asignados = new Set(
    props.asignacionesExistentes
      .filter((a) => a.evento_area_id === areaSeleccionadaId.value)
      .map((a) => a.personal_id)
  )

  return props.catalogoPersonal
    .filter((p) => p.activo && !asignados.has(p.id))
    .map((p) => ({
      label: `${p.nombre}${p.rol_habitual ? ` · ${p.rol_habitual}` : ''}`,
      value: p.id,
      persona: p,
    }))
})

watch(
  () => props.visible,
  (abierto) => {
    if (!abierto) return

    areaSeleccionadaId.value = props.area?.id ?? props.areas[0]?.id ?? null
    personalSeleccionadoId.value = null
    formulario.value = {
      rol_en_evento: '',
      horas: 6,
      tarifa_hora: 0,
      pago_individual: null,
      notas: '',
    }
  }
)

watch(personalSeleccionadoId, (id) => {
  if (!id) return
  const persona = props.catalogoPersonal.find((p) => p.id === id)
  if (persona) {
    formulario.value.rol_en_evento = persona.rol_habitual || ''
    formulario.value.tarifa_hora = Number(persona.tarifa_hora) || 0
  }
})

function submit() {
  if (!personalSeleccionadoId.value || !areaSeleccionadaId.value) return

  emit('asignar', {
    eventoAreaId: areaSeleccionadaId.value,
    personalId: personalSeleccionadoId.value,
    datos: {
      rol_en_evento: formulario.value.rol_en_evento || null,
      horas: Number(formulario.value.horas) || 0,
      tarifa_hora: Number(formulario.value.tarifa_hora) || 0,
      pago_individual:
        areaActual.value?.tipo_pago === 'individual' &&
        formulario.value.pago_individual !== null &&
        formulario.value.pago_individual !== ''
          ? Number(formulario.value.pago_individual)
          : null,
      notas: formulario.value.notas || null,
    },
  })
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    header="Asignar personal"
    :style="{ width: '90vw', maxWidth: '480px' }"
  >
    <form @submit.prevent="submit" class="space-y-4">
      <!-- Área: lista desplegable en lugar de escribirla -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Área
        </label>
        <Select
          v-model="areaSeleccionadaId"
          :options="areas.length ? areas : area ? [area] : []"
          optionLabel="area_nombre"
          optionValue="id"
          placeholder="Selecciona un área"
          class="w-full text-sm"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Persona <span class="text-rose-500">*</span>
        </label>
        <Select
          v-model="personalSeleccionadoId"
          :options="personalDisponible"
          optionLabel="label"
          optionValue="value"
          filter
          placeholder="Busca por nombre"
          class="w-full text-sm"
          emptyMessage="No hay personal disponible en esta área"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Rol
          </label>
          <Select
            v-model="formulario.rol_en_evento"
            :options="ROLES_EVENTO"
            editable
            placeholder="Elige o escribe"
            class="w-full text-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Horas
          </label>
          <InputNumber
            v-model="formulario.horas"
            :min="0"
            :maxFractionDigits="1"
            class="w-full text-sm"
          />
        </div>
      </div>

      <!-- Solo para áreas con pago individual -->
      <div
        v-if="areaActual?.tipo_pago === 'individual'"
        class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
      >
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Tarifa por hora
          </label>
          <InputNumber
            v-model="formulario.tarifa_hora"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :min="0"
            mode="decimal"
            class="w-full text-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Pago fijo
          </label>
          <InputNumber
            v-model="formulario.pago_individual"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :min="0"
            mode="decimal"
            placeholder="Opcional"
            class="w-full text-sm"
          />
        </div>
      </div>

      <Message
        v-else-if="areaActual?.tipo_pago === 'por_area'"
        severity="info"
        size="small"
        icon="pi pi-info-circle"
      >
        El monto de esta área se reparte automáticamente entre todo el personal asignado.
      </Message>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Notas
        </label>
        <InputText
          v-model="formulario.notas"
          placeholder="Opcional"
          class="w-full text-sm"
        />
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
          :disabled="!personalSeleccionadoId || !areaSeleccionadaId"
          label="Asignar Personal"
          icon="pi pi-check"
        />
      </div>
    </form>
  </Dialog>
</template>
