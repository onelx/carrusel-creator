const Anthropic = require('@anthropic-ai/sdk')
const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

// ══════════════════════════════════════════════════════════════
// COPILOTO — agente conversacional único con herramientas
// Fusiona Director Creativo + Ejecutor en una conversación.
// El servidor es stateless: el cliente envía el historial completo
// y el tool_use ES el dato estructurado que se devuelve al cliente.
// ══════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Sos el Copiloto Creativo de Carrusel Creator: un director creativo senior + copywriter + art director especializado en carruseles de Instagram (1080×1350px), conversando en español rioplatense (voseo), cercano y directo.

TU MISIÓN: llevar al usuario desde una idea hasta un carrusel completo, conversando. Regla de oro: MOSTRAR RÁPIDO, PREGUNTAR POCO, ITERAR MUCHO.

FLUJO DE TRABAJO:
1. El usuario cuenta su idea.
2. Si falta información CRÍTICA (audiencia, objetivo del post, o tono), preguntá SOLO lo que falte — máximo 2-3 preguntas, todas juntas en un solo mensaje, nunca de a una. Si el mensaje inicial ya alcanza para trabajar, NO preguntes nada.
3. Usá la herramienta proponer_esqueleto para mostrar el concepto: estructura de slides + 3 opciones de portada con enfoques distintos (ej: pregunta provocadora / dato duro / afirmación polémica).
4. El usuario reacciona: ajustá el esqueleto (podés volver a llamar proponer_esqueleto con la versión corregida) o esperá su aprobación.
5. SOLO cuando el usuario aprueba el esqueleto (y eligió portada, o elegí vos la mejor si no dijo nada), usá crear_carrusel para ejecutar el carrusel completo.

REGLAS DE CONVERSACIÓN:
- Nunca uses crear_carrusel sin haber mostrado antes un esqueleto.
- Antes de llamar una herramienta, escribí 1-2 oraciones naturales presentando lo que vas a mostrar.
- Si el brief es débil, resolvelo con creatividad — preguntar más de 3 cosas está prohibido.
- Nunca respondas con JSON en el texto: los datos estructurados van SIEMPRE por herramienta.

REGLAS DE COPY (para crear_carrusel):
- Portada: título máximo 5 palabras, subtítulo máximo 10.
- Desarrollo: cuerpo máximo 20 palabras por slide.
- Cierre: CTA claro y accionable, máximo 6 palabras.
- Sin gerundios al inicio de frase. Sin adornos: cada palabra gana su lugar o no va.
- Arco narrativo: portada = hook fuerte (80% de la decisión de leer) → desarrollo con tensión → cierre que invita a guardar/compartir.

REGLAS DE IMAGE_PROMPT (para crear_carrusel):
- Siempre en INGLÉS, máximo 2 oraciones descriptivas.
- NUNCA texto, palabras, letras ni números en la imagen.
- Encuadre distinto por slide: close-up / wide shot / medium shot / abstract / overhead.
- Coherencia de paleta y atmósfera entre todos los slides.
- Terminá siempre con: "no text, no watermarks, portrait orientation, editorial photography".

REGLAS DE CAPTION (para crear_carrusel):
- Caption listo para pegar en Instagram: hook en la primera línea (es lo único visible antes del "más"), desarrollo breve, CTA final.
- 8-15 hashtags estratégicos: mezcla de nicho y alcance, sin genéricos vacíos (#love #instagood).`

const TOOLS = [
  {
    name: 'proponer_esqueleto',
    description: 'Mostrar al usuario el concepto estratégico del carrusel antes de ejecutarlo: estructura de slides y 3 opciones de portada. Usala cuando ya entendiste el pedido. Podés volver a llamarla con una versión corregida si el usuario pide cambios.',
    input_schema: {
      type: 'object',
      properties: {
        concepto: { type: 'string', description: 'La idea central del carrusel en una oración' },
        narrativa: { type: 'string', description: 'Cómo fluye emocionalmente el carrusel' },
        slide_count: { type: 'integer', minimum: 4, maximum: 7 },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              numero: { type: 'integer' },
              rol: { type: 'string', enum: ['portada', 'desarrollo', 'giro', 'cierre'] },
              idea: { type: 'string', description: 'Qué comunica este slide, en una oración directa' }
            },
            required: ['numero', 'rol', 'idea']
          }
        },
        portada_opciones: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          description: '3 opciones de hook para la portada, con enfoques bien distintos',
          items: {
            type: 'object',
            properties: {
              titulo: { type: 'string', description: 'Máximo 5 palabras' },
              subtitulo: { type: 'string', description: 'Máximo 10 palabras' },
              enfoque: { type: 'string', description: 'Ej: pregunta provocadora, dato duro, afirmación polémica' }
            },
            required: ['titulo', 'subtitulo', 'enfoque']
          }
        },
        interpretacion: {
          type: 'object',
          description: 'Cómo interpretaste el pedido — se muestra al usuario para que corrija',
          properties: {
            tono: { type: 'string' },
            audiencia: { type: 'string' },
            estilo_visual: { type: 'string' },
            cta_objetivo: { type: 'string' }
          },
          required: ['tono', 'audiencia', 'estilo_visual', 'cta_objetivo']
        },
        paleta: { type: 'array', items: { type: 'string' }, description: '3 colores hex' },
        mood_visual: { type: 'string' },
        font_style: { type: 'string', enum: ['elegant', 'modern', 'bold'] }
      },
      required: ['concepto', 'narrativa', 'slide_count', 'slides', 'portada_opciones', 'interpretacion', 'paleta', 'mood_visual', 'font_style']
    }
  },
  {
    name: 'crear_carrusel',
    description: 'Ejecutar el carrusel completo (copy final + prompts de imagen + diseño + caption). Usala SOLO después de que el usuario aprobó un esqueleto.',
    input_schema: {
      type: 'object',
      properties: {
        tema: { type: 'string' },
        theme: {
          type: 'object',
          properties: {
            font_style: { type: 'string', enum: ['elegant', 'modern', 'bold'] },
            accent_color: { type: 'string' },
            primary_color: { type: 'string' },
            bg_fallback: { type: 'string' }
          },
          required: ['font_style', 'accent_color', 'primary_color', 'bg_fallback']
        },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              numero: { type: 'integer' },
              layout: { type: 'string', enum: ['portada', 'contenido', 'cita', 'datos', 'cierre'] },
              image_prompt: { type: 'string' },
              overlay: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['gradient_bottom', 'gradient_top', 'gradient_center', 'full', 'none'] },
                  color: { type: 'string' },
                  opacity: { type: 'number' }
                },
                required: ['type', 'color', 'opacity']
              },
              content: {
                type: 'object',
                properties: {
                  badge: { type: ['string', 'null'] },
                  titulo: { type: ['string', 'null'] },
                  subtitulo: { type: ['string', 'null'] },
                  cuerpo: { type: ['string', 'null'] },
                  cta: { type: ['string', 'null'] }
                },
                required: ['badge', 'titulo', 'subtitulo', 'cuerpo', 'cta']
              },
              design: {
                type: 'object',
                properties: {
                  text_position: { type: 'string', enum: ['top', 'middle', 'bottom'] },
                  text_align: { type: 'string', enum: ['left', 'center', 'right'] },
                  title_size: { type: 'string', enum: ['xl', 'lg', 'md'] },
                  accent_color: { type: 'string' },
                  text_color: { type: 'string' }
                },
                required: ['text_position', 'text_align', 'title_size', 'accent_color', 'text_color']
              }
            },
            required: ['numero', 'layout', 'image_prompt', 'overlay', 'content', 'design']
          }
        },
        caption: { type: 'string', description: 'Caption completo listo para Instagram (sin hashtags)' },
        hashtags: { type: 'array', items: { type: 'string' }, description: '8-15 hashtags sin #' }
      },
      required: ['tema', 'theme', 'slides', 'caption', 'hashtags']
    }
  }
]

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'messages es requerido' })

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    })

    const reply = msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
    const toolBlock = msg.content.find(b => b.type === 'tool_use')

    res.json({
      ok: true,
      reply,
      tool: toolBlock ? { id: toolBlock.id, name: toolBlock.name, input: toolBlock.input } : null,
      // El cliente necesita los bloques crudos para reconstruir el historial
      assistantContent: msg.content
    })
  } catch (err) {
    console.error('copilot error:', err)
    res.status(500).json({ error: err?.message || 'Error en el copiloto' })
  }
}
