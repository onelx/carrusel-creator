# Sistema de aprendizaje por feedback (estrellas)

> Estado: acordado en concepto (2026-07-14). Requisito **fundamental** del modo Copiloto.

## Objetivo

Que el copiloto aprenda de las valoraciones con estrellas: que cada vez sea más asertivo y certero en la interpretación del pedido, tanto en el texto como en las imágenes. Las estrellas son el mecanismo de evaluación y validación de lo que el copiloto genera.

## Qué significa "aprender" acá

No se reentrena el modelo (no es posible ni necesario con Claude). El aprendizaje se logra con **memoria + recuperación inteligente**: cada generación nueva se alimenta de lo que funcionó y lo que falló antes, inyectado en el contexto del agente (*in-context learning*). Bien hecho, el efecto práctico es el buscado: interpreta cada vez mejor.

## Por qué el mecanismo actual no alcanza

1. **Una sola estrella global, muda**: con 2 estrellas el sistema no sabe *qué* falló (¿texto? ¿imágenes? ¿estructura? ¿interpretación del brief?). Sin esa señal no hay nada que aprender. Es el problema central (credit assignment).
2. **Solo aprende de lo bueno**: los carruseles con 1-2 estrellas — la información más valiosa — se ignoran.
3. **Recupera siempre los mismos 2 ejemplos top globales**, sin importar si el brief nuevo se parece. Un gran ejemplo inspiracional no ayuda para un brief comercial.

## Diseño propuesto — 4 piezas

### 1. Enriquecer la señal de las estrellas

Al calificar con menos de 5, aparecen **chips de motivo** (un click, sin fricción):

- 📝 El texto no era mi tono
- 🖼 Las imágenes no encajaban
- 🧩 La estructura falló
- 🎯 No entendió lo que pedí

Más un campo opcional: "¿qué hubieras querido?".

Además, en el modo copiloto la **conversación completa es feedback gratis**: cada corrección en el chat ("más corto", "más oscuro") queda registrada como señal de preferencia.

### 2. Memoria por similitud (no "top global")

- Guardar cada brief con su **embedding** (Supabase soporta **pgvector** — sin infraestructura nueva).
- Ante un brief nuevo, recuperar los 2-3 casos **más parecidos** bien calificados como ejemplos, y también los mal calificados parecidos como **anti-ejemplos**: "en un brief similar, esto falló por X — evitalo".

### 3. Playbook destilado — el verdadero aprendizaje

Inyectar ejemplos crudos escala mal. Propuesta: **reflexión periódica** — cada N valoraciones, un agente lee el historial de ratings con sus motivos y actualiza un documento de **lecciones aprendidas** (guía de estilo personal del usuario). Ejemplos del tipo:

> "Prefiere títulos de 3-4 palabras. Rechaza imágenes con look stock. Sus mejores carruseles cierran con pregunta en vez de imperativo."

Ese playbook se inyecta en el system prompt del copiloto en **cada** conversación. El aprendizaje se acumula y generaliza, en vez de depender de encontrar el ejemplo justo.

El playbook distingue:
- **Preferencias estables**: patrones que se repiten en varias valoraciones → reglas.
- **Casos puntuales**: sucedieron una sola vez → no generalizar (evita la sobre-corrección: que un 5⭐ a algo dramático no vuelva dramático todo lo futuro).

### 4. Cerrar el ciclo en la UI

El copiloto explicita qué aprendizaje aplicó: *"Basado en tus valoraciones anteriores, evité el estilo X y usé títulos cortos"*. No es cosmético: permite **corregir el aprendizaje** cuando destiló una lección equivocada.

## Esquema de datos (a capturar desde la Etapa 1)

Cada carrusel del modo copiloto guarda desde el inicio:

| Campo | Descripción |
|---|---|
| `brief` | El pedido original del usuario |
| `conversation` | Historial completo del chat (incluye correcciones intermedias) |
| `final_json` | El JSON de slides final |
| `rating` | 1-5 estrellas |
| `rating_reasons` | Chips de motivo + texto opcional |
| `embedding` | Vector del brief (pgvector) para recuperación por similitud |

**Regla clave**: los datos que no se capturan ahora no se recuperan después. El esquema se implementa en la Etapa 1 aunque la reflexión/playbook llegue en la Etapa 3.

## Expectativas honestas

- Con **10-15 carruseles calificados** (con motivos) el cambio se nota; con **30-50** el playbook se pone fino. Con 3 valoraciones no hay magia — el sistema necesita datos.
- Riesgo a vigilar: **sobre-corrección** (mitigado por la distinción estable/puntual del playbook).
- Todo corre sobre el stack actual: Supabase + pgvector + un endpoint más. Nada exótico.
