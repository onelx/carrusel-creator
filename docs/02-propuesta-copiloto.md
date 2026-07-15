# Propuesta: modo Copiloto (v3)

> Estado: acordado en concepto (2026-07-14). Implementación pendiente de arranque.

## Idea

Un tercer modo de creación, conversacional: un copiloto tipo chat que guía al usuario con preguntas y construye el carrusel de forma iterativa. Convive con "Desde fotos" y "Con IA" para poder **comparar los tres modos** con el mismo sistema de valoración por estrellas.

## Principio de diseño

> **Mostrar rápido, preguntar poco, iterar mucho.**

Riesgo a evitar: si el chat hace 10 preguntas antes de mostrar algo, es un formulario disfrazado — más lento que lo actual. El copiloto pregunta como máximo 2-3 cosas (solo las que cambian el resultado: audiencia, objetivo, tono) y si el mensaje inicial ya trae esa información, no pregunta nada.

## Flujo de usuario

1. **Arranque mínimo**: el usuario escribe su idea en el chat.
2. **Preguntas (máx. 2-3)**: solo las imprescindibles y no respondidas ya.
3. **Propuesta temprana y barata**: antes de generar imágenes, el copiloto muestra el **esqueleto**: concepto, título de portada y una línea por slide. Tarda segundos y cuesta centavos. Acá se negocia la estructura ("el slide 3 no me gusta", "quiero un giro más dramático", "5 slides en vez de 6").
4. **Generación**: al aprobar el esqueleto, se escriben los copies finales y Gemini genera las imágenes. El carrusel aparece en un **panel de preview en vivo al lado del chat** (chat a la izquierda, carrusel a la derecha).
5. **Edición conversacional granular** (la diferencia clave con los modos actuales): se le habla al carrusel generado — "el título del 2 más corto", "la portada más oscura", "cambiá el CTA" — y el copiloto edita **solo ese slide**, sin regenerar todo.
6. **Valoración**: estrellas + motivos (ver [doc 03](03-sistema-aprendizaje-feedback.md)).

## Arquitectura técnica

### 1. Un solo agente con herramientas (no otro pipeline)

El copiloto es un Claude conversacional con **tool use**: `proponer_estructura`, `escribir_slides`, `editar_slide`, `generar_imagen`. El agente decide cuándo preguntar, proponer o ejecutar — Director y Ejecutor se funden en una conversación.

Bonus: tool use da JSON estructurado garantizado y elimina el parseo con regex actual (frágil).

### 2. Endpoint nuevo, estado en el cliente

- `/api/copilot`: recibe el historial completo de la conversación en cada llamada. Servidor stateless (igual que los endpoints actuales, encaja con Vercel serverless).
- El frontend mantiene la conversación y el estado del carrusel.

### 3. Reusar todo lo que ya funciona

El copiloto produce el **mismo JSON de slides** existente. Por lo tanto se reusan sin cambios:

- Render de slides (modos Fondo / Editorial)
- Controles de tipografía en px
- Descarga PNG (html2canvas)
- Guardado en Supabase e Historial

Solo se agrega `mode: 'copiloto'` al guardar. Como el Historial ya registra modo y rating, **la comparación entre los tres modos sale gratis**: mismo brief en los tres, calificar, y el historial muestra cuál funciona mejor.

## Dirección creativa: de formulario previo a panel post-generación

> Acordado 2026-07-14. Reemplaza (en el copiloto) al formulario previo del modo "Con IA".

**Fundamento**: el usuario no sabe qué tono/estilo quiere en abstracto — lo reconoce cuando lo ve. Elegir "dramático vs editorial" antes de ver nada es fricción sin puntería; reaccionar sobre algo creado es fácil y preciso.

**Diseño — panel de "Dirección creativa interpretada"**:

- En el copiloto **no hay formulario previo**: solo el brief en el chat.
- Tras la primera versión, junto al carrusel aparece un panel **pre-llenado con lo que el copiloto decidió**: tono, estilo visual, paleta, CTA, audiencia — cada valor como chip editable.
- No pregunta qué querés: **muestra cómo te interpretó y deja corregirlo**. Cambiar un chip regenera solo lo afectado.
- Regla anti-ruido: no apilar formulario previo + panel posterior + chat. El panel *reemplaza* al formulario; el chat queda para ajustes de slide individual.

**Conexión con el aprendizaje** (ver [doc 03](03-sistema-aprendizaje-feedback.md)): cada corrección de chip es feedback estructurado gratis sobre la *interpretación* ("interpretó inspiracional, quería comercial") — señal que las estrellas solas no capturan. Alimenta el playbook.

**Costo por tipo de cambio** (la UI debe ser honesta con esto):

| Cambio | Qué regenera | Costo/tiempo | Comportamiento UI |
|---|---|---|---|
| Tono, CTA, copy | Solo texto (Claude) | Segundos, centavos | Se aplica al instante |
| Paleta, estilo visual | Overlays/diseño; a veces imágenes (Gemini) | Más lento y caro | Aviso antes de regenerar |
| Audiencia | Concepto entero | La más cara | Confirmación explícita |

**Modo "Con IA" (v2)**: se deja como está, con su formulario previo. Es parte del experimento de comparación (formulario-antes vs interpretación-después, medido con estrellas). No tocar las dos variables a la vez.

## Etapas de implementación

| Etapa | Contenido | Nota |
|---|---|---|
| **1 — El corazón** | Vista nueva con chat + preview en vivo; agente conversacional que pregunta poco, propone esqueleto y genera el carrusel completo. **Incluye desde el día uno el esquema de datos de feedback completo** (brief, conversación, JSON final, rating, motivos, embedding). | Ya permite comparar contra los otros dos modos. |
| **2 — La magia** | Edición granular por chat (copy, diseño o imagen de un slide individual) + **panel de dirección creativa interpretada** con chips editables. | |
| **3 — El aprendizaje** | Memoria por similitud + playbook destilado (ver doc 03). | Los datos ya se capturan desde la Etapa 1. |

## Decisión sobre los modos existentes

No se descartan por ahora. "Desde fotos" resuelve algo que el copiloto no (usar fotos reales del usuario), y tener los tres en paralelo con las estrellas es exactamente el experimento de comparación buscado.
