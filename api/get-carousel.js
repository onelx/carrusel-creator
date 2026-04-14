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

    const SUPABASE_URL = process.env.SUPABASE_URL

    // Reconstruir siempre el URL correcto extrayendo el path relativo
    // Esto arregla cualquier variante rota (/public/sign/, /sign/, etc.)
    const fixUrl = (url) => {
      if (!url) return url
      // Extraer todo lo que viene después de "carousel-slides/"
      const idx = url.indexOf('/carousel-slides/')
      if (idx !== -1) {
        const relativePath = url.substring(idx + '/carousel-slides/'.length).split('?')[0]
        return `${SUPABASE_URL}/storage/v1/object/public/carousel-slides/${relativePath}`
      }
      return url
    }

    // Usar slide_urls guardadas en DB, o construirlas desde Storage como fallback
    let slideUrls = (carousel.slide_urls || []).map(fixUrl)
    if (!slideUrls.length) {
      const ext = carousel.mode === 'ia' ? 'png' : 'jpg'
      for (let i = 1; i <= carousel.slide_count; i++) {
        const num = String(i).padStart(2, '0')
        slideUrls.push(`${SUPABASE_URL}/storage/v1/object/public/carousel-slides/${id}/slide-${num}.${ext}`)
      }
    }

    res.json({ ok: true, carousel, slideUrls })
  } catch (err) {
    console.error('get-carousel error:', err)
    res.status(500).json({ error: err.message || 'Error cargando el carrusel' })
  }
}
