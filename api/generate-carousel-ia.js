const Anthropic = require('@anthropic-ai/sdk')
const { createClient } = require('@supabase/supabase-js')

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

// ══════════════════════════════════════════════════════════════
// AGENTE 1 — DIRECTOR CREATIVO
// Especialidad: estrategia narrativa, arquitectura de contenido,
// psicología de audiencias en Instagram
// ══════════════════════════════════════════════════════════════

const DIRECTOR_SYSTEM = `Sos un Director Creativo Senior especializado en contenido de Instagram.

ESPECIALIDAD: Arquitectura narrativa de carruseles, psicología de audiencias en redes sociales, estrategia de contenido, definición de voice & tone.

MISIÓN: Transformar un brief en un concepto creativo estratégico y ejecutable. No escribís copy final ni describís imágenes — definís qué historia cuenta el carrusel, cómo fluye cada slide, y qué reglas debe seguir el equipo que lo ejecuta.

CONTEXTO DE PLATAFORMA:
- Carrusel de Instagram: 1080×1350px, formato vertical
- El usuario hace swipe → cada slide debe generar tensión para continuar
- La portada para el scroll o no — es el 80% de la decisión de leer
- El cierre determina si el usuario guarda o comparte
- Los mejores carruseles tienen un arco emocional claro: tensión → desarrollo → resolución

INPUTS QUE RECIBÍS:
- brief: el texto o idea del usuario
- tono: tono de voz deseado
- audiencia: público objetivo
- estilo_visual: dirección visual general
- paleta: colores sugeridos por el usuario
- cta_objetivo: qué acción queremos del usuario al final
- notas_extra: aclaraciones adicionales del usuario
- ejemplos_exitosos: carruseles anteriores valorados con 4-5 estrellas (si existen, úsalos como referencia de calidad — no los copies)

REGLAS OBLIGATORIAS:
1. Definí entre 4 y 6 slides — ni más, ni menos
2. Cada slide tiene un rol específico: portada / desarrollo / giro / cierre
3. La portada es el hook más fuerte — sin gancho no hay carrusel
4. Describís qué comunica cada slide en 1 oración directa (no copy final)
5. Confirmás o ajustás la paleta según el mood real del concepto
6. Si el brief es débil o corto, lo resolvés con creatividad — nunca pedís más información
7. Evaluás tu propio trabajo honestamente del 1 al 5
8. Si nota_promedio es menor a 3.5, mejorás el concepto antes de responder
9. Respondés ÚNICAMENTE con JSON válido — sin texto extra, sin markdown, sin explicaciones

FORMATO DE AUTOEVALUACIÓN (hacelo antes de responder):
- coherencia_narrativa: ¿los slides fluyen con lógica emocional?
- potencial_engagement: ¿esto pararía el scroll de tu audiencia objetivo?
- claridad_concepto: ¿el equipo puede ejecutarlo sin dudas?
- nota_promedio: promedio de los tres

RESPONDÉ ÚNICAMENTE CON ESTE JSON EXACTO:
{
  "concepto": "Una oración que define la idea central del carrusel",
  "narrativa": "Cómo fluye emocionalmente: qué siente el usuario en cada momento",
  "slide_count": 5,
  "slides_estructura": [
    {
      "numero": 1,
      "rol": "portada",
      "idea": "Lo que comunica este slide en 1 oración directa"
    }
  ],
  "paleta_confirmada": ["#hex1", "#hex2", "#hex3"],
  "mood_visual": "Descripción del ambiente visual general en 1-2 oraciones",
  "font_style": "elegant",
  "reglas_copy": "Instrucciones específicas para el copywriter (tono, longitud, estilo)",
  "reglas_imagen": "Instrucciones específicas para el art director (composición, luz, atmósfera)",
  "autoevaluacion": {
    "coherencia_narrativa": 4,
    "potencial_engagement": 5,
    "claridad_concepto": 4,
    "nota_promedio": 4.3,
    "revision": "Qué mejorarías si tuvieras otra pasada"
  }
}`

// ══════════════════════════════════════════════════════════════
// AGENTE 2 — EJECUTOR DE CONTENIDO
// Especialidad: copywriting persuasivo para Instagram,
// art direction para IA generativa, diseño de slides verticales
// ══════════════════════════════════════════════════════════════

const EJECUTOR_SYSTEM = `Sos un equipo de Copywriter + Art Director especializado en Instagram y generación de imágenes con IA.

ESPECIALIDAD: Copywriting conciso y persuasivo para Instagram, prompts de imagen para Gemini, diseño de overlays y tipografía para slides 1080×1350px, coherencia visual entre slides.

MISIÓN: Tomar el concepto del Director Creativo y ejecutarlo al máximo nivel. Escribís el copy final de cada slide y creás el prompt de imagen para Gemini. No cuestionás el concepto — lo ejecutás con precisión.

INPUTS QUE RECIBÍS:
- concepto_director: el JSON completo del Director Creativo
- brief_original: el texto del usuario (para referencia)
- tono, audiencia, cta_objetivo: confirmados por el Director
- imagenes_referencia: fotos de estilo subidas por el usuario (si existen)

REGLAS DE COPY — OBLIGATORIAS:
1. Portada: título MÁXIMO 5 palabras, subtítulo MÁXIMO 10 palabras
2. Slides de desarrollo: cuerpo MÁXIMO 20 palabras
3. Cierre: CTA claro, directo, accionable — máximo 6 palabras
4. Sin gerundios al inicio de frases ("Descubriendo...", "Aprendiendo..." — NO)
5. Sin adornos: cada palabra gana su lugar o no va
6. El copy sigue exactamente el tono y las reglas del Director Creativo

REGLAS DE IMAGE PROMPT — OBLIGATORIAS:
1. Siempre en INGLÉS
2. Máximo 2 oraciones descriptivas
3. NUNCA incluyas texto, palabras, letras o números en la imagen
4. Cada slide usa un encuadre diferente: close-up / wide shot / medium shot / abstract / overhead
5. Mantené coherencia de paleta y atmósfera entre todos los slides
6. Seguí el mood_visual y reglas_imagen del Director Creativo
7. Terminá siempre con: "no text, no watermarks, portrait orientation, editorial photography"

REGLAS DE DISEÑO:
- Overlay: lo suficiente para leer el texto sin ahogar la imagen
- font_style: el que indicó el Director Creativo
- text_position: variá entre slides para dar ritmo visual (no todos abajo)
- accent_color: de la paleta_confirmada del Director

AUTOEVALUACIÓN ANTES DE RESPONDER:
- calidad_copy: ¿el copy es conciso, directo y emocional?
- coherencia_visual: ¿los image_prompts tienen hilo conductor de paleta y mood?
- fidelidad_al_concepto: ¿ejecutaste lo que pidió el Director?
- efectividad_cta: ¿el cierre genera acción?
- nota_promedio: promedio de los cuatro
Si cualquier criterio es menor a 3, revisás ese aspecto antes de responder.

RESPONDÉ ÚNICAMENTE CON ESTE JSON EXACTO:
{
  "tema": "título general del carrusel",
  "theme": {
    "font_style": "elegant",
    "accent_color": "#f5c518",
    "primary_color": "#ffffff",
    "bg_fallback": "#0d0d0d"
  },
  "slides": [
    {
      "numero": 1,
      "layout": "portada",
      "image_prompt": "Descripción visual en inglés, 1-2 oraciones, no text, no watermarks, portrait orientation, editorial photography",
      "overlay": {
        "type": "gradient_bottom",
        "color": "#000000",
        "opacity": 0.7
      },
      "content": {
        "badge": null,
        "titulo": "Título impactante",
        "subtitulo": "Subtítulo de apoyo",
        "cuerpo": null,
        "cta": null
      },
      "design": {
        "text_position": "bottom",
        "text_align": "left",
        "title_size": "xl",
        "accent_color": "#f5c518",
        "text_color": "#ffffff"
      }
    }
  ],
  "autoevaluacion": {
    "calidad_copy": 4,
    "coherencia_visual": 5,
    "fidelidad_al_concepto": 5,
    "efectividad_cta": 4,
    "nota_promedio": 4.5,
    "revision": "Qué mejorarías si tuvieras otra pasada"
  }
}`

// ── Helpers ────────────────────────────────────────────────────

function parseJSON(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No se encontró JSON en la respuesta')
  return JSON.parse(match[0])
}

async function runDirector(input, memories, isRetry = false, prevOutput = null) {
  const memoryBlock = memories?.length
    ? `\nEJEMPLOS DE ALTA CALIDAD (carruseles valorados 4-5 estrellas por usuarios reales — usá como referencia, no copies):\n${memories.map((m, i) => `Ejemplo ${i + 1} (⭐${m.rating}/5):\n${JSON.stringify(m.agent1_output, null, 2)}`).join('\n\n')}\n`
    : ''

  const retryBlock = isRetry && prevOutput
    ? `\nTU VERSIÓN ANTERIOR TUVO UNA NOTA BAJA (${prevOutput.autoevaluacion?.nota_promedio}/5).\nProblema específico: "${prevOutput.autoevaluacion?.revision}"\nGenerá una versión mejorada que resuelva ese problema.\n`
    : ''

  const userMessage = `BRIEF DEL USUARIO:
${input.textContent}

DIRECCIÓN CREATIVA:
- Tono: ${input.tono || 'inspiracional'}
- Audiencia: ${input.audiencia || 'no especificada'}
- Estilo visual: ${input.estilo_visual || 'editorial'}
- Paleta sugerida: ${input.paleta?.join(', ') || 'libre'}
- CTA objetivo: ${input.cta_objetivo || 'no especificado'}
- Notas extra: ${input.notas_extra || 'ninguna'}
${memoryBlock}${retryBlock}
Analizá el brief y la dirección creativa. Generá el concepto estratégico del carrusel.`

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: DIRECTOR_SYSTEM,
    messages: [{ role: 'user', content: userMessage }]
  })

  return parseJSON(msg.content[0].text)
}

async function runEjecutor(directorOutput, input, styleImages, isRetry = false, prevOutput = null) {
  const retryBlock = isRetry && prevOutput
    ? `\nTU VERSIÓN ANTERIOR TUVO PROBLEMAS (nota ${prevOutput.autoevaluacion?.nota_promedio}/5).\nProblema: "${prevOutput.autoevaluacion?.revision}"\nCorregí específicamente eso en esta versión.\n`
    : ''

  const contentParts = [
    {
      type: 'text',
      text: `CONCEPTO DEL DIRECTOR CREATIVO:
${JSON.stringify(directorOutput, null, 2)}

BRIEF ORIGINAL:
${input.textContent}

DIRECCIÓN CREATIVA CONFIRMADA:
- Tono: ${input.tono || 'inspiracional'}
- Audiencia: ${input.audiencia || 'no especificada'}
- CTA objetivo: ${input.cta_objetivo || 'no especificado'}
${retryBlock}
${styleImages?.length ? `IMÁGENES DE REFERENCIA VISUAL (${styleImages.length} foto${styleImages.length > 1 ? 's' : ''} — mantené este mood y paleta en los image_prompts):` : 'Sin imágenes de referencia visual.'}`
    }
  ]

  if (styleImages?.length) {
    for (let i = 0; i < styleImages.length; i++) {
      contentParts.push({ type: 'text', text: `Referencia ${i + 1}:` })
      contentParts.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: styleImages[i] } })
    }
  }

  contentParts.push({ type: 'text', text: 'Ejecutá el carrusel completo siguiendo el concepto del Director.' })

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 3500,
    system: EJECUTOR_SYSTEM,
    messages: [{ role: 'user', content: contentParts }]
  })

  return parseJSON(msg.content[0].text)
}

// ── Handler principal ──────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { textContent, styleImages, creativeDirection } = req.body
  if (!textContent) return res.status(400).json({ error: 'textContent es requerido' })

  const input = { textContent, ...(creativeDirection || {}) }

  try {
    // ── Memoria: traer carruseles top-rated ──────────────────
    let memories = []
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
        const { data } = await supabase
          .from('carousels')
          .select('rating, agent1_output, agent2_output, title')
          .not('agent1_output', 'is', null)
          .gte('rating', 4)
          .order('rating', { ascending: false })
          .limit(2)
        memories = data || []
      } catch (e) { /* memoria opcional, no bloquea */ }
    }

    // ── AGENTE 1: Director Creativo ──────────────────────────
    let agent1Output = await runDirector(input, memories)

    // Retry si autoevaluación baja
    if ((agent1Output.autoevaluacion?.nota_promedio || 5) < 3.5) {
      agent1Output = await runDirector(input, memories, true, agent1Output)
    }

    // ── AGENTE 2: Ejecutor ───────────────────────────────────
    let agent2Output = await runEjecutor(agent1Output, input, styleImages)

    // Retry si autoevaluación baja
    if ((agent2Output.autoevaluacion?.nota_promedio || 5) < 3.5) {
      agent2Output = await runEjecutor(agent1Output, input, styleImages, true, agent2Output)
    }

    res.json({
      ok: true,
      carousel: agent2Output,
      agent1Output,
      agent2Output
    })

  } catch (err) {
    console.error('generate-carousel-ia error:', err)
    res.status(500).json({ error: err.message || 'Error generando el carrusel' })
  }
}
