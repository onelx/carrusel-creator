const Anthropic = require('@anthropic-ai/sdk')
const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres un experto en dirección de fotografía y color grading.

Analizarás una imagen de referencia y extraerás un JSON detallado con su estilo visual para aplicarlo a otras imágenes.

Responde ÚNICAMENTE con un JSON válido, sin markdown, sin texto extra. Estructura exacta:

{
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "mood": "descripción del mood emocional en 5-8 palabras",
  "lighting": {
    "type": "natural | artificial | mixed | golden_hour | overcast | studio",
    "direction": "overhead | side | backlit | front | diffused",
    "quality": "hard | soft | diffused | dramatic",
    "color_temperature": "warm | cool | neutral | golden | blue_hour"
  },
  "atmosphere": "descripción de la atmósfera en 8-12 palabras",
  "color_style": {
    "saturation": "desaturated | low | medium | high | vivid",
    "contrast": "low | medium | high | cinematic",
    "shadows": "dark | lifted | crushed | teal | warm",
    "highlights": "blown | preserved | golden | cool | neutral",
    "grade": "cinematic | editorial | documentary | fashion | moody | vibrant | minimal"
  },
  "style_prompt": "instrucción directa para Gemini de máximo 40 palabras describiendo cómo aplicar este estilo a cualquier imagen"
}`

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { imageB64, mimeType } = req.body
  if (!imageB64) return res.status(400).json({ error: 'imageB64 is required' })

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType || 'image/jpeg',
              data: imageB64
            }
          },
          {
            type: 'text',
            text: 'Analiza esta imagen de referencia y extrae su estilo visual completo en JSON.'
          }
        ]
      }]
    })

    const raw = message.content[0].text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No se pudo extraer el JSON de estilo')
    const style = JSON.parse(jsonMatch[0])

    res.json({ ok: true, style })
  } catch (err) {
    console.error('analyze-style error:', err)
    res.status(500).json({ error: err.message || 'Error analizando la imagen' })
  }
}
