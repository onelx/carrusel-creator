const { GoogleGenAI } = require('@google/genai')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { contentImageB64, contentMimeType, style, slideContext } = req.body
  if (!contentImageB64 || !style) {
    return res.status(400).json({ error: 'contentImageB64 and style are required' })
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    // Construir el prompt de transferencia de estilo
    const paletteStr = style.palette ? style.palette.join(', ') : ''
    const prompt = [
      `Recreate this photograph applying the following color and visual style:`,
      ``,
      `Color palette: ${paletteStr}`,
      `Mood: ${style.mood}`,
      `Lighting: ${style.lighting?.type}, ${style.lighting?.quality}, ${style.lighting?.color_temperature} color temperature`,
      `Atmosphere: ${style.atmosphere}`,
      `Color grade: ${style.color_style?.grade}, ${style.color_style?.saturation} saturation, ${style.color_style?.contrast} contrast`,
      `Shadows: ${style.color_style?.shadows} | Highlights: ${style.color_style?.highlights}`,
      ``,
      style.style_prompt || '',
      ``,
      slideContext ? `Slide context: "${slideContext}"` : '',
      ``,
      `Keep the same subject, composition and framing as the reference photo. Only transform the colors, lighting and atmosphere. Photorealistic result, high quality.`,
      `Avoid: digital artifacts, oversaturation, unnatural colors, changing the main subject.`
    ].filter(Boolean).join('\n')

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: contentMimeType || 'image/jpeg',
                data: contentImageB64
              }
            },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    })

    let imageData = null
    let mimeType = 'image/png'

    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data
        mimeType = part.inlineData.mimeType || 'image/png'
        break
      }
    }

    if (!imageData) throw new Error('Gemini no generó ninguna imagen')

    res.json({ ok: true, image: imageData, mimeType })
  } catch (err) {
    console.error('generate-styled-slide error:', err)
    res.status(500).json({ error: err.message || 'Error generando la imagen estilizada' })
  }
}
