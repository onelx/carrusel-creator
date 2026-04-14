const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id is required' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    const { data: carousel, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!carousel) return res.status(404).json({ error: 'Carrusel no encontrado' })

    // Construir URL público correcto a partir de un path relativo
    const makePublicUrl = (path) =>
      `${process.env.SUPABASE_URL}/storage/v1/object/public/carousel-slides/${path}`

    // Limpiar URLs rotos (que contienen /public/sign/ por bug del cliente Supabase)
    const fixUrl = (url) => {
      if (!url) return url
      return url.replace(/\/storage\/v1\/object\/public\/sign\/carousel-slides\//, '/storage/v1/object/public/carousel-slides/')
    }

    // Usar slide_urls guardadas en DB, o construirlas desde Storage como fallback
    let slideUrls = (carousel.slide_urls || []).map(fixUrl)
    if (!slideUrls.length) {
      // Intentar con .png primero (carruseles IA nuevos), luego .jpg
      for (let i = 1; i <= carousel.slide_count; i++) {
        const num = String(i).padStart(2, '0')
        const pathPng = `${id}/slide-${num}.png`
        const pathJpg = `${id}/slide-${num}.jpg`
        // Supabase getPublicUrl no valida si el archivo existe, usamos .png como preferencia para IA
        const ext = carousel.mode === 'ia' ? 'png' : 'jpg'
        slideUrls.push(makePublicUrl(`${id}/slide-${num}.${ext}`))
      }
    }

    res.json({ ok: true, carousel, slideUrls })
  } catch (err) {
    console.error('get-carousel error:', err)
    res.status(500).json({ error: err.message || 'Error cargando el carrusel' })
  }
}
