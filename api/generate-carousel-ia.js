const Anthropic = require('@anthropic-ai/sdk')
const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres un director creativo especializado en carruseles de Instagram.

Recibirás:
1. Un texto (brief, artículo, idea o reflexión)
2. Entre 1 y 2 fotografías de referencia visual — para entender el mood, paleta y estética del proyecto

Tu tarea:
1. Analizar el texto y extraer entre 4 y 6 ideas clave, una por slide
2. Para cada slide: escribir el copy y crear un prompt de imagen en inglés para Gemini Image Generation
3. Definir el diseño de cada slide (overlay, tipografía, posición del texto)

REGLAS IMPORTANTES:
- El slide 1 es siempre la PORTADA — el hook, lo que engancha
- El último slide es siempre el CIERRE — reflexión final o llamada a la acción
- El copy debe ser CONCISO para Instagram: títulos máximo 6 palabras, subtítulos máximo 12 palabras, cuerpo máximo 25 palabras
- Los image_prompt deben estar en INGLÉS, ser muy descriptivos y visuales (1-2 oraciones)
- Los image_prompt deben mantener coherencia visual con las fotos de referencia (misma paleta de color, ambiente, estética, estilo fotográfico)
- NUNCA incluyas texto o palabras dentro del image_prompt — solo descripción visual
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
      "image_prompt": "Cinematic golden hour light through forest canopy, warm amber and green tones, soft bokeh, editorial photography, no text",
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
  ]
}

Layouts disponibles: "portada", "contenido", "cita", "datos", "cierre"
Overlay types: "gradient_bottom", "gradient_top", "gradient_center", "full", "none"
text_position: "top", "middle", "bottom"
text_align: "left", "center", "right"
title_size: "xl", "lg", "md"
font_style: "elegant" (Playfair+Inter), "modern" (Inter bold), "bold" (Oswald)`

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { textContent, styleImages } = req.body
  if (!textContent) return res.status(400).json({ error: 'textContent is required' })

  try {
    const content = [
      { type: 'text', text: `TEXTO DEL BRIEF:\n\n${textContent}` }
    ]

    if (styleImages?.length) {
      content.push({ type: 'text', text: `\nIMÁGENES DE REFERENCIA VISUAL (${styleImages.length} foto${styleImages.length > 1 ? 's' : ''}):` })
      for (let i = 0; i < styleImages.length; i++) {
        content.push({ type: 'text', text: `Referencia ${i + 1}:` })
        content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: styleImages[i] } })
      }
    }

    content.push({
      type: 'text',
      text: 'Analiza el texto y las imágenes de referencia, y genera el JSON del carrusel con image_prompt en inglés para cada slide.'
    })

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
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
