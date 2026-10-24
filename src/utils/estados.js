export const ESTADOS_EVENTO = [
  { label: 'Borrador', value: 'borrador', severity: 'secondary', icon: 'pi pi-file-edit', desc: 'Planeación inicial' },
  { label: 'Confirmado', value: 'confirmado', severity: 'info', icon: 'pi pi-calendar-plus', desc: 'Fecha y contrato firmados' },
  { label: 'En curso', value: 'en_curso', severity: 'warn', icon: 'pi pi-hourglass', desc: 'Evento en ejecución activa' },
  { label: 'Finalizado', value: 'finalizado', severity: 'success', icon: 'pi pi-check-circle', desc: 'Servicio concluido' },
  { label: 'Cancelado', value: 'cancelado', severity: 'danger', icon: 'pi pi-times-circle', desc: 'Cancelado por el cliente' },
]

export function etiquetaEstado(estado) {
  const item = ESTADOS_EVENTO.find((e) => e.value === estado)
  return item ? item.label : (estado || 'Borrador')
}

export function severidadEstado(estado) {
  const item = ESTADOS_EVENTO.find((e) => e.value === estado)
  return item ? item.severity : 'secondary'
}

export const ESTADOS_PAGO = [
  { label: 'Pendiente', value: 'pendiente', severity: 'danger' },
  { label: 'Abonado Parcial', value: 'parcial', severity: 'warn' },
  { label: 'Pagado', value: 'pagado', severity: 'success' },
]

export function etiquetaEstadoPago(estado) {
  const item = ESTADOS_PAGO.find((e) => e.value === estado)
  return item ? item.label : (estado || 'Pendiente')
}

export function severidadEstadoPago(estado) {
  const item = ESTADOS_PAGO.find((e) => e.value === estado)
  return item ? item.severity : 'danger'
}

export const METODOS_PAGO = [
  { label: 'Transferencia bancaria', value: 'transferencia', icon: 'pi pi-arrow-right-arrow-left' },
  { label: 'Efectivo', value: 'efectivo', icon: 'pi pi-money-bill' },
  { label: 'Otro', value: 'otro', icon: 'pi pi-credit-card' },
]

export const METODOS_COBRO = [
  { label: 'Transferencia bancaria', value: 'transferencia' },
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Tarjeta de crédito / débito', value: 'tarjeta' },
  { label: 'Otro', value: 'otro' },
]

export const AREAS_PREDEFINIDAS = [
  { nombre: 'Cocina Caliente', descripcion: 'Chefs, cocineros y preparación de platos principales' },
  { nombre: 'Meseros y Servicio', descripcion: 'Atención de mesas, pase de canapés y servicio a invitados' },
  { nombre: 'Barra y Bebidas', descripcion: 'Bartenders, coctelería y estación de bebidas' },
  { nombre: 'Montaje y Logística', descripcion: 'Armado de mesas, sillas, cubertería y desmontaje final' },
  { nombre: 'Pastelería y Postres', descripcion: 'Mesa de dulces, emplatado y postres' },
]
