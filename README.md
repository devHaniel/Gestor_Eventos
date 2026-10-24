<div align="center">
  <img src="docs/banner.svg" alt="Gestor de Eventos" width="100%" />
</div>

<h1 align="center">Gestor de Eventos</h1>

<p align="center">
  Plataforma web para administrar eventos de catering: áreas operativas, asignación de personal,
  pagos al equipo y rentabilidad de cada evento.
</p>

<p align="center">
  <a href="https://github.com/devHaniel/Gestor_Eventos/actions/workflows/ci.yml">
    <img src="https://github.com/devHaniel/Gestor_Eventos/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/Vue-3.5-42B883?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PrimeVue-5-10B981?style=flat-square" alt="PrimeVue" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="Licencia MIT" />
</p>

---

## Descripción general

**Gestor de Eventos** centraliza la operación de una empresa de catering. Permite planificar cada
evento, definir sus áreas de servicio, asignar personal, registrar pagos y gastos, y conocer en todo
momento la ganancia neta del negocio.

La aplicación está construida como una SPA con **Vue 3** y **Vite**. **Supabase** se encarga de la
autenticación y la persistencia, mientras que los cálculos financieros (costos por persona, saldos
pendientes y utilidad) se resuelven mediante **vistas SQL**, evitando duplicar reglas de negocio en
el frontend.

## Características

### Eventos

- Alta, edición y eliminación de eventos con cliente, lugar, fecha, horario, invitados e ingreso
  pactado.
- Ciclo de vida con estados: `borrador`, `confirmado`, `en_curso`, `finalizado` y `cancelado`.
- Dashboard con eventos en curso, próximos eventos, personal pendiente de pago y ganancia neta del
  mes.
- Búsqueda, filtros y paginación en el listado de eventos.

### Áreas y personal

- Catálogo de áreas operativas (cocina caliente, meseros, barra, montaje, pastelería, etc.).
- Activación de áreas por evento con dos modalidades de pago:
  - **Individual:** monto fijo por persona u horas × tarifa.
  - **Por área:** reparto de un monto global de forma equitativa o por horas trabajadas.
- Asignación de personal con rol, horas y tarifa, controlando duplicados por área.
- Catálogo de personal con tarifa base, estado activo/inactivo e histórico de ingresos.

### Pagos y finanzas

- Registro de pagos por asignación con método, referencia y fecha.
- Liquidación global del evento o por área con un solo clic.
- Cobros del cliente y gastos operativos con CRUD completo.
- Resumen financiero por evento y por persona: costo, pagado, pendiente y ganancia neta.
- Cálculo automático del estado de pago: `pendiente`, `parcial` o `pagado`.

### Experiencia y seguridad

- Interfaz responsive con sidebar y navegación protegida.
- Validaciones, confirmaciones antes de eliminar y notificaciones claras de error.
- Autenticación con Supabase y sesión persistente.
- Formato de moneda `HNL` y fechas `dd/mm/yyyy`.

## Stack tecnológico

| Capa            | Tecnología                                                       |
| --------------- | ---------------------------------------------------------------- |
| UI              | Vue 3 (Composition API, `<script setup>`)                        |
| Build           | Vite 8                                                           |
| Componentes     | PrimeVue 5 + PrimeIcons                                          |
| Estilos         | Tailwind CSS 4                                                   |
| Enrutamiento    | Vue Router 5                                                     |
| Backend / Auth  | Supabase (PostgreSQL, Auth y API REST)                           |
| Estado          | Composables (`src/composables`)                                  |
| Calidad         | Prettier + `vue-tsc` para verificación de tipos                 |

## Puesta en marcha

### Requisitos

- **Node.js** `^22.18.0` o `>=24.12.0`
- **npm** 10 o superior
- Un proyecto de **Supabase** con el [esquema de datos](docs/base-de-datos.md)

### 1. Clonar el repositorio

```bash
git clone https://github.com/devHaniel/Gestor_Eventos.git
cd Gestor_Eventos
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y completa los valores de tu proyecto de Supabase:

```bash
cp .env.example .env
```

| Variable                | Descripción                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`     | URL base del proyecto (`https://<project-ref>.supabase.co`)        |
| `VITE_SUPABASE_ANON_KEY`| Clave pública `anon` / `publishable` del proyecto                  |

> Usa únicamente la clave pública. La clave `service_role` nunca debe incluirse en el frontend.

### 4. Preparar la base de datos

Crea las tablas y vistas descritas en **[docs/base-de-datos.md](docs/base-de-datos.md)** y activa
Row Level Security. La aplicación consume las vistas `v_resumen_evento`, `v_resumen_areas`,
`v_resumen_personal` y `v_pagos_asignacion` para todos los importes calculados.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`. Crea el usuario administrador desde la
pantalla de registro o desde el panel de Supabase Auth.

## Scripts disponibles

| Comando             | Descripción                                                   |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga en caliente.                |
| `npm run build`     | Compila la aplicación para producción en `dist/`.              |
| `npm run preview`   | Sirve localmente la compilación de producción.                 |
| `npm run typecheck` | Verifica los tipos de los componentes con `vue-tsc`.           |
| `npm run format`    | Formatea el código de `src/` con Prettier.                     |

## Estructura del proyecto

```text
.
├── .github/workflows/ci.yml   # Integración continua (build + typecheck)
├── docs/                      # Documentación y recursos
├── public/                    # Archivos estáticos
├── src/
│   ├── assets/                # Estilos globales y recursos
│   ├── components/            # Componentes reutilizables
│   ├── composables/           # Acceso a datos y lógica de negocio
│   ├── lib/                   # Cliente de Supabase
│   ├── router/                # Rutas y guardas de autenticación
│   ├── utils/                 # Formatos, estados y catálogos
│   ├── views/                 # Pantallas de la aplicación
│   ├── App.vue
│   └── main.js
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

### Arquitectura

- **`views/`** compone las pantallas y coordina la interacción del usuario.
- **`composables/`** encapsula las consultas a Supabase y expone estado reactivo
  (`cargando`, `error`, listas y acciones).
- **`lib/supabase.js`** crea el cliente único y normaliza la URL del proyecto.
- **Vistas SQL** concentran los cálculos financieros; el frontend solo los consume.

## Despliegue

1. Genera el bundle de producción:

   ```bash
   npm run build
   ```

2. Publica el contenido de `dist/` en tu proveedor (Vercel, Netlify, Cloudflare Pages, etc.).
3. Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel del proveedor **antes** de
   compilar.
4. Configura una reescritura SPA hacia `index.html` para que las rutas de Vue Router funcionen al
   recargar la página.

El repositorio incluye `vercel.json` con esa reescritura configurada. Para Netlify, crea
`public/_redirects` con:

```text
/*  /index.html  200
```

## Documentación

- [Modelo de datos y reglas de negocio](docs/base-de-datos.md)
- [Historial de cambios](CHANGELOG.md)

## Autor

**devHaniel** · [github.com/devHaniel](https://github.com/devHaniel)

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta [LICENSE](LICENSE) para más detalles.
