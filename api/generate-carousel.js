const Anthropic = require('@anthropic-ai/sdk')
const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres un director creativo especializado en carruseles de Instagram.

Recibirás:
1. Un texto (brief, artículo, idea o reflexión)
2. Entre 5 y 15 fotografías de referencia numeradas como Imagen 0, Imagen 1, etc.

Tu tarea:
1. Analizar el texto y extraer entre 4 y 7 ideas clave, una por slide
2. Para cada slide: escribir el copy y elegir la imagen más adecuada visualmente
3. Definir el diseño de cada slide (overlay, tipografía, posición del texto)

REGLAS IMPORTANTES:
- El slide 1 es siempre la PORTADA — el hook, lo que engancha
- El último slide es siempre el CIERRE — reflexión final o llamada a la acción
- Cada imagen puede usarse solo UNA vez (si hay menos imágenes que slides, reutiliza solo las necesarias)
- El copy debe ser CONCISO para Instagram: títulos de máximo 6 palabras, subtítulos de máximo 12 palabras, cuerpo de máximo 25 palabras
- Elegí la imagen analizando: composición, mood, colores, y relevancia visual para la idea del slide
- El diseño debe ser cohesivo en todo el carrusel

Responde ÚNICAMENTE con un JSON válido, sin markdown, sin texto extra. Estructura exacta:

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
      "image_index": 0,
      "overlay": {
        "type": "gradient_bottom",
        "color": "#000000",
        "opacity": 0.7
      },
      "content": {
        "badge": "opcional — ej: CAPÍTULO 1 o null",
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
  ]
}

Layouts disponibles: "portada", "contenido", "cita", "datos", "cierre"
Overlay types: "gradient_bottom", "gradient_top", "gradient_center", "full", "none"
text_position: "top", "middle", "bottom"
text_align: "left", "center", "right"
title_size: "xl", "lg", "md"
font_style: "elegant" (Playfair+Inter), "modern" (Inter bold), "bold" (impacto fuerte)`

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { textContent, images } = req.body
  if (!textContent || !images?.length) {
    return res.status(400).json({ error: 'textContent and images are required' })
  }

  try {
    // Build the message content: text first, then labeled images
    const content = [
      {
        type: 'text',
        text: `TEXTO DEL BRIEF:\n\n${textContent}\n\nIMÁGENES DE REFERENCIA (${images.length} fotos):`
      }
    ]

    for (let i = 0; i < images.length; i++) {
      content.push({ type: 'text', text: `Imagen ${i}:` })
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: images[i] }
      })
    }

    content.push({
      type: 'text',
      text: 'Ahora analiza el texto y las imágenes y genera el JSON del carrusel de Instagram.'
    })

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }]
    })

    const raw = message.content[0].text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No se pudo extraer el JSON de la respuesta')
    const carousel = JSON.parse(jsonMatch[0])

    res.json({ ok: true, carousel })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Error generando el carrusel' })
  }
}
