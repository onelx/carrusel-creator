# Documentación — Carrusel Creator

Documentación viva del proyecto. Se actualiza a medida que se toman decisiones.

## Índice

1. [Análisis del sistema actual](01-analisis-sistema-actual.md) — arquitectura, agentes, arnés, orquestación y pantallas existentes.
2. [Propuesta: modo Copiloto (v3)](02-propuesta-copiloto.md) — el tercer modo conversacional: diseño, flujo, arquitectura técnica y etapas.
3. [Sistema de aprendizaje por feedback](03-sistema-aprendizaje-feedback.md) — cómo el copiloto aprende de las valoraciones con estrellas.
4. [Backlog de ideas](04-backlog-ideas.md) — propuestas para la herramienta perfecta (variantes de portada, caption, brand kit, preview realista, métricas reales), pendientes de validación.
5. [Spec Etapa 1 del Copiloto](05-spec-etapa1-copiloto.md) — especificación técnica en implementación: endpoint, herramientas, UI, migración y criterios de verificación.

## Estado de decisiones

| Fecha | Decisión | Estado |
|---|---|---|
| 2026-07-14 | Crear un tercer modo "Copiloto" (chat conversacional) para comparar contra "Desde fotos" y "Con IA" | ✅ Acordado |
| 2026-07-14 | Filosofía del copiloto: "mostrar rápido, preguntar poco, iterar mucho" (máx. 2-3 preguntas antes de proponer) | ✅ Acordado |
| 2026-07-14 | El aprendizaje por estrellas es requisito fundamental del copiloto | ✅ Acordado |
| 2026-07-14 | Capturar el esquema de datos de feedback completo desde la Etapa 1 (brief, conversación, JSON, rating, motivos, embedding) | ✅ Acordado |
| 2026-07-14 | Mantener los modos "Desde fotos" y "Con IA" en paralelo durante el experimento de comparación | ✅ Acordado |
| 2026-07-14 | En el copiloto: sin formulario previo de dirección creativa — panel post-generación de "dirección interpretada" con chips editables (las correcciones alimentan el aprendizaje) | ✅ Acordado |
| 2026-07-14 | "Con IA" (v2) conserva su formulario previo para poder comparar formulario-antes vs interpretación-después | ✅ Acordado |
| 2026-07-14 | Etapa 1 del Copiloto implementada y verificada en local (ver [spec](05-spec-etapa1-copiloto.md)) | ✅ Hecho |
| 2026-07-14 | Migración Supabase aplicada: modo `copiloto` + columnas `brief`, `conversation`, `rating_reasons`, `caption` | ✅ Hecho |
| — | Completar `ANTHROPIC_API_KEY` y `GEMINI_API_KEY` en el `.env` local (hoy vacías; en Vercel ya están) y probar el agente real | ⏳ Pendiente (Osvaldo) |
| 2026-07-14 | Deploy a producción (commit `a14f6fb`) — endpoint `/api/copilot` verificado con el agente real: esqueleto de 6 slides, 3 portadas, interpretación completa | ✅ Hecho |
| 2026-07-14 | Quick wins incluidos en la Etapa 1: variantes de portada y caption+hashtags (backlog #1 y #2) | ✅ Acordado |
