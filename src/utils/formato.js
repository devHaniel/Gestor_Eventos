export const MONEDA_LOCALE = 'es-HN'
export const MONEDA_CODIGO = 'HNL'

const formateadorMoneda = new Intl.NumberFormat(MONEDA_LOCALE, {
  style: 'currency',
  currency: MONEDA_CODIGO,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatearMoneda(monto) {
  if (monto === null || monto === undefined || isNaN(Number(monto))) {
    return formateadorMoneda.format(0)
  }
  return formateadorMoneda.format(Number(monto))
}

export function formatearFecha(fecha) {
  if (!fecha) return '-'
  
  // Si viene en formato YYYY-MM-DD
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const [año, mes, dia] = fecha.slice(0, 10).split('-')
    return `${dia}/${mes}/${año}`
  }

  const d = new Date(fecha)
  if (isNaN(d.getTime())) return '-'
  
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const año = d.getFullYear()
  return `${dia}/${mes}/${año}`
}

export function formatearHora(hora) {
  if (!hora) return '-'
  return hora.slice(0, 5)
}

export function formatearFechaParaInput(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    return fecha.slice(0, 10)
  }
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}
