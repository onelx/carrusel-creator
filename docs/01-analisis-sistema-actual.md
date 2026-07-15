# Análisis del sistema actual

> Análisis realizado el 2026-07-14 sobre el código en `main`.

## Objetivo del producto

Crear carruseles de Instagram (1080×1350 px) muy creativos: persuasivos, descriptivos, con buena imagen y buen texto.

## Resumen de arquitectura

```
Frontend (index.html — SPA vanilla JS, sin framework, ~2.400 líneas)
   │
   ├── /api/generate-carousel      → Claude Opus 4.5 (modo "Desde fotos", agente único)
   ├── /api/generate-carousel-ia   → Pipeline Director + Ejecutor (modo "Con IA")
   ├── /api/analyze-style          → Claude Opus 4.5 (extrae estilo visual de una foto de referencia)
   ├── /api/generate-slide-image   → Gemini 3.1 Flash Image (genera imagen desde prompt)
   ├── /api/generate-styled-slide  → Gemini 2.0 Flash (transferencia de estilo/color a fotos propias)
   └── /api/save|upload|confirm|rate|list|get-carousel → Supabase (DB + Storage)
```

- **Hosting**: Vercel (funciones serverless Node + HTML estático). Dev local con `serve.js` (puerto 5175).
- **Persistencia**: Supabase — tabla `carousels` (título, modo, tema, slides, outputs de agentes, rating) y bucket `carousel-slides`.
- **Exportación**: PNG 1080×1350 generados en el navegador con html2canvas.

## ¿Tiene agentes? Sí — dos agentes LLM (modo "Con IA")

En `api/generate-carousel-ia.js`:

1. **Agente 1 — Director Creativo** (Claude Opus 4.5): recibe brief + dirección creativa y produce el concepto estratégico: narrativa, 4-6 slides con rol (portada/desarrollo/giro/cierre), paleta confirmada, mood visual y reglas para el equipo ejecutor. No escribe copy final.
2. **Agente 2 — Ejecutor** (Claude Sonnet 4.5): "Copywriter + Art Director". Toma el JSON del Director y ejecuta: copy final por slide, prompt de imagen en inglés para Gemini, overlay, tipografía y posición del texto.

## ¿Tiene arnés (harness)? Sí, uno simple

- **Autoevaluación obligatoria**: cada agente se califica (coherencia, engagement, calidad de copy, etc.) y devuelve `nota_promedio` + nota de `revision`.
- **Retry automático**: si la nota < 3.5, se vuelve a llamar al mismo agente con su versión anterior y el problema detectado.
- **Memoria de largo plazo (embrionaria)**: antes de llamar al Director se traen de Supabase hasta 2 carruseles con rating ≥ 4 como "ejemplos de alta calidad".

## ¿Tiene arquitecto? No como agente separado

El rol lo cumple conceptualmente el Director Creativo.

## ¿Tiene orquestador? Sí, pero determinístico (código, no LLM)

- **Backend**: el handler de `generate-carousel-ia.js` ejecuta el pipeline secuencial: memoria → Director → (retry) → Ejecutor → (retry) → respuesta.
- **Frontend**: `generateIA()` en `index.html` orquesta la fase visual: llama al pipeline y luego dispara en paralelo una llamada a Gemini por cada slide.

## Pantallas actuales

### 1. "Desde fotos" 📷

El usuario aporta las fotos; Claude arma el carrusel.

- **Inputs**: texto (.txt/.md o textarea), 5-15 fotos propias, referencia de color opcional.
- **Flujo**: Claude extrae 4-7 ideas, elige qué foto encaja en cada slide y define diseño. Si hay referencia de color: Claude extrae paleta/iluminación/grading y Gemini re-procesa todas las fotos con ese look.
- **Resultado**: visor con navegación, control numérico de tipografía (título/subtítulo/cuerpo en px), descarga PNG por slide o todos, guardado automático en historial.

### 2. "Con IA" ✨

Los agentes crean todo, incluidas las imágenes (no se necesitan fotos).

- **Inputs**: brief (obligatorio) + dirección creativa opcional (tono, audiencia, estilo visual, paleta de 3 colores, CTA, notas) + 1-2 fotos de referencia visual + estilo de slide (Fondo / Editorial).
- **Flujo**: pipeline Director → Ejecutor → Gemini genera una imagen original por slide en paralelo.
- **Resultado**: visor con conmutador Fondo/Editorial (sin regenerar), tarjetas de autoevaluación de cada agente, valoración del usuario 1-5 estrellas (alimenta la memoria), descarga y guardado automático.

### 3. "Historial" 🗂

Grid de carruseles guardados (miniatura, título, slides, fecha, modo, rating). Visor para recorrer y volver a descargar. Guardado automático al generar.

## Limitaciones detectadas (motivación de la v3)

1. **Generación one-shot**: formulario → botón → resultado. Si no convence, la única opción es empezar de cero. No hay iteración ni corrección de rumbo.
2. **Sin edición granular**: no se puede modificar un slide individual (copy, diseño o imagen) sin regenerar todo.
3. **Parseo frágil**: los agentes devuelven JSON extraído con regex del texto libre (sin tool use / salida estructurada).
4. **Aprendizaje muy débil**: una sola estrella global, sin motivo; solo se usan los 2 mejores ejemplos globales (sin similitud con el brief actual); lo mal calificado se ignora. Ver [doc 03](03-sistema-aprendizaje-feedback.md).
