# Spec de implementación — Etapa 1 del Copiloto

> Estado: **implementado, verificado y en producción** (2026-07-14, commit `a14f6fb`). El endpoint `/api/copilot` fue probado en producción con el agente real: con un brief completo no hace preguntas y propone directamente un esqueleto válido (6 slides, 3 portadas con enfoques distintos, interpretación completa). Pendiente menor: completar `ANTHROPIC_API_KEY` y `GEMINI_API_KEY` en el `.env` local para poder probar el agente también en desarrollo.

## Resultado de la verificación local (2026-07-14)

- ✅ Vista Copiloto: chat + preview, bienvenida, envío de mensajes, manejo de errores en burbuja.
- ✅ Tarjeta de esqueleto: concepto, narrativa, interpretación con paleta, slides, 3 portadas seleccionables, botón aprobar.
- ✅ Render del carrusel: Fondo/Editorial, toolbar tipografía, navegación, thumbnails, descarga.
- ✅ Caption + hashtags con botón copiar.
- ✅ Rating 3⭐ → chips de motivo → guardado en `rating_reasons` (verificado por SQL en Supabase).
- ✅ Guardado con `mode: 'copiloto'`, brief, conversación y caption (verificado por SQL; registro de prueba borrado).
- ⚠️ La llamada real al agente devuelve error de autenticación en local por la key vacía (el circuito completo hasta el SDK funciona).

## Alcance

La Etapa 1 según [doc 02](02-propuesta-copiloto.md), más dos quick wins del [backlog](04-backlog-ideas.md) que entran naturalmente y casi gratis:

- ✅ Vista nueva "Copiloto" con chat + preview en vivo
- ✅ Agente conversacional con tool use (pregunta poco → esqueleto → carrusel completo)
- ✅ **Variantes de portada** (backlog #1): el esqueleto incluye 3 opciones de hook para la portada, seleccionables con un click
- ✅ **Caption + hashtags** (backlog #2): el carrusel final incluye el caption listo para copiar
- ✅ Rating con **chips de motivo** (doc 03, pieza 1)
- ✅ Captura completa de datos de aprendizaje: brief, conversación, JSON final, rating, motivos
- ❌ Fuera de alcance (etapas 2-3): edición granular por chat, panel de dirección interpretada, memoria por similitud/pgvector, playbook

## Backend: `/api/copilot.js`

Endpoint nuevo, stateless (mismo patrón que los existentes).

- **Request**: `POST { messages }` — historial completo de la conversación en formato Anthropic (el cliente lo mantiene y lo manda entero en cada turno).
- **Modelo**: `claude-opus-4-5`, una llamada por turno, con `tools` definidos.
- **Herramientas** (el servidor no las "ejecuta": el `tool_use` ES el dato estructurado que se devuelve al cliente):

### Tool 1: `proponer_esqueleto`

El copiloto la usa cuando ya entendió el pedido. Schema (resumen):

```
{ concepto, narrativa, slide_count,
  slides: [{ numero, rol, idea }],
  portada_opciones: [ { titulo, subtitulo, enfoque } ×3 ],   ← variantes de hook
  interpretacion: { tono, audiencia, estilo_visual, cta_objetivo },
  paleta: [hex×3], mood_visual, font_style }
```

### Tool 2: `crear_carrusel`

El copiloto la usa cuando el usuario aprueba el esqueleto. Schema: **el mismo JSON de slides actual** (tema, theme, slides[] con layout / image_prompt / overlay / content / design) **+ `caption` + `hashtags[]`**.

- **Response**: `{ ok, reply, tool: { id, name, input } | null }`. El cliente agrega al historial el turno del assistant y un `tool_result` sintético ("mostrado al usuario" / "el usuario aprobó") para el turno siguiente.
- **Reglas del system prompt**: máximo 2-3 preguntas y solo si faltan (audiencia/objetivo/tono); si el mensaje inicial alcanza, proponer esqueleto directo; nunca generar carrusel sin esqueleto aprobado; español rioplatense; copy con las mismas reglas de concisión del Ejecutor actual; image_prompts en inglés con las reglas actuales.

## Frontend: vista `view-copilot`

Nueva entrada en la sidebar ("🤖 Copiloto"). Layout de dos columnas:

- **Izquierda — chat** (~400px): burbujas usuario/copiloto, indicador de "pensando", input + enviar. El esqueleto se renderiza como tarjeta especial dentro del chat con las 3 opciones de portada clicables (elegir una envía la elección como mensaje) y botón "✓ Aprobar y generar".
- **Derecha — preview**: placeholder al inicio; tras `crear_carrusel` el flujo es el mismo del modo IA: imágenes de Gemini en paralelo (reusa `/api/generate-slide-image`), render con los builders existentes (`buildSlideIAFondo` / `buildSlideEditorial`), conmutador Fondo/Editorial, toolbar de tipografía, navegación, descarga PNG. Debajo: tarjeta de **caption** con botón copiar, y **estrellas + chips de motivo**.

### Chips de motivo (rating < 5)

`📝 El texto no era mi tono` · `🖼 Las imágenes no encajaban` · `🧩 La estructura falló` · `🎯 No entendió lo que pedí` + campo opcional "¿qué hubieras querido?". Multi-selección, se envían con el rating.

## Persistencia (Supabase)

Migración sobre la tabla `carousels`:

```sql
alter table carousels
  add column if not exists brief text,
  add column if not exists conversation jsonb,
  add column if not exists rating_reasons jsonb,
  add column if not exists caption text;
```

(El `embedding` vector/pgvector queda para la Etapa 3 — se puede backfillear desde `brief`.)

Cambios en endpoints existentes:

- `save-carousel.js`: acepta `brief`, `conversation`, `caption` (y `mode: 'copiloto'`).
- `rate-carousel.js`: acepta `ratingReasons` (chips + texto libre).

## Routing y dev local

- `vercel.json`: agregar ruta `/api/copilot`.
- `serve.js` no requiere cambios (rutea `/api/*` dinámicamente).
- `.claude/launch.json`: corregir para levantar `node serve.js` (hoy usa `npx serve`, estático sin API).

## Criterios de verificación

1. Conversación corta ("quiero un carrusel sobre X para emprendedores, tono comercial") → esqueleto directo sin preguntas.
2. Brief vago ("algo sobre productividad") → máximo 2-3 preguntas → esqueleto.
3. Elegir variante de portada → el esqueleto se actualiza → aprobar → carrusel completo con imágenes.
4. Caption visible y copiable.
5. Rating 3⭐ → aparecen chips → se guardan en `rating_reasons`.
6. El carrusel aparece en Historial con badge de modo copiloto.
