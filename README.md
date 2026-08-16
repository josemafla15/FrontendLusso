# Lusso Panel

Dashboard interno de Lusso Travel para asesores. Next.js 15 (App Router) + TypeScript + Tailwind CSS v4.

## Requisitos

- Node 18+
- Backend Django corriendo (por defecto en `http://127.0.0.1:8000/api`)

## Setup

```bash
npm install
cp .env.example .env.local   # ajusta NEXT_PUBLIC_API_URL si hace falta
npm run dev
```

Abre http://localhost:3000 — te redirige a `/login`.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base del backend Django (local: `http://127.0.0.1:8000/api`, producción: la URL de Railway + `/api`) |

## Arquitectura de auth

Los tokens JWT **nunca** tocan el navegador (ni localStorage ni cookies legibles por JS):

- `POST /api/auth/login` (route handler) hace el login contra Django server-side y guarda `access` + `refresh` en cookies **httpOnly** (`lusso_access` 30 min, `lusso_refresh` 7 días).
- `/api/proxy/[...path]` reenvía cualquier petición al backend adjuntando `Authorization: Bearer` desde la cookie. Si el backend responde 401, intenta el refresh automáticamente, reintenta la petición y rota las cookies; si el refresh falla, limpia las cookies y responde 401 (el cliente redirige a `/login`).
- `src/middleware.ts` protege todas las rutas salvo `/login` (y bloquea `/api/proxy` sin sesión).
- `POST /api/auth/logout` limpia las cookies.

En el cliente todo pasa por `src/lib/api.ts` → `api("leads?estado=nuevo")`, `api("leads/{id}", { method: "PATCH", ... })`.

## Estructura

```
src/
  app/
    login/              # página de login
    (panel)/            # layout con sidebar + header
      leads/            # tabla de leads (filtros, búsqueda, paginación)
      leads/[id]/       # ficha del lead + conversación estilo chat
      cotizaciones/     # placeholder
      pagos/            # placeholder
    api/auth/login/     # login server-side → cookies httpOnly
    api/auth/logout/
    api/proxy/[...path] # proxy al backend con refresh automático
  components/           # PanelShell (sidebar/header), badges de estado y origen
  lib/                  # api client, tipos, formato, helpers de cookies
  middleware.ts
```

## Marca

- Charcoal `#212222` · Sage `#e3e6af` · Steel Blue `#a9bdd5` · Cream `#fff6f4` (definidos en `globals.css` como theme de Tailwind: `bg-charcoal`, `text-sage`, etc.)
- Títulos: Cormorant Garamond (`font-display`) · Cuerpo: Source Sans 3 (default)
